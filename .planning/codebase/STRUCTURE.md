# Codebase Structure

**Analysis Date:** 2026-04-21

## Directory Layout

```
MentalHealth/                          # Repo root
├── CLAUDE.md                          # Architecture anchor, porting conventions
├── README.md
├── docker-compose.yml                 # Dev: backend + frontend containers
├── .env.example                       # Required env var template
├── reference/
│   └── kompass.html                   # Single-file HTML v1 — content & concept reference
├── backend/                           # Python FastAPI service
│   ├── pyproject.toml                 # Python package manifest + dependencies
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 0001_initial.py        # Initial schema (users, module_records, snapshots)
│   └── app/
│       ├── main.py                    # FastAPI app entry point; CORS + router mounting
│       ├── config.py                  # Pydantic Settings (DATABASE_URL, KOMPASS_TOKEN, CORS)
│       ├── db.py                      # SQLModel engine + get_session dependency
│       ├── models.py                  # SQLModel ORM: User, ModuleRecord, Snapshot
│       ├── auth.py                    # Bearer token check → current_user_id dependency
│       ├── modules/
│       │   ├── __init__.py            # Re-exports MODULES list and get_module()
│       │   ├── registry.py            # ModuleSpec dataclass + MODULES assembly
│       │   ├── values.py              # Values module: schema, default, SPEC
│       │   ├── orientation.py         # Orientation module: schema, default, SPEC
│       │   ├── beliefs_schema.py      # Schema-therapy beliefs module: schema, default, SPEC
│       │   ├── beliefs_act.py         # ACT defusion beliefs module: schema, default, SPEC
│       │   ├── goals.py               # Goals module (with value cross-refs): SPEC
│       │   └── obstacles.py           # Obstacles module (goal + belief cross-refs): SPEC
│       ├── routers/
│       │   ├── modules.py             # GET/PUT /api/modules and /api/modules/{id}
│       │   └── health.py              # GET /health
│       └── schemas/
│           ├── __init__.py
│           └── api.py                 # Pydantic response models: ModuleSpecResponse,
│                                      #   ModuleDataResponse, SnapshotResponse
├── frontend/                          # React + TypeScript SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx                   # React root mount
│       ├── App.tsx                    # App shell: sidebar nav, store, crisis banner
│       ├── api.ts                     # API client switcher (server vs. localStorage)
│       ├── api.local.ts               # localStorage adapter (offline / static build)
│       ├── types.ts                   # Shared: Ref, ModuleRecord, ModuleSpecWire, AllData
│       ├── lib/
│       │   └── migrations.ts          # runMigrations() — frontend data migration runner
│       ├── modules/
│       │   ├── registry.ts            # ModuleDef interface + modules[] + getModule()
│       │   ├── values/                # Values module
│       │   │   ├── index.ts           # Exports valuesModule (ModuleDef)
│       │   │   ├── ValuesModule.tsx   # React component
│       │   │   ├── ValuesSummary.tsx  # Summary block for synthesis
│       │   │   ├── types.ts           # TypeScript types
│       │   │   └── constants.ts       # Value labels, presets
│       │   ├── orientation/           # Orientation/intro module
│       │   ├── beliefs_schema/        # Schema-therapy beliefs module
│       │   ├── beliefs_act/           # ACT defusion beliefs module
│       │   ├── goals/                 # Goals module (cross-refs to values)
│       │   ├── obstacles/             # Obstacles module (cross-refs to goals + beliefs)
│       │   ├── checkin/               # Weekly check-in (PHQ-9 + GAD-7)
│       │   │   ├── index.ts
│       │   │   ├── CheckinModule.tsx
│       │   │   ├── CheckinSummary.tsx
│       │   │   ├── constants.ts       # PHQ9_SUICIDE_ITEM_INDEX and scale labels
│       │   │   ├── scoring.ts         # PHQ-9 / GAD-7 score calculation
│       │   │   └── types.ts
│       │   └── synthese/              # Synthesis view (kind: "special", no API call)
│       │       ├── index.ts
│       │       └── SyntheseModule.tsx
│       ├── components/                # Shared UI primitives
│       │   ├── Card.tsx
│       │   ├── Chip.tsx
│       │   ├── CrisisBanner.tsx       # Crisis resources panel (shown on PHQ-9 trigger)
│       │   ├── PhaseHeader.tsx
│       │   ├── RatingDots.tsx         # 0–5 dot-rating widget
│       │   └── TrendChart.tsx         # Check-in trend visualization
│       └── styles/
│           └── index.css              # CSS custom properties + Tailwind base
├── .planning/
│   └── codebase/                      # GSD mapper outputs
└── .github/
    └── workflows/                     # CI pipeline definitions
```

## Directory Purposes

**`backend/app/modules/`:**
- Purpose: One file per reflection module; each owns its Pydantic schema, `default_data()` factory, `migrations` dict, and a `SPEC = ModuleSpec(...)` export
- Key files: `registry.py` (assembles `MODULES` list), `values.py` (reference implementation pattern)
- New modules: Add a new `.py` file here, export a `SPEC`, then import it in `registry.py`'s `_build_modules()`

**`backend/app/routers/`:**
- Purpose: HTTP route handlers; currently all module CRUD is in a single generic router
- Key files: `modules.py` (all `/api/modules` endpoints)

**`backend/app/schemas/`:**
- Purpose: Pydantic response models for API serialization (separate from ORM models in `models.py`)
- Key files: `api.py`

**`backend/alembic/versions/`:**
- Purpose: Structural database migrations (table/column changes only — not data evolution)
- Generated: Yes, via `alembic revision`
- Committed: Yes

**`frontend/src/modules/<name>/`:**
- Purpose: One directory per module; self-contained React component, summary block, types, constants
- Required files: `index.ts` (exports a `ModuleDef`), `<Name>Module.tsx`
- Optional files: `<Name>Summary.tsx` (for synthesis), `types.ts`, `constants.ts`, `scoring.ts`

**`frontend/src/components/`:**
- Purpose: Shared UI primitives used across all modules; never build module-specific primitives here
- Contains: `Card`, `Chip`, `PhaseHeader`, `RatingDots`, `CrisisBanner`, `TrendChart`

**`frontend/src/lib/`:**
- Purpose: Standalone utility functions with no React dependencies
- Key files: `migrations.ts` (data-version upgrade runner)

**`reference/`:**
- Purpose: Original single-file HTML implementation — canonical source for all content (value lists, YSQ items, example sentences, CSS variables)
- Not served; read-only reference during porting

## Key File Locations

**Entry Points:**
- `backend/app/main.py`: FastAPI app construction and router registration
- `frontend/src/main.tsx`: React DOM mount
- `frontend/src/App.tsx`: App shell — all state, navigation, load/save logic

**Configuration:**
- `backend/app/config.py`: All backend settings (`KOMPASS_TOKEN`, `DATABASE_URL`, `CORS_ORIGINS`)
- `frontend/vite.config.ts`: Vite build config; sets `VITE_STORAGE`, `VITE_API_BASE`, `VITE_KOMPASS_TOKEN`
- `.env.example`: Template for required environment variables

**Core Logic:**
- `backend/app/modules/registry.py`: `ModuleSpec` definition, `MODULES` assembly, `get_module()`
- `frontend/src/modules/registry.ts`: `ModuleDef` interface, `modules[]` array, `getModule()`
- `backend/app/routers/modules.py`: Generic GET/PUT handler; calls `spec.migrate()` and `spec.validate()`
- `frontend/src/api.ts`: Selects between `serverApi` and `localApi` at import time

**Database:**
- `backend/app/models.py`: `User`, `ModuleRecord`, `Snapshot` SQLModel table definitions
- `backend/alembic/versions/0001_initial.py`: Initial schema migration

**Types:**
- `frontend/src/types.ts`: `Ref`, `ModuleRecord`, `ModuleSpecWire`, `AllData`

## Naming Conventions

**Backend module files:**
- Pattern: `snake_case.py` matching module id (e.g., `beliefs_act.py` for module id `"beliefs_act"`)
- Each exports a single `SPEC` constant

**Frontend module directories:**
- Pattern: `snake_case/` matching module id (e.g., `beliefs_act/`)
- Main component file: `PascalCase + "Module"` (e.g., `BeliefsActModule.tsx`)
- Summary file: `PascalCase + "Summary"` (e.g., `BeliefsActSummary.tsx`)
- Registry export variable: `camelCase + "Module"` (e.g., `beliefsActModule`)

**Shared components:**
- Pattern: `PascalCase.tsx` (e.g., `RatingDots.tsx`, `PhaseHeader.tsx`)

**Type files:**
- Pattern: `types.ts` per module directory; `types.ts` at `frontend/src/types.ts` for shared types

**Constants files:**
- Pattern: `constants.ts` per module directory; SCREAMING_SNAKE_CASE for exported constants

## Where to Add New Code

**New reflection module (full stack):**
1. Backend schema: `backend/app/modules/<name>.py` — model, `default_data()`, `SPEC`
2. Register backend: import `SPEC` in `backend/app/modules/registry.py` → `_build_modules()`
3. Frontend types: `frontend/src/modules/<name>/types.ts`
4. Frontend constants: `frontend/src/modules/<name>/constants.ts`
5. Frontend component: `frontend/src/modules/<name>/<Name>Module.tsx`
6. Frontend summary: `frontend/src/modules/<name>/<Name>Summary.tsx` (optional)
7. Frontend module def: `frontend/src/modules/<name>/index.ts` — export `ModuleDef`
8. Register frontend: import in `frontend/src/modules/registry.ts` → `modules[]`

**New shared UI component:**
- Implementation: `frontend/src/components/<Name>.tsx`

**New utility function:**
- Shared helpers: `frontend/src/lib/<name>.ts`

**Database structure change:**
- Run `alembic revision --autogenerate -m "<description>"` in `backend/`
- New file in: `backend/alembic/versions/`

**Module data field addition (no table change):**
- Increment `schema_version` in the module's `SPEC`
- Add migration lambda in the module's `migrations` dict under the new version key
- No Alembic migration needed

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD mapper output documents — architecture, stack, conventions, concerns
- Generated: Yes (by GSD map-codebase)
- Committed: Yes

**`reference/`:**
- Purpose: Read-only content reference (HTML v1 of the app)
- Generated: No
- Committed: Yes

**`backend/alembic/versions/`:**
- Purpose: Alembic auto-generated migration scripts for DB structure
- Generated: Partially (by `alembic revision`)
- Committed: Yes

---

*Structure analysis: 2026-04-21*
