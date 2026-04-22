---
phase: 03-data-portability
reviewed: 2026-04-22T10:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - backend/app/routers/portability.py
  - backend/app/main.py
  - backend/tests/test_portability.py
  - frontend/src/api.ts
  - frontend/src/App.tsx
  - .gitignore
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-22T10:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Die Phase-03-Implementierung deckt Export, Import und die Frontend-Integration ab. Der
Sicherheitsschnitt ist gut gelungen: `user_id` kommt ausschliesslich aus
`Depends(current_user_id)`, nie aus dem Payload, und alle SELECT-Statements filtern auf
`user_id`. Der Lazy-Migration-Ansatz (kein Schema-Enforce bei Import) ist bewusst
dokumentiert und architektonisch vertretbar.

Drei Warnungen betreffen echte Risiken: ein Typ-Mismatch zwischen `localApi.exportAll`
und `serverApi.exportAll` (der verhindern kann, dass der Export-Download im Offline-Modus
funktioniert), ein fehlender `JSON.parse`-Fehlerfall in `importJSON`, und ein fehlender
Datums-Fehlerfall im `test_import_roundtrip`-Test. Die drei Info-Punkte sind kleinere
Qualitaetsfragen.

---

## Warnings

### WR-01: `localApi.exportAll` gibt synchronen Wert zurueck, Aufrufer erwartet `Promise`

**File:** `frontend/src/api.local.ts:82` / `frontend/src/App.tsx:13`

**Issue:** `localApi.exportAll` ist als `exportAll(): Record<string, unknown>` deklariert —
ohne `Promise`. `serverApi.exportAll` gibt `Promise<Record<string, unknown>>` zurueck.
`App.tsx:13` ruft `await api.exportAll()` auf. Im Server-Modus funktioniert das korrekt.
Im Local-Modus gibt `await` auf einem Nicht-Promise-Wert zwar keinen Fehler (JS wrapped
es still in `Promise.resolve`), aber der TypeScript-Compiler sollte bei strikter
Interface-Pruefung warnen, und zukuenftige Aufrufer erwarten konsistent eine Promise.
Wichtiger: der gemeinsame `api`-Typ kann je nach Build-Pfad als Durchschnittsmenge
inferiert werden, was dann `exportAll` als synchron sieht — dann schlaegt `await`
semantisch fehl (kein Fehler, aber auch kein Download-Trigger, wenn der Aufruf-Kontext
das Ergebnis synchron weiterverarbeitet).

**Fix:**
```typescript
// frontend/src/api.local.ts
exportAll(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { _version: 1, _exported: new Date().toISOString() };
  for (const mod of modules) {
    const raw = localStorage.getItem(KEY(mod.id));
    if (raw) out[mod.id] = JSON.parse(raw);
  }
  return Promise.resolve(out);
},

importAll(dump: Record<string, unknown>): Promise<void> {
  for (const mod of modules) {
    const entry = dump[mod.id];
    if (entry && typeof entry === "object") {
      localStorage.setItem(KEY(mod.id), JSON.stringify(entry));
    }
  }
  return Promise.resolve();
},
```

Entsprechend in `frontend/src/types.ts` oder dem gemeinsamen Interface sicherstellen,
dass beide Adapter dieselbe Signatur haben.

---

### WR-02: `JSON.parse`-Fehler in `importJSON` wird nicht behandelt

**File:** `frontend/src/App.tsx:27`

**Issue:** `JSON.parse(e.target?.result as string)` wirft bei ungueltigem JSON eine
`SyntaxError`-Exception. Der umgebende `try/catch`-Block faengt zwar alle Fehler ab,
aber der `catch`-Zweig zeigt lediglich eine generische `alert`-Meldung. Kein Problem
bei Abstuerzen — aber `e.target?.result` kann `null` sein, wenn `FileReader.onload`
mit einem leeren Ergebnis feuert (z.B. leere Datei). `JSON.parse(null as any)` gibt
`null` zurueck (kein Fehler!), und das nachfolgende `api.importAll(null)` koennte den
Backend-Endpoint mit einem `null`-Body aufrufen, was zu einem unerwarteten 422 fuehrt.

**Fix:**
```typescript
reader.onload = async (e) => {
  try {
    const raw = e.target?.result;
    if (typeof raw !== "string" || !raw.trim()) {
      alert("Die Datei ist leer oder konnte nicht gelesen werden.");
      return;
    }
    const dump = JSON.parse(raw);
    if (!dump || typeof dump !== "object" || Array.isArray(dump)) {
      alert("Ungültiges Format: kein JSON-Objekt.");
      return;
    }
    await api.importAll(dump);
    onDone();
  } catch {
    alert("Datei konnte nicht gelesen werden.");
  }
};
```

---

### WR-03: Kein Schutz gegen masslosen Import-Payload (DoS-Vektor)

**File:** `backend/app/routers/portability.py:52-109`

**Issue:** `POST /api/import` akzeptiert ein beliebig grosses `dict` ohne Begrenzung der
Eintragsanzahl. Ein Angreifer mit gueltigem Token (oder bei nicht gesetztem Token) kann
Tausende von Eintraegen senden und damit unkontrolliert viele `ModuleRecord`-Zeilen
anlegen. Da `module_id` ein freier String ist und bei Import keine Laengenvalidierung
stattfindet, koennen auch Strings weit ueber die in `models.py` definierte
`max_length=50` hinaus ankommen — SQLite ignoriert `max_length` und speichert sie trotzdem.

Kontext: Single-User-Tool mit Bearer-Token-Schutz — das Risiko ist niedrig, aber nicht
null (falsches `.env`, versehentlicher Token-Leak). Dennoch fehlt ein einfacher Guard.

**Fix:**
```python
MAX_IMPORT_ENTRIES = 100
MODULE_ID_MAX_LEN = 50

@router.post("/import", status_code=200)
def import_all(payload: dict = Body(...), ...) -> dict:
    if len(payload) > MAX_IMPORT_ENTRIES:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Too many entries in import payload.")

    for key, entry in payload.items():
        if key.startswith("_") or not isinstance(entry, dict):
            continue
        if len(key) > MODULE_ID_MAX_LEN:
            skipped.append(key[:50] + "…")
            continue
        ...
```

---

## Info

### IN-01: `data`-Feld bei Import nicht auf `dict` geprueft

**File:** `backend/app/routers/portability.py:82`

**Issue:** `data = entry["data"]` kann jeden JSON-Typ annehmen — `null`, eine Zahl, ein
Array. `ModuleRecord.data` ist als `dict[str, Any]` typisiert. SQLite speichert jeden
JSON-Typ, aber spaeteren Code, der `record.data` als dict behandelt (z.B. Migration-Code),
kann abstuerzen. Die Lazyness beim Import ist beabsichtigt, aber zumindest ein
isinstance-Check auf `dict` wuerde den schlimmsten Fall abfangen.

**Vorschlag:**
```python
data = entry["data"]
if not isinstance(data, dict):
    skipped.append(key)
    continue
```

---

### IN-02: `test_import_stores_blob` prueft `user_id` nicht im DB-Record

**File:** `backend/tests/test_portability.py:58-64`

**Issue:** Der Direktcheck nach dem Import prueft nur, dass `ModuleRecord.module_id ==
"values"` existiert. Er prueft nicht, ob `record.user_id` der erwarteten User-ID
entspricht. Falls `user_id`-Filterung in Zukunft bricht, wuerde dieser Test den Fehler
nicht finden.

**Vorschlag:** `user_id` aus dem Token ermitteln und im Assert pruefen:
```python
from app.auth import SINGLE_USER_NAME
from app.models import User
with Session(test_engine) as session:
    user = session.exec(select(User).where(User.name == SINGLE_USER_NAME)).first()
    record = session.exec(
        select(ModuleRecord).where(
            ModuleRecord.module_id == "values",
            ModuleRecord.user_id == user.id,
        )
    ).first()
    assert record is not None
```

---

### IN-03: `VITE_KOMPASS_TOKEN` landet im Bundle und ist in DevTools sichtbar

**File:** `frontend/src/api.ts:5`

**Issue:** `const TOKEN = import.meta.env.VITE_KOMPASS_TOKEN ?? ""` wird zur Build-Zeit
eingebettet. Das ist fuer ein Single-User-Tool in einem privaten Netz akzeptabel, aber
es bedeutet, dass das Token im JS-Bundle im Klartext steht (weder Base64 noch sonstiger
Schutz). Wer Zugriff auf den Frontend-Bundle hat, kann das Token extrahieren.

Dies ist ein bekannter Tradeoff in Single-User-Deployments ohne separates Auth-System.
Eine alternative Annahme waere, den Token nur im Backend zu pruefen und das Frontend
mit einem Session-Cookie zu arbeiten — das ist aber ein groesserer Refactor, der CLAUDE.md
widersprechen wuerde.

**Dokumentationsvorschlag:** Einen kurzen Hinweis in `.env.example` ergaenzen:
```
# Hinweis: Das Token wird in den Frontend-Bundle eingebettet.
# Setze es trotzdem auf einen starken Wert — es schuetzt vor
# unautorisierten API-Zugriffen, nicht vor Bundle-Analyse.
KOMPASS_TOKEN=change-me-please
```

---

_Reviewed: 2026-04-22T10:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
