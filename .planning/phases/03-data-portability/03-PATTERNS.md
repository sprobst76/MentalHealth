# Phase 3: Data Portability — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 4 (2 neue, 2 geänderte)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/app/routers/portability.py` | router | request-response (bulk read/write) | `backend/app/routers/modules.py` | exact |
| `backend/tests/test_portability.py` | test | request-response | `backend/tests/test_modules.py` | exact |
| `frontend/src/api.ts` | service/adapter | request-response | `frontend/src/api.local.ts` (Methoden-Signaturen) | role-match |
| `frontend/src/App.tsx` | component | event-driven | `frontend/src/App.tsx` selbst (modify) | — (eigene Datei) |

---

## Pattern Assignments

### `backend/app/routers/portability.py` (router, request-response)

**Analog:** `backend/app/routers/modules.py`

**Imports pattern** (Zeilen 1–21 von modules.py):
```python
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlmodel import Session, select

from ..auth import current_user_id
from ..db import get_session
from ..models import ModuleRecord
```

**Router-Deklaration** (Zeile 23 von modules.py — Muster übernehmen, Prefix anpassen):
```python
router = APIRouter(prefix="/api", tags=["portability"])
```

**Auth-Pattern** (Zeilen 90–96 von modules.py — gleiche Dependency-Injection):
```python
@router.get("/export")
def export_all(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    ...
```

**SELECT-Pattern für user-scoped Abfragen** (Zeilen 48–52 von modules.py):
```python
record = session.exec(
    select(ModuleRecord).where(
        ModuleRecord.user_id == user_id, ModuleRecord.module_id == module_id
    )
).first()
```
Für den Export alle Records des Users laden:
```python
records = session.exec(
    select(ModuleRecord).where(ModuleRecord.user_id == user_id)
).all()
```

**UPSERT-Pattern** (Zeilen 115–138 von modules.py — direkt wiederverwendbar für Import):
```python
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
Abweichung im Import: `spec.schema_version` durch `int(entry["schema_version"])` ersetzen,
`normalized` durch `entry["data"]`. Kein `session.refresh()` nötig, da Import kein Response-Objekt zurückgibt.

**Body-Parameter für generisches dict** (Zeile 102 von modules.py):
```python
payload: dict = Body(...)
```

**Error Handling in modules.py** (Zeilen 106–113):
```python
spec = get_module(module_id)
if spec is None:
    raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown module '{module_id}'.")

try:
    normalized = spec.validate(payload)
except Exception as exc:
    raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
```
Abweichung im Import: KEIN `get_module()`-Aufruf, KEINE Pydantic-Validierung.
Unbekannte Modul-IDs werden akzeptiert und direkt gespeichert (PORT-02).

**main.py Router-Registrierung** (Zeilen 10 und 37–38 von main.py — gleiches Muster):
```python
from .routers import health, modules, portability  # portability hinzufügen

app.include_router(portability.router)
```

---

### `backend/tests/test_portability.py` (test, request-response)

**Analog:** `backend/tests/test_modules.py`

**Test-Datei-Header** (Zeilen 1–8 von test_modules.py):
```python
from __future__ import annotations

import pytest
from sqlmodel import Session, select

from app.models import ModuleRecord
```

**Fixture-Nutzung** (alle Fixtures aus conftest.py, kein eigener Aufwand):
```python
# client, auth_headers, test_engine kommen alle aus conftest.py
@pytest.mark.asyncio
async def test_export_format(client, auth_headers):
    ...
```

**conftest.py AsyncClient + DB-Override** (Zeilen 26–41 von conftest.py — vollständig wiederverwendbar):
```python
@pytest.fixture
async def client(test_engine):
    from app.db import get_session

    def override_get_session():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac
    finally:
        app.dependency_overrides.pop(get_session, None)
```

**Round-trip-Testmuster** (Zeilen 55–69 von test_modules.py):
```python
@pytest.mark.asyncio
async def test_checkin_roundtrip(client, auth_headers):
    put_resp = await client.put(
        "/api/modules/checkin",
        json={"entries": []},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200, f"PUT failed: {put_resp.text}"
    get_resp = await client.get("/api/modules/checkin", headers=auth_headers)
    assert get_resp.status_code == 200, f"GET failed: {get_resp.text}"
    payload = get_resp.json()
    assert "data" in payload
```
Für Portability-Tests: `PUT /api/modules/{id}` zum Setup, dann `GET /api/export` prüfen,
dann `POST /api/import` + anschließend `GET /api/modules/{id}` für Round-trip.

**Direkter DB-Zugriff im Test** (Zeilen 28–36 von test_modules.py — für Assertions):
```python
with Session(test_engine) as session:
    record = session.exec(
        select(ModuleRecord).where(ModuleRecord.module_id == module_id)
    ).first()
    assert record is not None, "Record should exist after PUT"
```

---

### `frontend/src/api.ts` (service/adapter, request-response) — Modify

**Analog:** `frontend/src/api.local.ts` Zeilen 82–98 (Methoden-Signaturen als Referenz)

**Bestehende serverApi-Struktur** (Zeilen 27–36 von api.ts — Ergänzungspunkt):
```typescript
const serverApi = {
  listModules: () => request<ModuleSpecWire[]>("/api/modules"),
  getModule: <T>(id: string) => request<ModuleRecord<T>>(`/api/modules/${id}`),
  putModule: <T>(id: string, data: T) =>
    request<ModuleRecord<T>>(`/api/modules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  health: () => request<{ status: string }>("/health"),
  // ↓ HIER ergänzen:
  // exportAll: ...
  // importAll: ...
};
```

**request<T>-Helper** (Zeilen 18–25 von api.ts — wiederverwendbar für neue Methoden):
```typescript
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers(init?.headers) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}
```

**localApi-Signaturen als Typreferenz** (Zeilen 82–98 von api.local.ts):
```typescript
// localApi (synchron, kein await):
exportAll(): Record<string, unknown>
importAll(dump: Record<string, unknown>): void

// serverApi muss async sein (Promise-basiert):
exportAll(): Promise<Record<string, unknown>>
importAll(dump: Record<string, unknown>): Promise<void>
```
Beide Varianten müssen kompatibel mit `await api.exportAll()` in App.tsx sein.

**localApi importAll-Payload-Pattern** (Zeilen 91–98 von api.local.ts — zeigt erwartetes Format):
```typescript
importAll(dump: Record<string, unknown>): void {
  for (const mod of modules) {
    const entry = dump[mod.id];
    if (entry && typeof entry === "object") {
      localStorage.setItem(KEY(mod.id), JSON.stringify(entry));
    }
  }
},
```

---

### `frontend/src/App.tsx` (component, event-driven) — Modify

**Analog:** Eigene Datei — die zu ändernden Stellen sind präzise bekannt.

**Zu ändernde Stellen (Zeilen 1–36 von App.tsx):**

Zeile 3 entfernen:
```typescript
import { localApi } from "./api.local";  // ← ENTFERNEN (nicht mehr in App.tsx benötigt)
```

Zeilen 13–22 (exportJSON) — von synchron zu async umschreiben:
```typescript
// IST (fehlerhaft für Server-Modus):
function exportJSON() {
  const data = localApi.exportAll();  // hardcoded localApi
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kompass-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// SOLL (mode-aware):
async function exportJSON() {
  const data = await api.exportAll();  // unified api
  // blob/download-Logik bleibt identisch
}
```

Zeilen 24–36 (importJSON) — localApi durch api ersetzen, async machen:
```typescript
// IST:
function importJSON(file: File, onDone: () => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dump = JSON.parse(e.target?.result as string);
      localApi.importAll(dump);  // hardcoded localApi
      onDone();
    } catch {
      alert("Datei konnte nicht gelesen werden.");
    }
  };
  reader.readAsText(file);
}

// SOLL:
function importJSON(file: File, onDone: () => void) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const dump = JSON.parse(e.target?.result as string);
      await api.importAll(dump);  // unified api
      onDone();
    } catch {
      alert("Datei konnte nicht gelesen werden.");
    }
  };
  reader.readAsText(file);
}
```

**UI-Block (Zeilen 143–174 von App.tsx) — isLocal-Guard entfernen, beide Buttons anzeigen:**
```tsx
// IST: {isLocal && (...)} — Export/Import nur im lokalen Modus sichtbar
// SOLL: Buttons in beiden Modi anzeigen; isLocal-Konstante kann entfernt werden
// wenn sie sonst nicht mehr genutzt wird (Zeile 11: const isLocal = ...)
```

**Button-Styling-Muster** (Zeilen 145–158 von App.tsx — unverändert beibehalten):
```tsx
<button
  type="button"
  onClick={exportJSON}
  className="w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-paper-3 rounded-sm transition-colors"
>
  Daten exportieren
</button>
```

**onClick-Anpassung für async exportJSON:**
```tsx
// exportJSON ist jetzt async — void-cast für Event-Handler notwendig:
onClick={() => void exportJSON()}
```

---

## Shared Patterns

### Auth-Dependency
**Quelle:** `backend/app/routers/modules.py` Zeilen 90–96, `backend/app/auth.py` Zeilen 49–50
**Anwenden auf:** Alle neuen Endpoint-Funktionen in `portability.py`
```python
from ..auth import current_user_id

@router.get("/export")
def export_all(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    ...
```

### DB Session Dependency
**Quelle:** `backend/app/routers/modules.py` Zeile 93
**Anwenden auf:** Alle neuen Endpoint-Funktionen in `portability.py`
```python
from ..db import get_session
session: Session = Depends(get_session),
```

### `from __future__ import annotations`
**Quelle:** Alle Backend-Dateien (modules.py Zeile 6, auth.py Zeile 1, models.py Zeile 1)
**Anwenden auf:** `backend/app/routers/portability.py`, `backend/tests/test_portability.py`

### Test-Fixtures (kein Eigenaufwand)
**Quelle:** `backend/tests/conftest.py` — `client`, `auth_headers`, `test_engine`
**Anwenden auf:** `backend/tests/test_portability.py` — alle Fixtures sind sofort nutzbar

### request<T>-Helper in Frontend
**Quelle:** `frontend/src/api.ts` Zeilen 18–25
**Anwenden auf:** Neue `exportAll`/`importAll`-Methoden in `serverApi`
Keine eigene fetch-Logik bauen — immer über `request<T>(path, init?)`.

---

## No Analog Found

Kein File ohne Analog. Alle vier Dateien haben starke Analoga im bestehenden Code.

---

## Metadata

**Analog-Suchbereich:** `backend/app/routers/`, `backend/tests/`, `frontend/src/`
**Gelesene Dateien:** 9
**Pattern-Extraktion:** 2026-04-22
