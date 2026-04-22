# Phase 4: Snapshot System — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 9 (2 new + 7 modified)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/app/routers/snapshots.py` | router | CRUD + request-response | `backend/app/routers/portability.py` | exact |
| `backend/tests/test_snapshots.py` | test | request-response | `backend/tests/test_portability.py` | exact |
| `backend/app/schemas/api.py` | schema | request-response | `backend/app/schemas/api.py` (self — extend) | exact |
| `backend/app/main.py` | config/wiring | — | `backend/app/main.py` (self — extend) | exact |
| `backend/app/modules/values.py` | module/model | CRUD | `backend/app/modules/values.py` (self — extend) | exact |
| `frontend/src/api.ts` | service/client | request-response | `frontend/src/api.ts` (self — extend) | exact |
| `frontend/src/api.local.ts` | service/adapter | CRUD + file-I/O | `frontend/src/api.local.ts` (self — extend) | exact |
| `frontend/src/types.ts` | model | — | `frontend/src/types.ts` (self — extend) | exact |
| `frontend/src/modules/synthese/SyntheseModule.tsx` | component | request-response | `frontend/src/modules/synthese/SyntheseModule.tsx` (self — extend) | exact |

---

## Pattern Assignments

### `backend/app/routers/snapshots.py` (router, CRUD + request-response)

**Analog:** `backend/app/routers/portability.py`

**Imports pattern** (`portability.py` lines 12–25):
```python
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, select

from ..auth import current_user_id
from ..db import get_session
from ..models import ModuleRecord, Snapshot
from ..modules.registry import get_module

logger = logging.getLogger(__name__)
```

**Router declaration + constants** (`portability.py` lines 27–30, adapt for snapshots):
```python
MAX_SNAPSHOTS = 200  # DoS guard — single-user tool

router = APIRouter(prefix="/api/snapshots", tags=["snapshots"])
```

**Auth + DB session injection pattern** (`portability.py` lines 33–36):
```python
@router.get("/export")
def export_all(
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
```
`user_id` always comes from `Depends(current_user_id)` — never from the request payload. This is the single enforced rule on every endpoint.

**SELECT filtered by user_id** (`portability.py` lines 39–41):
```python
records = session.exec(
    select(ModuleRecord).where(ModuleRecord.user_id == user_id)
).all()
```

**POST create pattern** (adapt from `portability.py` lines 55–117):
```python
@router.post("", status_code=201)
def create_snapshot(
    payload: dict = Body(default={}),
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
    count = session.exec(
        select(func.count()).select_from(Snapshot).where(Snapshot.user_id == user_id)
    ).one()
    if count >= MAX_SNAPSHOTS:
        raise HTTPException(status_code=422, detail=f"Snapshot limit ({MAX_SNAPSHOTS}) reached.")
    records = session.exec(
        select(ModuleRecord).where(ModuleRecord.user_id == user_id)
    ).all()
    modules_blob = {
        r.module_id: {"schema_version": r.schema_version, "data": r.data}
        for r in records
    }
    label = payload.get("label") or None
    snap = Snapshot(user_id=user_id, label=label, data={"modules": modules_blob})
    session.add(snap)
    session.commit()
    session.refresh(snap)
    return {"id": str(snap.id), "label": snap.label, "created_at": snap.created_at.isoformat()}
```
Note the `{"modules": modules_blob}` envelope — not a flat dict. This distinguishes snapshots from export format.

**Migration error guard pattern** (`modules.py` lines 62–80 — QUAL-04):
```python
data = record.data
if record.schema_version < spec.schema_version:
    try:
        data = spec.migrate(record.data, record.schema_version)
        record.schema_version = spec.schema_version
        record.data = data
        record.updated_at = datetime.now(timezone.utc)
        session.add(record)
        session.commit()
        session.refresh(record)
    except Exception as exc:
        logger.error(
            "Migration failed for module %r (stored v%d → spec v%d): %s",
            module_id,
            record.schema_version,
            spec.schema_version,
            exc,
            exc_info=True,
        )
        data = record.data  # fall back to raw; never raise 500
```
Apply this same try/except + logger.error pattern in the snapshot GET /{id} migration loop. Snapshots are immutable — do NOT write migrated data back to `snap.data`.

---

### `backend/tests/test_snapshots.py` (test, request-response)

**Analog:** `backend/tests/test_portability.py`

**File header + imports** (`test_portability.py` lines 1–7):
```python
from __future__ import annotations

import pytest
from sqlmodel import Session, select

from app.models import Snapshot
```

**Async test function shape** (`test_portability.py` lines 9–16):
```python
@pytest.mark.asyncio
async def test_create_snapshot(client, auth_headers):
    """SNAP-01: POST /api/snapshots crea snapshot con envelope {modules: ...}."""
    resp = await client.post("/api/snapshots", json={}, headers=auth_headers)
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    body = resp.json()
    assert "id" in body
    assert "modules" not in body  # metadata only on create response
```

**DB check pattern** (`test_portability.py` lines 59–63):
```python
with Session(test_engine) as session:
    snap = session.exec(
        select(Snapshot).where(Snapshot.id == UUID(body["id"]))
    ).first()
    assert snap is not None
    assert "modules" in snap.data  # envelope key
```

**Fixtures used:** `client`, `auth_headers`, `test_engine` — all provided by `conftest.py` unchanged.

---

### `backend/app/schemas/api.py` (schema, extend existing)

**Analog:** `backend/app/schemas/api.py` itself (lines 1–29)

**Existing file structure to preserve** (lines 1–29):
```python
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ModuleSpecResponse(BaseModel): ...
class ModuleDataResponse(BaseModel): ...
class SnapshotResponse(BaseModel):
    id: UUID
    label: str | None
    created_at: datetime
```

**Pattern to add — SnapshotFullResponse** (new class, same file, same style):
```python
class SnapshotFullResponse(BaseModel):
    id: UUID
    label: str | None
    created_at: datetime
    modules: dict[str, dict[str, Any]]  # {module_id: {schema_version, data}}
```
`str | None` union syntax (not `Optional[str]`) is consistent with the existing `SnapshotResponse` on line 28.

---

### `backend/app/main.py` (config/wiring, extend existing)

**Analog:** `backend/app/main.py` itself (lines 1–38)

**Router registration pattern** (lines 10, 37–38):
```python
from .routers import health, modules, portability, snapshots  # add snapshots import

app.include_router(health.router)
app.include_router(modules.router)
app.include_router(portability.router)
app.include_router(snapshots.router)  # add this line
```
Import added to the existing `from .routers import ...` line; `include_router` call added after `portability.router` in the same block.

---

### `backend/app/modules/values.py` (module/model, schema v1→v2)

**Analog:** `backend/app/modules/values.py` itself (lines 1–59)

**Current ValueItem to extend** (lines 20–25):
```python
class ValueItem(BaseModel):
    id: str
    label: str
    weight: int = Field(default=0, ge=0, le=5)
    note: str = ""
    # ADD:
    living: int = Field(default=0, ge=0, le=5)
```

**Migration dict pattern** (lines 44–47 — currently has only a comment example):
```python
migrations: dict[int, Any] = {
    2: lambda d: {
        **d,
        "selected": [{**v, "living": v.get("living", 0)} for v in d.get("selected", [])],
    },
}
```

**SPEC schema_version** (line 55):
```python
SPEC = ModuleSpec(
    id="values",
    ...
    schema_version=2,   # bumped from 1
    ...
)
```
The `Field(ge=0, le=5)` constraint on `living` mirrors the existing `weight` constraint — reuse the exact same pattern.

---

### `frontend/src/api.ts` (service/client, extend serverApi)

**Analog:** `frontend/src/api.ts` itself (lines 27–43)

**Existing serverApi object pattern to extend** (lines 27–43):
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
  exportAll: (): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>("/api/export"),
  importAll: (dump: Record<string, unknown>): Promise<void> =>
    request<void>("/api/import", {
      method: "POST",
      body: JSON.stringify(dump),
    }),
  // ADD:
  createSnapshot: (label?: string): Promise<SnapshotMeta> =>
    request<SnapshotMeta>("/api/snapshots", {
      method: "POST",
      body: JSON.stringify({ label: label ?? null }),
    }),
  listSnapshots: (): Promise<SnapshotMeta[]> =>
    request<SnapshotMeta[]>("/api/snapshots"),
  getSnapshot: (id: string): Promise<SnapshotFull> =>
    request<SnapshotFull>(`/api/snapshots/${id}`),
};
```
`SnapshotMeta` and `SnapshotFull` must be imported from `./types`. The `request<T>` generic wrapper handles auth headers and error parsing — no raw `fetch` calls needed.

---

### `frontend/src/api.local.ts` (service/adapter, localStorage)

**Analog:** `frontend/src/api.local.ts` itself (lines 1–100)

**Storage key convention** (line 12):
```typescript
const KEY = (id: string) => `kompass:module:${id}`;
// ADD for snapshots — two-key layout:
const SNAPS_KEY = "kompass:snapshots";
const SNAP_KEY = (id: string) => `kompass:snapshot:${id}`;
```

**Existing helper patterns to reuse** (lines 14–16, 82–99):
```typescript
function now(): string {
  return new Date().toISOString();
}
// Pattern: read all modules, build envelope, store separately
exportAll(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { _version: 1, _exported: new Date().toISOString() };
  for (const mod of modules) {
    const raw = localStorage.getItem(KEY(mod.id));
    if (raw) out[mod.id] = JSON.parse(raw);
  }
  return Promise.resolve(out);
},
```

**localApi method pattern** (lines 18–99 — method shape within object literal):
```typescript
export const localApi = {
  // ... existing methods ...

  createSnapshot(label?: string): Promise<SnapshotMeta> {
    const id = crypto.randomUUID();
    const created_at = now();
    const modulesBlob: Record<string, unknown> = {};
    for (const mod of modules) {
      const raw = localStorage.getItem(KEY(mod.id));
      if (raw) modulesBlob[mod.id] = JSON.parse(raw);
    }
    const meta: SnapshotMeta = { id, label: label ?? null, created_at };
    // Store full blob under separate key; metadata list separately
    localStorage.setItem(SNAP_KEY(id), JSON.stringify({ ...meta, modules: modulesBlob }));
    const metas: SnapshotMeta[] = loadSnaps();
    metas.unshift(meta);
    localStorage.setItem(SNAPS_KEY, JSON.stringify(metas));
    return Promise.resolve(meta);
  },

  listSnapshots(): Promise<SnapshotMeta[]> {
    return Promise.resolve(loadSnaps());
  },

  getSnapshot(id: string): Promise<SnapshotFull> {
    const raw = localStorage.getItem(SNAP_KEY(id));
    if (!raw) return Promise.reject(new Error(`Snapshot not found: ${id}`));
    return Promise.resolve(JSON.parse(raw) as SnapshotFull);
  },
};

function loadSnaps(): SnapshotMeta[] {
  const raw = localStorage.getItem(SNAPS_KEY);
  return raw ? (JSON.parse(raw) as SnapshotMeta[]) : [];
}
```
Key design rule: `SNAPS_KEY` holds metadata only (no blobs); each `SNAP_KEY(id)` holds one full blob. This prevents O(n) blob reads when listing.

---

### `frontend/src/types.ts` (model, extend existing)

**Analog:** `frontend/src/types.ts` itself (lines 1–19)

**Existing type pattern** (lines 1–19):
```typescript
export type Ref = { moduleId: string; id: string };

export interface ModuleRecord<T = unknown> {
  module_id: string;
  schema_version: number;
  data: T;
  updated_at: string | null;
}
```

**Types to add** (same file, same interface style):
```typescript
export interface SnapshotMeta {
  id: string;
  label: string | null;
  created_at: string;
}

export interface SnapshotModuleEntry {
  schema_version: number;
  data: unknown;
}

export interface SnapshotFull extends SnapshotMeta {
  modules: Record<string, SnapshotModuleEntry>;
}
```
`string | null` union (not `string | undefined`) matches the `updated_at: string | null` pattern already in the file.

---

### `frontend/src/modules/synthese/SyntheseModule.tsx` (component, extend existing)

**Analog:** `frontend/src/modules/synthese/SyntheseModule.tsx` itself (lines 1–212)

**Existing import + useState pattern** (lines 1–2, 131–132):
```typescript
import { useState } from "react";
import { Card } from "../../components/Card";
// ...
export function SyntheseModule({ allData }: ModuleProps<unknown>) {
  const [copied, setCopied] = useState(false);
```
Add snapshot state alongside `copied`:
```typescript
const [snaps, setSnaps] = useState<SnapshotMeta[]>([]);
const [snapLabel, setSnapLabel] = useState("");
const [snapLoading, setSnapLoading] = useState(false);
const [snapError, setSnapError] = useState<string | null>(null);
const [selectedA, setSelectedA] = useState<string | null>(null);
const [selectedB, setSelectedB] = useState<string | null>(null);
const [snapA, setSnapA] = useState<SnapshotFull | null>(null);
const [snapB, setSnapB] = useState<SnapshotFull | null>(null);
```

**Named function pattern for multi-step logic** (lines 141–157 — `copyReport`):
```typescript
async function copyReport() {
  const text = buildTextReport(allData as Record<string, any>);
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  } catch {
    // fallback...
  }
}
```
Model `createSnapshotHandler` and `loadSnapshots` after this: named async functions, try/catch, state updates on completion.

**Button pattern** (lines 169–176):
```tsx
<button
  type="button"
  onClick={createSnapshotHandler}
  className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors text-sm"
>
  Snapshot erstellen
</button>
```
Always `type="button"`. Use same `bg-ink text-paper rounded-sm` classes for primary actions, `border border-line text-ink-soft` for secondary.

**Card + section structure** (lines 190–204):
```tsx
{dataModules.map((m) => {
  return (
    <Card key={m.id} className="mb-6">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-ink-faint text-xs tracking-[0.2em] uppercase">
          Phase {m.phaseNum}
        </span>
        <h2 className="display text-2xl text-ink">{m.title}</h2>
      </div>
      ...
    </Card>
  );
})}
```
Snapshot list and comparison panel each go in their own `<Card className="mb-6">` blocks, appended before the disclaimer paragraph at line 206. Section labels use `text-xs tracking-[0.15em] uppercase text-ink-faint`.

**YSQ scoring inline pattern** (`YsqSummary.tsx` lines 16–21):
```typescript
const scored = YSQ_SCHEMAS.map((schema, i) => {
  const items = data.answers!.slice(i * 5, i * 5 + 5);
  const allNull = items.every((v) => v === null);
  const score = allNull
    ? null
    : items.reduce((sum, v) => (sum as number) + (v ?? 0), 0 as number);
  return { schema, score };
});
```
Extract as `function ysqSchemaScore(answers: (number | null)[], schemaIdx: number): number | null` inline in `SyntheseModule.tsx` (no separate file needed for this phase). Compare by schema index — do not look up schema by name across snapshots.

**Values delta comparison pattern** (derived from `SyntheseModule.tsx` lines 55–70, `buildTextReport`):
```typescript
// Build lookup by label (lowercased) — never by id
const valuesMapA = new Map(
  (snapA.modules.values?.data as ValuesData | undefined)?.selected?.map((v) => [
    v.label.toLowerCase(),
    v,
  ]) ?? [],
);
// Compute gap: weight - living for each value present in either snapshot
```
Compare by `v.label.toLowerCase()` — not by `v.id` — because IDs may diverge across snapshots if the user deleted and recreated a value.

---

## Shared Patterns

### Authentication (user_id injection)
**Source:** `backend/app/routers/portability.py` lines 33–36 + `backend/app/auth.py`
**Apply to:** All three endpoints in `snapshots.py`
```python
user_id: UUID = Depends(current_user_id),
```
`user_id` is ALWAYS from `Depends(current_user_id)`. The payload may contain a `label` field only — never a `user_id`.

### Error handling — migration fallback (QUAL-04)
**Source:** `backend/app/routers/modules.py` lines 62–80
**Apply to:** `GET /api/snapshots/{id}` migration loop
```python
try:
    data = spec.migrate(data, stored_version)
    stored_version = spec.schema_version
except Exception as exc:
    logger.error("Snapshot migration failed for %r: %s", module_id, exc, exc_info=True)
    # Return original data — never raise 500
```
Snapshots are immutable: do NOT write migrated data back to `snap.data` in the session.

### HTTP guard for unbounded writes
**Source:** `backend/app/routers/portability.py` lines 67–68 (`MAX_IMPORT_ENTRIES`)
**Apply to:** `POST /api/snapshots`
```python
MAX_SNAPSHOTS = 200
# raise HTTPException(422, ...) if count >= MAX_SNAPSHOTS
```

### Frontend `type="button"` rule
**Source:** `frontend/src/modules/synthese/SyntheseModule.tsx` lines 169, 175
**Apply to:** Every `<button>` in the new snapshot UI sections of `SyntheseModule.tsx`

### `from __future__ import annotations`
**Source:** Every backend file (e.g., `portability.py` line 12, `modules.py` line 1)
**Apply to:** `backend/app/routers/snapshots.py` — first non-blank line

### `Field(ge=0, le=5)` constraint
**Source:** `backend/app/modules/values.py` line 24
**Apply to:** New `living` field on `ValueItem` — exact same `Field(default=0, ge=0, le=5)` constraint

---

## No Analog Found

None. All files either have a direct analog or are extensions of themselves.

---

## Metadata

**Analog search scope:** `backend/app/routers/`, `backend/app/modules/`, `backend/app/schemas/`, `backend/tests/`, `frontend/src/`, `frontend/src/modules/`
**Files scanned:** 13 source files read directly
**Pattern extraction date:** 2026-04-22
