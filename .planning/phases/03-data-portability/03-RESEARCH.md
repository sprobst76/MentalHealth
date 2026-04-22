# Phase 3: Data Portability — Research

**Recherchiert:** 2026-04-22
**Domäne:** FastAPI Export/Import Endpoints + React API-Adapter-Erweiterung
**Konfidenz:** HIGH — alle Befunde aus direkter Codebase-Analyse und bestehendem HTML-v1-Export

---

<phase_requirements>
## Phase Requirements

| ID | Beschreibung | Research Support |
|----|-------------|-----------------|
| PORT-01 | Backend-Endpoint `GET /api/export` — JSON im HTML-v1-kompatiblen Flat-Format (`{_version, _exported, [module_id]: {schema_version, data}}`) | Export-Format aus reference/kompass-2026-04-20.json direkt vermessen; `ModuleRecord` SQL-Model liefert alle Felder |
| PORT-02 | Backend-Endpoint `POST /api/import` — akzeptiert Flat-Format, speichert rohe Blobs ohne Pydantic-Validierung, migriert lazy on next GET | `_load_or_default()` in modules.py implementiert Migration bereits; Import muss nur Blob schreiben + `schema_version` sichern |
| PORT-03 | `App.tsx` Export/Import mode-aware verdrahten — `api.exportAll()` und `api.importAll()` lösen auf lokale oder Server-seitige Impl auf; hardcodierter `localApi`-Aufruf entfernt | `exportJSON()` und `importJSON()` in App.tsx verwenden direkt `localApi` (nicht `api`) — genau diese Stellen müssen umgeschrieben werden |
| PORT-04 | Import-Button im lokalen Modus funktionsfähig; im Server-Modus deaktiviert mit erklärendem Hinweis wenn Endpoint nicht verfügbar | Aktuell zeigt `{isLocal && ...}` beide Buttons — muss zu `{(!isLocal oder localApi-Modus)} ...` mit Zustandslogik erweitert werden |
</phase_requirements>

---

## Summary

Phase 3 ist eine kleine, klar abgegrenzte Phase mit vier Arbeitsbereichen: zwei neue Backend-Endpoints, zwei Erweiterungen an bestehenden Frontend-Funktionen. Die gesamte Infrastruktur (DB-Modell, Migrations-Engine, Auth-Pattern, Router-Struktur) ist fertig und kann direkt wiederverwendet werden.

Das HTML-v1-Export-Format ist vollständig vermessen: ein flaches JSON-Objekt mit `_version: 1`, `_exported: ISO-Timestamp` und pro vorhandenem Modul einem Schlüssel `module_id: {schema_version, data, updated_at}`. Dieses Format muss beim Export exakt reproduziert werden und beim Import fehlertolerant eingelesen werden — d.h. unbekannte Modul-IDs und abweichende Schema-Versionen müssen akzeptiert werden.

Der kritischste Punkt ist PORT-03: `App.tsx` ruft `exportJSON()` und `importJSON()` heute mit fest verdrahteten `localApi`-Referenzen auf — unabhängig davon, ob die App im Server-Modus läuft. Diese Funktionen müssen so umgeschrieben werden, dass sie den universellen `api`-Adapter nutzen, der bereits `USE_LOCAL` auswertet. Dafür müssen `exportAll()` und `importAll()` in `serverApi` ergänzt werden.

**Primäre Empfehlung:** Alles in einer einzigen Wave von 3 Plänen umsetzen — Backend-Endpoints (PORT-01 + PORT-02), Frontend-API-Erweiterung (PORT-03), App.tsx-Verdrahtung + UI (PORT-04). Kein Alembic-Rev erforderlich: keine neuen Tabellen, kein Schema-Change.

---

## Architectural Responsibility Map

| Fähigkeit | Primäre Schicht | Sekundäre Schicht | Rationale |
|-----------|----------------|------------------|-----------|
| Export: alle Modul-Daten auslesen | Backend (API) | — | Server-Modus: DB-Zugriff nur im Backend; lokaler Modus: `localApi.exportAll()` existiert bereits |
| Export: Datei-Download auslösen | Browser (Frontend) | — | `Blob + URL.createObjectURL` ist Client-Operation |
| Import: Datei einlesen | Browser (Frontend) | — | `FileReader` ist Client-Operation |
| Import: Blobs schreiben | Backend (API) | — | Server-Modus: DB-Schreiben; lokal: `localApi.importAll()` existiert bereits |
| Mode-Entscheidung (local vs. server) | Frontend (`api.ts`) | — | `USE_LOCAL`-Flag bereits implementiert; serverApi/localApi unified unter `api` |
| UI-Schalter (Button aktiviert/deaktiviert) | Frontend (App.tsx) | — | Rein UI-Logik, kein API-Concern |

---

## Standard Stack

### Core (alle bereits im Projekt vorhanden)

| Bibliothek | Version | Zweck | Status |
|-----------|---------|-------|--------|
| FastAPI | >=0.115 | Backend Router | Vorhanden |
| SQLModel | >=0.0.32 | ORM für ModuleRecord-Abfragen | Vorhanden |
| Pydantic v2 | >=2.8 | Response-Schemas | Vorhanden |
| React 18 | ^18.3 | Frontend UI | Vorhanden |
| TypeScript 5.5 | ^5.5 | Typsicherheit | Vorhanden |

**Keine neuen Abhängigkeiten erforderlich.** [VERIFIED: Codebase-Analyse]

### Kein Alembic-Rev erforderlich

Das bestehende `module_records`-Schema deckt alle Felder ab, die Import braucht (`user_id`, `module_id`, `schema_version`, `data`). Keine neuen Tabellen. [VERIFIED: backend/app/models.py]

---

## Architecture Patterns

### System Architecture: Export/Import Datenfluss

```
EXPORT (Server-Modus):
  Browser → GET /api/export → FastAPI → SELECT * FROM module_records WHERE user_id=X
  → {_version, _exported, module_id: {schema_version, data}} → JSON Response
  → Frontend: Blob + URL.createObjectURL + <a>.click() → Datei-Download

EXPORT (Lokaler Modus):
  Browser → api.exportAll() → localApi.exportAll() → localStorage.getItem(KEY(id))
  → gleiche Envelope → Blob-Download (bereits implementiert)

IMPORT (Server-Modus):
  Browser → FileReader.readAsText(file) → POST /api/import body: flat-JSON
  → FastAPI: parse, für jede module_id → UPSERT module_records (raw blob, ohne Validierung)
  → 200 OK → Frontend: reload aktives Modul

IMPORT (Lokaler Modus):
  Browser → FileReader → api.importAll(dump) → localApi.importAll() → localStorage.setItem
  → bereits implementiert
```

### HTML-v1 Export-Format (vermessen, nicht angenommen)

Aus `reference/kompass-2026-04-20.json` direkt abgelesen [VERIFIED: Codebase-Analyse]:

```json
{
  "_version": 1,
  "_exported": "2026-04-20T16:34:01.372Z",
  "orientation": {
    "schema_version": 1,
    "data": { "responses": [...] },
    "updated_at": "2026-04-20T16:29:28.165Z"
  },
  "values": {
    "schema_version": 1,
    "data": { "selected": [...], "intentions": [...], "reflection": "..." },
    "updated_at": "2026-04-20T19:43:25.869Z"
  }
}
```

**Wichtige Beobachtung:** Das Flat-Format enthält `updated_at` auf Modul-Ebene, aber die Anforderung spezifiziert `{schema_version, data}` — `updated_at` ist optional und muss beim Import ignoriert werden können. Beim Export kann es mitgeliefert werden (mehr Daten = besser für Rückimport).

**Wichtige Abweichung:** Die Anforderung sagt `{_version, _exported, [module_id]: {schema_version, data}}`, das tatsächliche Format enthält zusätzlich `updated_at` im Modul-Eintrag. Beim Export kann `updated_at` eingeschlossen werden — das bricht keine Kompatibilität. Beim Import muss es ignoriert werden (Schlüssel einfach in `data`-Feld nicht schreiben).

### Recommended Project Structure

Keine neuen Verzeichnisse nötig. Neue Dateien:

```
backend/app/routers/
├── modules.py          (vorhanden — kein Export/Import hier)
├── portability.py      (NEU — GET /api/export, POST /api/import)
└── health.py           (vorhanden)

frontend/src/
├── api.ts              (ERWEITERN — exportAll/importAll zu serverApi hinzufügen)
└── App.tsx             (ÄNDERN — exportJSON/importJSON mode-aware machen)
```

### Pattern 1: Backend Export-Endpoint

```python
# Source: VERIFIED — Pattern aus backend/app/routers/modules.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from ..auth import current_user_id
from ..db import get_session
from ..models import ModuleRecord

router = APIRouter(prefix="/api", tags=["portability"])

@router.get("/export")
def export_all(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    records = session.exec(
        select(ModuleRecord).where(ModuleRecord.user_id == user_id)
    ).all()
    out: dict = {
        "_version": 1,
        "_exported": datetime.now(timezone.utc).isoformat(),
    }
    for r in records:
        out[r.module_id] = {
            "schema_version": r.schema_version,
            "data": r.data,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
    return out
```

### Pattern 2: Backend Import-Endpoint (raw blob, kein Validate)

```python
# Source: VERIFIED — Strategie aus STATE.md + modules.py _load_or_default
@router.post("/import", status_code=200)
def import_all(
    payload: dict = Body(...),
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    imported: list[str] = []
    skipped: list[str] = []
    now = datetime.now(timezone.utc)
    
    for key, entry in payload.items():
        if key.startswith("_") or not isinstance(entry, dict):
            continue  # Metadaten-Felder (_version, _exported) ignorieren
        if "data" not in entry or "schema_version" not in entry:
            skipped.append(key)
            continue
        
        module_id = key
        schema_version = int(entry["schema_version"])
        data = entry["data"]
        
        # UPSERT ohne Pydantic-Validierung — lazy migration on next GET
        record = session.exec(
            select(ModuleRecord).where(
                ModuleRecord.user_id == user_id,
                ModuleRecord.module_id == module_id,
            )
        ).first()
        
        if record is None:
            record = ModuleRecord(
                user_id=user_id,
                module_id=module_id,
                schema_version=schema_version,
                data=data,
                created_at=now,
                updated_at=now,
            )
        else:
            record.schema_version = schema_version
            record.data = data
            record.updated_at = now
        
        session.add(record)
        imported.append(module_id)
    
    session.commit()
    return {"imported": imported, "skipped": skipped}
```

**Warum kein Pydantic-Validate beim Import?** Das ist eine harte Anforderung (PORT-02 + STATE.md). Ein HTML-v1-Export kann Schema-Versionen enthalten, für die die aktuelle Pydantic-Schema-Klasse nicht passt. Die Migration läuft lazy beim nächsten GET über `_load_or_default()`.

### Pattern 3: serverApi um exportAll/importAll erweitern

```typescript
// Source: VERIFIED — Analogie zu api.local.ts exportAll/importAll
// In frontend/src/api.ts, serverApi-Objekt ergänzen:
const serverApi = {
  // ... bestehende Methoden ...
  
  async exportAll(): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>("/api/export");
  },
  
  async importAll(dump: Record<string, unknown>): Promise<void> {
    await request<unknown>("/api/import", {
      method: "POST",
      body: JSON.stringify(dump),
    });
  },
};
```

**Signatur-Kompatibilität:** `localApi.exportAll()` gibt `Record<string, unknown>` synchron zurück, `serverApi.exportAll()` gibt `Promise<Record<string, unknown>>` zurück. `App.tsx` muss `exportJSON` async machen. [VERIFIED: api.local.ts Zeilen 82-98]

### Pattern 4: App.tsx — mode-aware exportJSON/importJSON

```typescript
// Source: VERIFIED — aktueller Code App.tsx Zeilen 13-36
// Heute (fehlerhaft für Server-Modus):
function exportJSON() {
  const data = localApi.exportAll();  // ← hardcoded localApi
  // ...
}

// Korrekt (mode-aware):
async function exportJSON() {
  const data = await api.exportAll();  // ← unified api
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kompass-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file: File, onDone: () => void) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const dump = JSON.parse(e.target?.result as string);
      await api.importAll(dump);  // ← unified api
      onDone();
    } catch {
      alert("Datei konnte nicht gelesen werden.");
    }
  };
  reader.readAsText(file);
}
```

### Pattern 5: PORT-04 UI-Logik

```tsx
// Source: VERIFIED — aktueller Code App.tsx Zeilen 143-174
// Heute: nur im isLocal-Modus sichtbar
// Neu: im Server-Modus sichtbar, Import-Button deaktiviert mit Hinweis

// Beide Buttons immer anzeigen, Import im Server-Modus deaktiviert
<button type="button" onClick={exportJSON} ...>
  Daten exportieren
</button>
<button
  type="button"
  disabled={!isLocal}
  title={!isLocal ? "Import nur im lokalen Modus verfügbar" : undefined}
  onClick={() => fileRef.current?.click()}
  ...
>
  Daten importieren
</button>
{!isLocal && (
  <p className="text-xs text-ink-faint px-3">
    Import ist im Server-Modus über den Endpoint POST /api/import verfügbar.
  </p>
)}
```

**Achtung zur Anforderung PORT-04:** Die Anforderung sagt "deaktiviert wenn Backend-Endpoint nicht verfügbar". Die sauberste Interpretation: Der Import-Button ist im lokalen Modus immer aktiv; im Server-Modus entweder aktiv (wenn der Endpoint existiert — was er nach dieser Phase tut) oder deaktiviert mit Hinweis. Da POST /api/import nach PORT-02 immer existiert, ist der Button im Server-Modus einfach aktiv. Die "Fallback auf deaktiviert"-Logik ist nur für den Fall nötig, dass der Endpoint fehlt — das wäre ein Feature-Flag oder ein HTTP-Check. Einfachste Umsetzung: Im Server-Modus immer aktiviert (nach Phase 3), kein Health-Check nötig.

**Alternativer Ansatz für PORT-04:** Wenn die Anforderung wortgenau umgesetzt werden soll, müsste die App beim Start prüfen, ob POST /api/import antwortet (OPTIONS-Request oder Probe-Call). Das wäre Over-Engineering. Empfehlung: Im Server-Modus Button aktivieren (da Endpoint nach dieser Phase existiert) — das erfüllt den Geist der Anforderung.

### Anti-Patterns vermeiden

- **Pydantic-Validate beim Import:** Würde HTML-v1-Importe mit unbekannten Feldern brechen. Rohe Blobs direkt in DB schreiben.
- **Alembic-Rev für neue Routen:** Keine DB-Strukturänderungen — kein Migration Rev.
- **Separater Import-Router für bekannte Module:** Nicht moduleweise prüfen — generisch über alle Keys iterieren.
- **`localApi` direkt in exportJSON/importJSON:** Bricht Server-Modus. Immer über `api`-Adapter.

---

## Don't Hand-Roll

| Problem | Nicht selbst bauen | Verwenden | Warum |
|---------|-------------------|-----------|-------|
| Datei-Download im Browser | Eigenen Download-Manager | `Blob + URL.createObjectURL + <a>.click()` | Bereits in App.tsx Zeile 16-21 implementiert, Cross-Browser-kompatibel |
| Datei-Einlesen im Browser | Eigenen FileReader | `FileReader.readAsText` | Bereits in App.tsx Zeile 25-36 implementiert |
| DB-UPSERT | Eigene SQL-Strings | SQLModel `session.add()` + `session.commit()` | Pattern bereits in modules.py Zeilen 115-133 vorhanden |
| Auth in neuen Endpoints | Neues Auth-System | `Depends(current_user_id)` | Pattern bereits in allen bestehenden Endpoints vorhanden |

---

## Common Pitfalls

### Pitfall 1: `localApi` direkt in App.tsx statt `api`
**Was schiefläuft:** Export/Import im Server-Modus liest/schreibt localStorage statt DB. Aktuell so implementiert.
**Warum:** `importJSON()` und `exportJSON()` wurden geschrieben als nur lokaler Modus existierte.
**Wie vermeiden:** Alle `localApi`-Referenzen in `exportJSON`/`importJSON` durch `api` ersetzen; Import-Statement für `localApi` in App.tsx entfernen.
**Warnzeichen:** `import { localApi }` am Anfang von App.tsx (Zeile 4).

### Pitfall 2: Signature-Mismatch localApi vs. serverApi
**Was schiefläuft:** `localApi.exportAll()` ist synchron (`Record<string, unknown>`), `serverApi.exportAll()` muss async sein (`Promise<Record<string, unknown>>`). Wenn exportJSON nicht async gemacht wird, hat man einen Race Condition.
**Warum:** Netzwerk-Calls sind immer async; localStorage-Calls können synchron sein.
**Wie vermeiden:** `exportJSON` als `async function` deklarieren; `await api.exportAll()`.
**Warnzeichen:** TypeScript-Error wenn `api.exportAll()` Rückgabetyp `Promise<...>` ist und ohne `await` verwendet wird.

### Pitfall 3: Import verwirft unbekannte Module-IDs nicht
**Was schiefläuft:** Ein HTML-v1-Export enthält Modul-IDs, die im aktuellen Backend nicht registriert sind (z.B. `orientation` wenn das Modul umbenannt wurde). Diese sollten importiert werden — das Backend validiert beim Import nicht gegen das Registry.
**Warum:** PORT-02 sagt explizit "ohne Pydantic-Validierung" — das bedeutet auch ohne Registry-Check.
**Wie vermeiden:** Im Import-Endpoint NICHT `get_module(module_id)` aufrufen. Jeden Schlüssel direkt in DB schreiben. Bei unbekanntem Modul-ID gibt GET /api/modules/{id} dann 404 — das ist korrekt.

### Pitfall 4: Export-Endpoint gibt migrierten Inhalt zurück
**Was schiefläuft:** Wenn der Export-Endpoint `_load_or_default()` verwendet (wie GET /api/modules/{id}), gibt er migrierten Inhalt zurück. Das ist okay (besser sogar), aber das Paar Import→Export→Import muss trotzdem konsistent sein.
**Warum:** Kein Pitfall, sondern ein Design-Entscheid. Export kann entweder rohe DB-Blobs oder migrierte Daten ausgeben. Migrierte Daten sind besser für den Rückimport.
**Empfehlung:** Export gibt rohe DB-Blobs (direkte SELECT ohne Migration), da Migration beim nächsten GET sowieso läuft. Simpler Code.

### Pitfall 5: `updated_at` im Export-Format
**Was schiefläuft:** Das HTML-v1-Format enthält `updated_at` im Modul-Eintrag — die Anforderung spezifiziert es nicht explizit. Wenn der Import-Endpoint `updated_at` nicht ignoriert und versucht, es als Datum zu parsen oder ins `data`-Dict zu schreiben, gibt es Fehler.
**Wie vermeiden:** Import-Endpoint liest nur `schema_version` und `data` aus dem Modul-Eintrag; ignoriert alle anderen Schlüssel.

### Pitfall 6: CORS beim File-Download
**Was schiefläuft:** `GET /api/export` gibt JSON dirück — kein Content-Disposition-Header. Der Browser lädt es nicht automatisch herunter, sondern zeigt es im Tab an.
**Warum:** Das ist Backend-Verhalten; der Download-Trigger (Blob + `<a>.click()`) ist im Frontend.
**Wie vermeiden:** Download-Trigger bleibt im Frontend. Backend gibt normales JSON zurück; Frontend konvertiert es zu Blob und triggert Download — exakt wie heute für localApi.

---

## Code Examples

### Existing: localApi.exportAll (bereits korrekt implementiert)
```typescript
// Source: VERIFIED — frontend/src/api.local.ts Zeilen 82-98
exportAll(): Record<string, unknown> {
  const out: Record<string, unknown> = { _version: 1, _exported: new Date().toISOString() };
  for (const mod of modules) {
    const raw = localStorage.getItem(KEY(mod.id));
    if (raw) out[mod.id] = JSON.parse(raw);
  }
  return out;
},
```

### Existing: modules.py UPSERT-Pattern (wiederverwendbar für Import)
```python
# Source: VERIFIED — backend/app/routers/modules.py Zeilen 115-133
record = session.exec(
    select(ModuleRecord).where(
        ModuleRecord.user_id == user_id, ModuleRecord.module_id == module_id
    )
).first()

now = datetime.now(timezone.utc)
if record is None:
    record = ModuleRecord(
        user_id=user_id,
        module_id=module_id,
        schema_version=spec.schema_version,
        data=normalized,
        created_at=now,
        updated_at=now,
    )
else:
    record.schema_version = spec.schema_version
    record.data = normalized
    record.updated_at = now

session.add(record)
session.commit()
```

### Existing: App.tsx Export Button (muss umgeschrieben werden)
```typescript
// Source: VERIFIED — frontend/src/App.tsx Zeilen 13-22
// PROBLEM: localApi ist hardcoded
function exportJSON() {
  const data = localApi.exportAll();  // ← muss zu: await api.exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  // ... download trigger (bleibt gleich)
}
```

---

## State of the Art

| Alter Ansatz | Aktueller Stand | Änderung | Impact |
|-------------|----------------|----------|--------|
| Export/Import nur in isLocal-Modus sichtbar | Export + Import in beiden Modi sichtbar | Phase 3 | Server-Modus erhält volle Portabilität |
| `localApi` hardcoded in exportJSON/importJSON | `api`-Adapter unified | Phase 3 | Mode-aware, kein doppelter Code |
| Keine Export/Import-Backend-Endpoints | `GET /api/export` + `POST /api/import` | Phase 3 | HTML-v1-Kompatibilität in Server-Modus |

---

## Assumptions Log

| # | Claim | Abschnitt | Risiko wenn falsch |
|---|-------|-----------|-------------------|
| A1 | PORT-04 "Backend-Endpoint nicht verfügbar" bedeutet "nach Phase 3 immer verfügbar" — kein Runtime-Health-Check nötig | Common Pitfalls, Pattern 5 | Import-Button könnte im Server-Modus nie deaktiviert sein, wenn Anforderung einen echten Availability-Check meint |
| A2 | Export gibt rohe DB-Blobs zurück (kein Migration-Schritt), da lazy migration on next GET ausreicht | Pattern 1 | Wenn migrierten Inhalt im Export gewünscht wird, ändert sich die Export-Logik leicht |

**Anmerkung zu A1:** Der natürlichere Ansatz ist, im Server-Modus den Import-Button zu aktivieren (nach Phase 3 existiert der Endpoint). Wenn ein echter Availability-Check gewünscht ist, kann das in Phase 4 ergänzt werden.

---

## Open Questions

1. **PORT-04: Import im Server-Modus aktiviert oder nur angezeigt?**
   - Was bekannt ist: Die Anforderung sagt "deaktiviert mit erklärendem Hinweis wenn Backend-Endpoint nicht verfügbar"
   - Was unklar ist: Nach Phase 3 ist der Endpoint immer verfügbar — die Bedingung trifft nie zu
   - Empfehlung: Import-Button im Server-Modus aktivieren; erklärender Hinweis nur als Tooltip für den Fall, dass das Backend nicht erreichbar ist (HTTP-Fehler beim Import wird bereits durch `alert()` angezeigt)

---

## Environment Availability

| Dependency | Benötigt für | Verfügbar | Version | Fallback |
|-----------|-------------|-----------|---------|---------|
| pytest + httpx | Backend-Tests | Nur via venv | — | `pip install -e ".[dev]"` in backend/ |
| Node 20 | Frontend typecheck | ✗ (Host) | — | Docker: `node:20-alpine` |

**Fehlende Dependencies ohne Fallback:** Keine — alle Implementierungen brauchen nur den bestehenden Stack.

**Fehlende Dependencies mit Fallback:**
- pytest/httpx: Muss im Backend-venv installiert sein. Tests können alternativ via Docker laufen.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 8 + pytest-asyncio |
| Config file | `backend/pyproject.toml` — `asyncio_mode = "auto"` |
| Quick run command | `cd backend && pytest tests/test_portability.py -x -q` |
| Full suite command | `cd backend && pytest tests/ -q` |

### Phase Requirements → Test Map

| Req ID | Verhalten | Test-Typ | Automatisierter Befehl | Datei vorhanden? |
|--------|----------|---------|----------------------|-----------------|
| PORT-01 | GET /api/export gibt HTML-v1 Flat-Format zurück | Integration | `pytest tests/test_portability.py::test_export_format -x` | ❌ Wave 0 |
| PORT-01 | Export enthält alle gespeicherten Module | Integration | `pytest tests/test_portability.py::test_export_all_modules -x` | ❌ Wave 0 |
| PORT-02 | POST /api/import schreibt rohe Blobs in DB | Integration | `pytest tests/test_portability.py::test_import_stores_blob -x` | ❌ Wave 0 |
| PORT-02 | Import akzeptiert HTML-v1-Format (orientation+values) | Integration | `pytest tests/test_portability.py::test_import_html_v1_compat -x` | ❌ Wave 0 |
| PORT-02 | Import→GET rund-trip: Daten sichtbar nach Reload | Integration | `pytest tests/test_portability.py::test_import_roundtrip -x` | ❌ Wave 0 |
| PORT-03 | `api.exportAll()` existiert auf serverApi (TypeScript) | Unit (typecheck) | `cd frontend && npx tsc --noEmit` | ❌ Wave 0 |
| PORT-04 | Frontend-UI zeigt Export-Button in beiden Modi | Manual | — | Manual |

### Sampling Rate
- **Pro Task-Commit:** `cd backend && pytest tests/test_portability.py -x -q`
- **Pro Wave-Merge:** `cd backend && pytest tests/ -q`
- **Phase Gate:** Volle Suite grün vor `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/test_portability.py` — deckt PORT-01, PORT-02
- [ ] `backend/app/routers/portability.py` — neue Router-Datei (Wave 0 Stub, Wave 1 Implementierung)

*(Bestehende `conftest.py` + `test_modules.py` Infrastruktur ist vollständig nutzbar — kein neuer Fixture-Aufwand)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Kategorie | Betrifft | Standard Control |
|----------------|---------|-----------------|
| V2 Authentication | ja — neue Endpoints brauchen Auth | `Depends(current_user_id)` — Pattern aus modules.py übernehmen |
| V4 Access Control | ja — Export darf nur eigene Daten liefern | `WHERE user_id = Depends(current_user_id)` |
| V5 Input Validation | teilweise — Import nimmt beliebiges JSON | Strukturprüfung: `schema_version` als int, `data` als dict; keine Pydantic-Schema-Validierung |
| V6 Cryptography | nein | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Import überschreibt fremde User-Daten | Elevation of Privilege | `user_id` aus Auth-Dependency, nie aus Payload |
| Import mit riesigem JSON-Body (DoS) | Denial of Service | FastAPI Body-Size-Limit (default 1MB via Starlette; für diese App ausreichend) |
| Export leakt Daten anderer User | Information Disclosure | `WHERE user_id = current_user_id` — single-user in v1, aber Pattern ist korrekt |

---

## Sources

### Primary (HIGH confidence)

- `backend/app/routers/modules.py` — UPSERT-Pattern, Auth-Pattern, Router-Struktur
- `frontend/src/api.ts` + `frontend/src/api.local.ts` — serverApi/localApi-Interface, exportAll/importAll
- `frontend/src/App.tsx` — exportJSON/importJSON aktuell hardcoded auf localApi
- `reference/kompass-2026-04-20.json` — HTML-v1 Export-Format direkt vermessen
- `backend/app/models.py` — ModuleRecord-Felder (schema_version, data, user_id, module_id)
- `.planning/STATE.md` — gespeicherte Entscheidung: "Import must skip Pydantic validation"

### Secondary (MEDIUM confidence)

- FastAPI Docs (ASSUMED): `Body(...)` für generisches dict-Payload ist FastAPI-Standard; `Depends()` für Auth ist Kernmuster

---

## Metadata

**Konfidenz-Übersicht:**
- Backend-Endpoints: HIGH — Pattern direkt aus bestehendem Code ableitbar
- Frontend-Erweiterung: HIGH — serverApi-Interface klar, Signatur-Mismatch dokumentiert
- HTML-v1-Kompatibilität: HIGH — Format direkt aus Referenz-JSON vermessen
- UI-Logik PORT-04: MEDIUM — eine Design-Entscheidung offen (Button enabled vs. disabled nach Phase 3)

**Research-Datum:** 2026-04-22
**Gültig bis:** 2026-05-22 (stabiler Stack, keine sich schnell ändernden Dependencies)
