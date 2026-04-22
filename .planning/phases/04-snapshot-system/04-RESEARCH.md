# Phase 4: Snapshot System — Research

**Researched:** 2026-04-22
**Domain:** FastAPI snapshot endpoints + React UI (create / list / compare snapshots)
**Confidence:** HIGH

---

## Summary

The Snapshot DB table (`snapshots`) already exists in `0001_initial.py` — no Alembic migration is needed. The SQLModel `Snapshot` model is defined in `backend/app/models.py` with columns `id`, `user_id`, `label` (nullable), `data` (JSON), and `created_at`. There is no `updated_at`; snapshots are immutable once created.

The Pydantic response schema `SnapshotResponse` (id, label, created_at) already exists in `backend/app/schemas/api.py`. All structural scaffolding is in place — this phase is purely about writing the business logic: three backend endpoints, three API client methods, and snapshot UI embedded in `SyntheseModule.tsx`.

The most significant architectural detail: snapshot blobs use the envelope `{modules: {[id]: {schema_version, data}}}`, which differs from the export format (`{_version, _exported, [module_id]: {schema_version, data, updated_at}}`). Forward migration on `GET /api/snapshots/{id}` re-uses the existing `ModuleSpec.migrate()` method from `registry.py`. Migration is best-effort (log + return raw blob on error), matching the pattern already used in `routers/modules.py`.

A pre-existing schema drift exists between the frontend (`values` schemaVersion 2, adds `living` field) and the backend (`values` schema_version 1, no `living` field). The backend must be aligned to version 2 as part of this phase because snapshot data will be written from current module state (which includes `living`) and must round-trip correctly.

**Primary recommendation:** Add a `backend/app/routers/snapshots.py` router following the portability router pattern; embed snapshot UI sections inside `SyntheseModule.tsx` (no new page or route needed); add `createSnapshot`, `listSnapshots`, and `getSnapshot` methods to both `serverApi` and `localApi`.

---

## Project Constraints (from CLAUDE.md)

- Tech stack is locked: Python 3.12, FastAPI, SQLModel, Alembic (backend); React 18, TypeScript, Vite, Tailwind (frontend). No substitutions.
- No external state management framework. `useState` + `api.ts` wrapper only.
- `onChange` is always a full-replacement callback: `onChange({ ...data, field: newValue })`.
- Typographic German quotation marks in JSX text children or JS string literals via `{'…'}`, never in JSX attribute values.
- No emojis in code or UI text.
- All `<button>` elements must use `type="button"`.
- Optional fields use `= Field(default_factory=list)` or `= ""` — never `= None` unless genuinely nullable.
- `from __future__ import annotations` at top of every backend file.
- All config via `pydantic_settings.BaseSettings` in `config.py`; no direct `os.environ` reads.
- Named functions for multi-line logic; inline arrows only for one-liners.
- Modules must be registered in both backend `registry.py` MODULES list and `frontend/src/modules/registry.ts`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SNAP-01 | Backend `POST /api/snapshots` — creates snapshot with `{modules: {[id]: {schema_version, data}}}` + optional label | Snapshot model confirmed in models.py; portability router is the pattern to follow |
| SNAP-02 | Backend `GET /api/snapshots` — metadata list (id, label, created_at), no blob | SnapshotResponse schema already defined in schemas/api.py |
| SNAP-03 | Backend `GET /api/snapshots/{id}` — full snapshot, forward-migrated to current schema versions | ModuleSpec.migrate() is the migration mechanism; QUAL-04 error guard pattern applies |
| SNAP-04 | UI — user can create snapshot with optional label on Synthese page | SyntheseModule.tsx is the insertion point; existing button pattern from App.tsx |
| SNAP-05 | UI — chronological list of all snapshots (date, label) on Synthese page | Same component; list fetch on mount |
| SNAP-06 | UI — compare two snapshots: delta view for Values wichtig/gelebt ratings, YSQ scores, PHQ-9/GAD-7 totals | Delta data shape understood from existing types; scoring utilities exist in checkin/scoring.ts |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Snapshot creation (collect + persist) | API / Backend | — | Must read all ModuleRecords for user; DB write |
| Snapshot metadata listing | API / Backend | — | Simple SELECT query; no blob needed in list response |
| Forward migration of stored snapshot data | API / Backend | — | ModuleSpec.migrate() already lives in backend registry |
| Snapshot creation trigger (UI) | Frontend / React | — | User action on Synthese page; calls API |
| Snapshot list display | Frontend / React | — | Fetch on mount; render metadata |
| Snapshot comparison delta view | Frontend / React | — | Pure data computation from two fetched blobs; no backend logic |
| localStorage snapshot support | Frontend (offline mode) | — | localApi must mirror serverApi interface |

---

## Standard Stack

### Core (all already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | >=0.115 [VERIFIED: pyproject.toml] | HTTP endpoints | Project standard |
| SQLModel | >=0.0.32 [VERIFIED: pyproject.toml] | ORM + Pydantic v2 | Project standard |
| Pydantic | >=2.8 [VERIFIED: pyproject.toml] | Schema validation | Project standard |
| React 18 | 18.3 [VERIFIED: package.json] | UI framework | Project standard |
| TypeScript | 5.5 [VERIFIED: package.json] | Type safety | Project standard |

**No new npm or pip packages are required for this phase.** All functionality is built with existing stack.

---

## Architecture Patterns

### System Architecture Diagram

```
User action (Synthese page)
        |
        v
SyntheseModule.tsx
  ├── [Create Snapshot] button + label input
  │     └─── api.createSnapshot(label) ──→  POST /api/snapshots
  │                                               |
  │                                    read all ModuleRecords
  │                                    → {modules: {[id]: {schema_version, data}}}
  │                                    → INSERT INTO snapshots
  │
  ├── Snapshot list (mounted / after create)
  │     └─── api.listSnapshots() ──────→  GET /api/snapshots
  │                                       → [{id, label, created_at}]
  │
  └── Comparison panel (two snapshots selected)
        ├─── api.getSnapshot(id_A) ─────→  GET /api/snapshots/{id}
        │                                  → forward-migrate each module blob
        │                                  ← {modules: {[id]: {schema_version, data}}}
        ├─── api.getSnapshot(id_B) ─────→  same
        └── delta computation (frontend)
              Values: weight + living per label
              YSQ: score per schema (sum of 5 items)
              Checkin: latest PHQ-9/GAD-7 sum in snapshot
```

### Recommended File Changes

```
backend/app/
├── routers/
│   └── snapshots.py          ← NEW: POST /api/snapshots, GET /api/snapshots, GET /api/snapshots/{id}
├── schemas/
│   └── api.py                ← ADD: SnapshotFullResponse
├── main.py                   ← ADD: include_router(snapshots.router)
└── modules/
    └── values.py             ← FIX: schema_version 1→2, add living field, add migration

frontend/src/
├── api.ts                    ← ADD: createSnapshot, listSnapshots, getSnapshot to serverApi
├── api.local.ts              ← ADD: same methods to localApi (localStorage)
├── types.ts                  ← ADD: SnapshotMeta, SnapshotFull TypeScript interfaces
└── modules/synthese/
    └── SyntheseModule.tsx    ← ADD: snapshot create form + list + compare panel
```

### Pattern 1: Snapshot Router (mirrors portability.py)

```python
# Source: [VERIFIED: backend/app/routers/portability.py pattern]
from __future__ import annotations
from uuid import UUID
from fastapi import APIRouter, Body, Depends
from sqlmodel import Session, select
from ..auth import current_user_id
from ..db import get_session
from ..models import Snapshot, ModuleRecord
from ..modules.registry import get_module

router = APIRouter(prefix="/api/snapshots", tags=["snapshots"])

@router.post("", status_code=201)
def create_snapshot(
    payload: dict = Body(default={}),
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> dict:
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

### Pattern 2: Forward Migration on GET /{id}

```python
# Source: [VERIFIED: backend/app/routers/modules.py QUAL-04 pattern]
import logging
logger = logging.getLogger(__name__)

def _migrate_snapshot_modules(modules_blob: dict) -> dict:
    """Forward-migrate each module entry in the snapshot to current schema version."""
    result = {}
    for module_id, entry in modules_blob.items():
        spec = get_module(module_id)
        if spec is None:
            result[module_id] = entry  # unknown module — pass through unchanged
            continue
        stored_version = entry.get("schema_version", 1)
        data = entry.get("data", {})
        if stored_version < spec.schema_version:
            try:
                data = spec.migrate(data, stored_version)
                stored_version = spec.schema_version
            except Exception as exc:
                logger.error("Snapshot migration failed for %r: %s", module_id, exc, exc_info=True)
                # Return original data — never 500 (QUAL-04 principle)
        result[module_id] = {"schema_version": stored_version, "data": data}
    return result
```

### Pattern 3: Frontend API Methods

```typescript
// Source: [VERIFIED: frontend/src/api.ts serverApi pattern]
const serverApi = {
  // ... existing methods ...
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

### Pattern 4: localStorage Snapshot Implementation

For `localApi`, snapshots must persist across sessions. Use a dedicated localStorage key:

```typescript
// Source: [ASSUMED — derived from localApi pattern for modules]
const SNAPS_KEY = "kompass:snapshots";

function loadSnaps(): SnapshotMeta[] {
  const raw = localStorage.getItem(SNAPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// createSnapshot: read all module blobs, assemble envelope, push to snap list
// getSnapshot: reads stored full blob (store separately: kompass:snapshot:{id})
// listSnapshots: reads SNAPS_KEY metadata list
```

**Key insight:** localStorage snapshots must store the full blob separately from the metadata list (one key per snapshot full data, one key for the sorted metadata list). This prevents re-parsing the full list to find metadata.

### Pattern 5: Delta Comparison Component

The comparison panel is frontend-only. It receives two `SnapshotFull` objects and computes deltas inline:

```typescript
// Source: [VERIFIED: SyntheseModule.tsx, YsqSummary.tsx, checkin/scoring.ts patterns]

// Values delta: for each value label present in either snapshot
type ValueDelta = { label: string; weightA: number; livingA: number; weightB: number; livingB: number };

// YSQ delta: per-schema score (sum of 5 items, null if all skipped)
// schemaScore(answers, schemaIdx) = answers.slice(i*5, i*5+5).reduce(...)

// Checkin delta: latest entry PHQ-9 sum + GAD-7 sum from each snapshot
// sumAnswers() already exported from checkin/scoring.ts
```

### Anti-Patterns to Avoid

- **Snapshot on GET migration that writes back to the snapshot row:** Snapshots are immutable — migration is read-only, in-memory. Never update `snapshots.data` during a GET.
- **Pydantic validation of snapshot module blobs on write:** POST must accept raw blobs (same reason as import: old schema data must be storable without current-schema validation).
- **Fetching both snapshot blobs before the user selects both:** Fetch each blob only when its snapshot ID is selected. Two separate `useEffect` / event handlers.
- **Comparing by value ID across snapshots:** Value IDs are stable per user session but may differ if data was ever reset. Compare by label string for the delta view, not by ID.
- **Deleting migration functions:** Old snapshots depend on the full migration chain from their stored schema_version to current. Migration functions must never be removed (confirmed in STATE.md decisions).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Forward migration of old snapshot blobs | Custom version-chaining logic | `ModuleSpec.migrate(data, from_version)` | Already handles chain-of-versions correctly |
| Date formatting in snapshot list | Custom formatter | `toLocaleDateString("de-DE", ...)` pattern from `checkin/scoring.ts` `formatDate()` | Already in codebase, consistent locale |
| YSQ score per schema | Re-implement 5-item sum | `YsqSummary.tsx` scoring logic (slice + reduce) | Identical computation, extract to a shared utility |
| Auth + user_id injection | Custom middleware | `Depends(current_user_id)` from `auth.py` | Already handles single-user + token check |

**Key insight:** Every non-trivial helper needed for this phase already exists in the codebase. This phase is about wiring, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Backend Values Schema Drift (CRITICAL)

**What goes wrong:** The frontend `values` module is at `schemaVersion: 2` (adds `living: number` field via migration in `frontend/src/modules/values/index.ts`). The backend `values.py` is still at `schema_version: 1` and has no `living` field in `ValueItem`. When a snapshot is created in server mode, the current values data (v2 with `living`) is already stored in `module_records`. The snapshot captures it correctly. However, if the backend's `ValueItem` is ever used to validate values data coming in via PUT, it will strip the `living` field silently (Pydantic ignores extra fields by default unless `model_config = ConfigDict(extra='forbid')`).

**Why it happens:** Frontend migration was added without a corresponding backend migration.

**How to avoid:** Add `living: int = Field(default=0, ge=0, le=5)` to backend `ValueItem`, bump `schema_version` to 2, add migration `{2: lambda d: {**d, "selected": [{**v, "living": 0} for v in d.get("selected", [])]}}`. This is a prerequisite for SNAP-01 correctness.

**Warning signs:** Values data PUT'd via API loses the `living` field; GET returns `living: 0` even when user had set it.

### Pitfall 2: Snapshot Envelope Mismatch with Export Format

**What goes wrong:** Planner confuses the snapshot format with the export format. Export uses flat format `{_version, _exported, module_id: {schema_version, data}}`. Snapshots use `{modules: {module_id: {schema_version, data}}}` — nested under `"modules"` key.

**Why it happens:** Both formats look similar at first glance.

**How to avoid:** Always wrap snapshot data under `"modules"` key on POST. On GET /{id}, extract `snap.data["modules"]` before running migration loop. Add an explicit test asserting the `"modules"` key is present.

**Warning signs:** GET /api/snapshots/{id} returns a flat blob; comparison frontend fails because `modules` key is missing.

### Pitfall 3: Comparison by Value ID Across Snapshots

**What goes wrong:** Value items have UUIDs as IDs. If a user deleted and re-added a value with the same label, the IDs differ across two snapshots. Comparing by `id` produces empty or wrong deltas.

**Why it happens:** Natural instinct is to use the unique ID for lookup.

**How to avoid:** Build the comparison index by `label` (lowercased). Accept that label collisions (two values with the same name) are a user's problem — it's an edge case in a single-user personal tool.

**Warning signs:** Delta view shows all values as "not found in snapshot A" even though they exist.

### Pitfall 4: localApi Snapshot Storage Layout

**What goes wrong:** Storing all snapshot blobs in a single localStorage key causes O(n) read/write on every operation as the blob list grows.

**Why it happens:** Simple design — just push to one array.

**How to avoid:** Use separate keys: `kompass:snapshots` for the metadata list (sorted, no blobs), `kompass:snapshot:{id}` for each full blob. Metadata list is loaded for SNAP-05 list view; individual blob is loaded only when comparison is triggered (SNAP-06).

**Warning signs:** localStorage key grows unbounded; slow comparison fetch.

### Pitfall 5: Snapshot create button triggers on unloaded modules

**What goes wrong:** If `SyntheseModule` renders before all modules are loaded in `store`, the snapshot captures default (empty) data for unloaded modules.

**Why it happens:** `App.tsx` loads modules lazily (only when navigated to). Synthese module does not trigger module loads for all sibling modules.

**How to avoid:** In `App.tsx`, when user navigates to Synthese, pre-load all modules eagerly (or confirm all `store[id].loaded === true` before enabling the Create Snapshot button). Alternatively, the backend implementation avoids this entirely — `POST /api/snapshots` reads from `module_records` in the DB, not from the frontend's in-memory state. In server mode, all persisted data is captured regardless of what is loaded in the UI.

**Warning signs:** Snapshot shows empty values for modules the user hasn't visited in this session (server mode is immune; local mode is vulnerable).

---

## Code Examples

### Backend: SnapshotFullResponse schema

```python
# Source: [VERIFIED: backend/app/schemas/api.py — extend existing file]
from typing import Any

class SnapshotFullResponse(BaseModel):
    id: UUID
    label: str | None
    created_at: datetime
    modules: dict[str, dict[str, Any]]  # {module_id: {schema_version, data}}
```

### Frontend: Type contracts

```typescript
// Source: [VERIFIED: frontend/src/types.ts — extend existing file]

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

### YSQ score extraction (needed for SNAP-06)

```typescript
// Source: [VERIFIED: frontend/src/modules/ysq/YsqSummary.tsx scoring logic]
// Extract into a shared utility or inline in comparison component
function ysqSchemaScore(answers: (number | null)[], schemaIdx: number): number | null {
  const items = answers.slice(schemaIdx * 5, schemaIdx * 5 + 5);
  const allNull = items.every((v) => v === null);
  if (allNull) return null;
  return items.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}
```

### Backend: Values module v2 upgrade

```python
# Source: [VERIFIED: backend/app/modules/values.py — modify existing]
class ValueItem(BaseModel):
    id: str
    label: str
    weight: int = Field(default=0, ge=0, le=5)
    living: int = Field(default=0, ge=0, le=5)   # added in v2
    note: str = ""

migrations: dict[int, Any] = {
    2: lambda d: {
        **d,
        "selected": [{**v, "living": v.get("living", 0)} for v in d.get("selected", [])],
    },
}

SPEC = ModuleSpec(
    id="values",
    ...
    schema_version=2,   # bumped from 1
    ...
)
```

---

## Pre-existing Schema Drift (Action Required Before SNAP-01)

[VERIFIED: cross-referencing frontend/src/modules/values/index.ts and backend/app/modules/values.py]

| Side | File | schema_version | living field? |
|------|------|----------------|---------------|
| Frontend | `modules/values/index.ts` | 2 | Yes (added by migration) |
| Backend | `modules/values.py` | 1 | No |

**This drift must be resolved in this phase.** The backend `ValueItem` must gain `living: int = Field(default=0, ge=0, le=5)`, and `schema_version` must be bumped to 2 with a corresponding migration. If not fixed, PUT to `/api/modules/values` will silently strip `living` from stored data.

---

## Existing Infrastructure Inventory

[VERIFIED: reading all referenced files]

| Item | Status | File |
|------|--------|------|
| `snapshots` DB table | EXISTS — `0001_initial.py` | `backend/alembic/versions/0001_initial.py` |
| `Snapshot` SQLModel | EXISTS | `backend/app/models.py:38-45` |
| `SnapshotResponse` Pydantic schema | EXISTS (partial — id, label, created_at) | `backend/app/schemas/api.py:26-29` |
| Snapshot router | MISSING | needs `backend/app/routers/snapshots.py` |
| `main.py` router registration | MISSING | needs `include_router(snapshots.router)` |
| `serverApi.createSnapshot` | MISSING | `frontend/src/api.ts` |
| `serverApi.listSnapshots` | MISSING | `frontend/src/api.ts` |
| `serverApi.getSnapshot` | MISSING | `frontend/src/api.ts` |
| `localApi` snapshot methods | MISSING | `frontend/src/api.local.ts` |
| `SnapshotMeta`, `SnapshotFull` TS types | MISSING | `frontend/src/types.ts` |
| Snapshot UI in SyntheseModule | MISSING | `frontend/src/modules/synthese/SyntheseModule.tsx` |
| `SnapshotFullResponse` Pydantic schema | MISSING | `backend/app/schemas/api.py` |

**No Alembic migration needed.** The `snapshots` table is created by `0001_initial.py` which is already the initial migration.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 8 + pytest-asyncio [VERIFIED: backend/pyproject.toml] |
| Config file | `backend/pyproject.toml` `[tool.pytest.ini_options]` |
| Quick run command | `cd backend && python -m pytest tests/test_snapshots.py -x -q` |
| Full suite command | `cd backend && python -m pytest tests/ -q` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SNAP-01 | POST /api/snapshots stores modules envelope | integration | `pytest tests/test_snapshots.py::test_create_snapshot -x` | No — Wave 0 |
| SNAP-01 | POST /api/snapshots with label stores label | integration | `pytest tests/test_snapshots.py::test_create_snapshot_label -x` | No — Wave 0 |
| SNAP-02 | GET /api/snapshots returns metadata list, no data blob | integration | `pytest tests/test_snapshots.py::test_list_snapshots -x` | No — Wave 0 |
| SNAP-03 | GET /api/snapshots/{id} returns migrated modules | integration | `pytest tests/test_snapshots.py::test_get_snapshot_migrated -x` | No — Wave 0 |
| SNAP-03 | GET /api/snapshots/{id} returns raw data if migration fails (QUAL-04) | integration | `pytest tests/test_snapshots.py::test_get_snapshot_migration_error -x` | No — Wave 0 |
| SNAP-04 | Snapshot creation UI trigger | manual-only | — (no Vitest in project) | N/A |
| SNAP-05 | Snapshot list display | manual-only | — | N/A |
| SNAP-06 | Delta comparison | manual-only | — | N/A |

### Sampling Rate

- **Per task commit:** `cd backend && python -m pytest tests/test_snapshots.py -x -q`
- **Per wave merge:** `cd backend && python -m pytest tests/ -q`
- **Phase gate:** Full backend suite green before `/gsd-verify-work`

### Wave 0 Gaps

- `backend/tests/test_snapshots.py` — covers SNAP-01, SNAP-02, SNAP-03 (new file, follows `test_portability.py` pattern)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.12 | Backend | Yes | 3.12.3 [VERIFIED] | — |
| Node 24 | Frontend | Yes | 24.15.0 [VERIFIED] | — |
| npm | Frontend | Yes | 11.12.1 [VERIFIED] | — |
| pytest / pytest-asyncio | Backend tests | Yes (in venv) | >=8 [VERIFIED: pyproject.toml] | — |
| SQLite | Dev DB | Yes | built-in | — |

No missing dependencies.

---

## Security Domain

Phase adds three new API endpoints. All require authentication via existing `Depends(current_user_id)`.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | `user_id` always from `Depends(current_user_id)`, never from payload — same as portability router |
| V5 Input Validation | Yes | label field: strip/None; `MAX_SNAPSHOTS` guard recommended (prevent unbounded writes) |
| V3 Session Management | No | Handled by existing auth middleware |
| V6 Cryptography | No | No crypto in this feature |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Snapshot data contains another user's data | Elevation of Privilege | SELECT must filter on `user_id` (same as portability router) |
| Label injection | Tampering | label stored as raw string; never executed; SQLModel parameterizes queries |
| Unbounded snapshot creation | DoS | Add `MAX_SNAPSHOTS = 200` guard on POST (reject or trim oldest) |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single Alembic migration creates all tables | Same — no change needed | Initial project setup | No migration work for this phase |
| Frontend values at schemaVersion 1 | Frontend values at schemaVersion 2 (added living field) | Phase 2 (content gaps) | Backend must catch up to v2 |

**Deprecated/outdated:**
- Backend `values.py` at `schema_version=1`: must be updated to 2 with `living` field before snapshots are meaningful.

---

## Open Questions

1. **Snapshot limit / retention policy**
   - What we know: No limit is defined anywhere; the DB table has no constraint.
   - What's unclear: Should there be a cap (e.g., 200 snapshots) to prevent unbounded growth?
   - Recommendation: Add `MAX_SNAPSHOTS = 200` guard on POST. If count >= 200, return HTTP 422 with clear message. This is a single-user tool — 200 is generous but bounded.

2. **Snapshot comparison when a module has no data in one snapshot**
   - What we know: `POST /api/snapshots` collects only records that exist in `module_records` (records that have been PUT at least once). A module never written has no record.
   - What's unclear: Should missing module entries in a snapshot be treated as "no data" or as "default data" for delta computation?
   - Recommendation: Treat as "no data" — render a "—" placeholder in the comparison column. Do not synthesize defaults, as they would be misleading.

3. **SNAP-06 comparison scope: only 3 modules specified (Values, YSQ, Checkin)**
   - What we know: SNAP-06 requirement explicitly lists `Values wichtig/gelebt ratings, YSQ scores, PHQ-9/GAD-7 totals`.
   - What's unclear: Do BeliefSchema intensity ratings, Goals status, or Obstacles belong in the comparison?
   - Recommendation: Implement exactly what SNAP-06 specifies (3 modules). A future phase can extend the comparison.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | localStorage comparison should use `label` as join key (not `id`) for Values delta | Common Pitfalls / Code Examples | Delta view shows empty/wrong results if IDs are stable per-user and could be used safely |
| A2 | `MAX_SNAPSHOTS = 200` is an appropriate limit for single-user | Open Questions / Security | Too low: user hit limit prematurely. Too high: unbounded growth (low risk on SQLite) |
| A3 | localApi snapshot blobs stored as separate `kompass:snapshot:{id}` keys | Code Examples | If combined into one key, large snapshot lists could hit localStorage size limits (~5MB) |

---

## Sources

### Primary (HIGH confidence)

- `backend/app/models.py` — Snapshot SQLModel confirmed, all columns verified
- `backend/alembic/versions/0001_initial.py` — snapshots table created in initial migration, no further migration needed
- `backend/app/schemas/api.py` — SnapshotResponse already exists; needs SnapshotFullResponse added
- `backend/app/routers/portability.py` — reference pattern for new snapshots router
- `backend/app/routers/modules.py` — QUAL-04 migration error guard pattern to replicate
- `backend/app/modules/registry.py` — ModuleSpec.migrate() API confirmed
- `frontend/src/modules/values/index.ts` — schemaVersion 2 confirmed; living migration confirmed
- `frontend/src/modules/synthese/SyntheseModule.tsx` — existing Synthese page structure
- `frontend/src/api.ts` — serverApi method pattern
- `frontend/src/api.local.ts` — localApi pattern for localStorage

### Secondary (MEDIUM confidence)

- `frontend/src/modules/ysq/YsqSummary.tsx` — YSQ per-schema scoring logic (will be extracted for delta view)
- `frontend/src/modules/checkin/scoring.ts` — `sumAnswers`, `formatDate` utilities confirmed

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries confirmed in pyproject.toml / package.json
- Architecture: HIGH — all patterns verified from existing codebase; no external APIs
- Pitfalls: HIGH — schema drift and envelope format mismatch verified by direct file inspection
- Validation: HIGH — conftest.py and test_portability.py patterns confirmed; gap is new test file only

**Research date:** 2026-04-22
**Valid until:** 2026-06-22 (stable codebase; no fast-moving external dependencies)
