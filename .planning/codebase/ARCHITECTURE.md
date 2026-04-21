# Architecture

**Analysis Date:** 2026-04-21

## Pattern Overview

**Overall:** Modular Registry Pattern — client/server SPA with a generic backend and autonomous frontend modules.

**Key Characteristics:**
- Every reflection module is self-contained: it owns its Pydantic schema, default data factory, and data-migration chain
- A central registry (backend + frontend) assembles modules into navigation, progress, and synthesis — automatically
- The database stores one generic JSON blob per (user, module); no per-module tables
- The frontend runs in two modes: server-backed (API calls to FastAPI) or fully offline (localStorage via `api.local.ts`)

## Layers

**Backend — API Layer:**
- Purpose: Validates, stores, and migrates module data; issues and checks bearer tokens
- Location: `backend/app/`
- Contains: FastAPI app, routers, Pydantic schemas, SQLModel models, auth
- Depends on: Module registry, database session, config
- Used by: Frontend API client (`frontend/src/api.ts`)

**Backend — Module Registry:**
- Purpose: Declares every module's identity, schema, defaults, and data-migration chain; no HTTP concerns
- Location: `backend/app/modules/registry.py` and individual module files (`backend/app/modules/*.py`)
- Contains: `ModuleSpec` dataclass, `MODULES` list, `get_module()`, per-module SPEC exports
- Depends on: Pydantic `BaseModel`
- Used by: `backend/app/routers/modules.py`

**Backend — Persistence Layer:**
- Purpose: SQLModel ORM wrappers over SQLite (dev) or Postgres (prod)
- Location: `backend/app/models.py`, `backend/app/db.py`
- Contains: `User`, `ModuleRecord`, `Snapshot` SQLModel tables
- Depends on: SQLAlchemy, database URL from config
- Used by: All routers via `Depends(get_session)`

**Frontend — App Shell:**
- Purpose: Layout, sidebar navigation, active-module switching, crisis banner, data loading, import/export
- Location: `frontend/src/App.tsx`
- Contains: `Store` state (one `ModuleState` per module), `loadModule`, `handleChange` callbacks
- Depends on: `modules/registry.ts`, `api.ts`, `lib/migrations.ts`
- Used by: `main.tsx` as root component

**Frontend — Module Registry:**
- Purpose: Declares all `ModuleDef` objects; drives navigation order, routing, and summary chain
- Location: `frontend/src/modules/registry.ts`
- Contains: `ModuleDef` interface, `modules` array, `getModule()` helper
- Depends on: Each module's `index.ts` export
- Used by: `App.tsx`, `SyntheseModule.tsx`, any cross-module lookup

**Frontend — API Client:**
- Purpose: Thin fetch wrapper; auto-selects server API or localStorage adapter based on `VITE_STORAGE`
- Location: `frontend/src/api.ts` (server mode), `frontend/src/api.local.ts` (offline mode)
- Contains: `serverApi`, `localApi`, unified `api` export
- Depends on: `VITE_API_BASE`, `VITE_KOMPASS_TOKEN`, `VITE_STORAGE` env vars
- Used by: `App.tsx`

**Frontend — Module Layer:**
- Purpose: One self-contained directory per module with its component, summary block, types, and constants
- Location: `frontend/src/modules/<name>/`
- Contains: `index.ts` (exports `ModuleDef`), `<Name>Module.tsx`, `<Name>Summary.tsx`, `types.ts`, `constants.ts`
- Depends on: Shared components from `frontend/src/components/`
- Used by: Module registry imports each module's `index.ts`

## Data Flow

**Read (active module load):**

1. User navigates to a module — `App.tsx` calls `loadModule(id)`
2. `api.getModule(id)` issues `GET /api/modules/{id}` (or reads `localStorage`)
3. Server looks up `ModuleRecord`; if absent, returns `spec.default_data()`
4. If stored `schema_version < spec.schema_version`, server runs `spec.migrate()` in-place and persists updated record
5. Frontend receives `ModuleRecord`; if version still stale (offline case), `runMigrations()` in `lib/migrations.ts` upgrades the blob
6. Hydrated data is placed into `store[id].data`; module `Component` renders with `{data, onChange, allData}`

**Write (user edits):**

1. Module calls `onChange(next)` — `App.tsx` handler fires
2. `store[id].data` is updated optimistically
3. `api.putModule(id, next)` issues `PUT /api/modules/{id}` (or writes to `localStorage`)
4. Server validates payload through `spec.validate()` (Pydantic); persists `ModuleRecord`

**Cross-module read (synthesis/obstacles):**

1. `App.tsx` passes `allData = { [moduleId]: store[id].data }` to every `Component`
2. Module accesses sibling data via `allData["goals"]`, `allData["beliefs_schema"]`, etc.
3. Stored cross-references use `Ref = { moduleId: string; id: string }` — never a bare ID

**State Management:**
- Single `Store` object in `App.tsx` (`useState`) — no external state library
- Optimistic local update on every `onChange`; errors surface via `store[id].error`

## Key Abstractions

**ModuleSpec (backend):**
- Purpose: Describes one module to the generic router — schema, defaults, migration chain
- File: `backend/app/modules/registry.py`
- Pattern: Frozen dataclass with `migrate(data, from_version)` and `validate(data)` methods; each module file exports a single `SPEC` constant

**ModuleDef (frontend):**
- Purpose: Mirrors `ModuleSpec` on the frontend; adds React component references
- File: `frontend/src/modules/registry.ts`
- Pattern: `ModuleDef<T>` interface with `Component` and `SummaryBlock` FC references; `kind: "data" | "special"` distinguishes API-backed vs. derived modules (e.g., `synthese`)

**Ref (cross-module reference):**
- Purpose: Typed pointer from one module's item to another module's item
- Definition: `type Ref = { moduleId: string; id: string }` in `frontend/src/types.ts` and as a Pydantic model in `backend/app/modules/obstacles.py`
- Pattern: Always carries `moduleId`; never a bare `id`. Allows obstacles to reference beliefs from `beliefsSchema` or `beliefsACT` interchangeably

**localApi (offline adapter):**
- Purpose: Drop-in replacement for the server API using `localStorage`
- File: `frontend/src/api.local.ts`
- Pattern: Same method signatures as `serverApi`; storage key is `kompass:module:<id>`; supports `exportAll()` / `importAll()` for JSON roundtrip

## Entry Points

**Backend:**
- Location: `backend/app/main.py`
- Triggers: `uvicorn app.main:app` (Docker or native)
- Responsibilities: Creates FastAPI app, mounts CORS middleware, registers routers

**Frontend:**
- Location: `frontend/src/main.tsx`
- Triggers: Vite dev server or static build served from browser
- Responsibilities: Mounts React root with `<App />`

**Frontend (static/offline build):**
- Location: `frontend/src/api.ts` — `USE_LOCAL` flag switches to `localApi` when `VITE_STORAGE=local` or `window.location.protocol === "file:"`
- Triggers: Build with `VITE_STORAGE=local`; distributable as a single HTML file

## API Routes

```
GET    /health                   → { status: "ok" }

GET    /api/modules              → list[ModuleSpecResponse]  (id, title, phase_num, order, schema_version, school)
GET    /api/modules/{module_id}  → ModuleDataResponse        (module_id, schema_version, data, updated_at)
PUT    /api/modules/{module_id}  → ModuleDataResponse        (validated, normalized)
```

Auth: `Authorization: Bearer <KOMPASS_TOKEN>`. Token check is skipped when `KOMPASS_TOKEN` is empty (local dev).

The following routes are modeled in schemas but not yet implemented with router endpoints:
- `POST /api/snapshots`
- `GET  /api/snapshots`
- `GET  /api/export`
- `POST /api/import`

## Database Schema

Three tables, managed by Alembic (`backend/alembic/versions/0001_initial.py`):

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY,
  name       VARCHAR NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE module_records (
  id             UUID PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id),
  module_id      VARCHAR(50) NOT NULL,
  schema_version INTEGER NOT NULL,
  data           JSON NOT NULL,
  created_at     DATETIME NOT NULL,
  updated_at     DATETIME NOT NULL,
  UNIQUE (user_id, module_id)
);
-- Indexes: ix_module_records_user_id, ix_module_records_module_id

CREATE TABLE snapshots (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id),
  label      VARCHAR,
  data       JSON NOT NULL,
  created_at DATETIME NOT NULL
);
-- Index: ix_snapshots_user_id
```

v1 is single-user: one `User` row with `name = "owner"` is auto-created on first request.

## Migration Strategy

**Database structure migrations:** Alembic (`backend/alembic/versions/`). Use for table/column changes.

**Module data evolution (field additions, renames):** In-band within each module file. Each `ModuleSpec` carries:
- `schema_version: int` — current target version
- `migrations: dict[int, Callable]` — keyed by target version number (e.g., `{2: lambda d: {**d, "new_field": []}}`)

On every `GET /api/modules/{id}` the router compares stored `schema_version` to spec version, runs `spec.migrate()` if needed, and persists the upgraded record. The frontend mirrors this logic in `frontend/src/lib/migrations.ts` for offline self-healing.

## Error Handling

**Strategy:** Raise `HTTPException` with appropriate status codes at the router layer; frontend catches via `try/catch` in `loadModule` and surfaces errors in `store[id].error`.

**Patterns:**
- Unknown module ID → `404 Not Found`
- Pydantic validation failure on PUT → `422 Unprocessable Entity`
- Missing/wrong bearer token → `401 Unauthorized`
- Frontend load failure → `store[id].error` string shown below the active module

## Cross-Cutting Concerns

**Logging:** None currently; rely on uvicorn default request logging.
**Validation:** Pydantic v2 via `spec.validate()` on every PUT; frontend types are manual (no codegen yet).
**Authentication:** Single bearer token from `KOMPASS_TOKEN` env var; enforced via `Depends(current_user_id)` on all module routes. Token check is a no-op when the env var is empty.

---

*Architecture analysis: 2026-04-21*
