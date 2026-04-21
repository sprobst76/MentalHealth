# Testing Patterns

**Analysis Date:** 2026-04-21

## Test Framework

**Runner:** None configured.

No test runner (Jest, Vitest, pytest) is set up for this project. The `pyproject.toml` lists `pytest>=8` and `httpx>=0.27` as optional dev dependencies under `[project.optional-dependencies] dev`, but no test files exist and no test scripts are defined.

**Frontend:**
- No `vitest.config.*` or `jest.config.*` present
- No test scripts in `frontend/package.json` (`scripts` contains only `dev`, `build`, `build:local`, `preview`, `typecheck`)

**Backend:**
- `pytest` listed as optional dev dependency in `backend/pyproject.toml`
- No `conftest.py`, no `tests/` directory, no `test_*.py` files anywhere in the project

## Test Files

No test files exist in the project (outside of `node_modules`):
- Zero `*.test.ts` / `*.test.tsx` files in `frontend/src/`
- Zero `*.spec.ts` / `*.spec.tsx` files in `frontend/src/`
- Zero `test_*.py` files in `backend/`
- Zero `*_test.py` files in `backend/`

## Type Checking (Substitute for Unit Tests)

The project relies on TypeScript strict mode as a correctness mechanism in place of unit tests.

**TypeScript configuration** (`frontend/tsconfig.json`):
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Run the type checker:
```bash
cd frontend && npm run typecheck   # tsc --noEmit
```

This is also run as part of the build:
```bash
cd frontend && npm run build       # tsc --noEmit && vite build
```

**Python linting** — Ruff is configured as an optional dev dependency:
```toml
# backend/pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py312"
```

Run ruff (if dev extras installed):
```bash
cd backend && ruff check app/
```

## CI/CD Configuration

**File:** `.github/workflows/pages.yml`

The single CI workflow builds the frontend for GitHub Pages deployment. It does **not** run tests.

```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 (node 20)
      - run: npm install
      - run: VITE_STORAGE=local npx vite build --outDir dist-local
      # No test step
  deploy:
    # Deploys dist-local to GitHub Pages
```

Triggers: push to `main`, manual `workflow_dispatch`.

## How to Run Available Checks

```bash
# Frontend type check
cd frontend && npm run typecheck

# Frontend full build (includes type check)
cd frontend && npm run build

# Frontend local build (single-file HTML, used in CI)
cd frontend && npm run build:local

# Backend linting (requires dev extras: pip install -e ".[dev]")
cd backend && ruff check app/

# Backend type check (no mypy configured, ruff only)
cd backend && ruff check app/
```

## What Is and Is Not Tested

**Verified at build time (TypeScript compiler):**
- All module `data` / `onChange` prop types
- `ModuleDef<T>` generic constraints in `registry.ts`
- `Ref` type usage for cross-module references
- `AllData` cast patterns in module components
- API client return types in `api.ts`

**Verified at runtime only (no automated tests):**
- Migration logic in `frontend/src/lib/migrations.ts` and `backend/app/modules/registry.py`
- FastAPI route behaviour (auth, 404 on unknown module, 422 on invalid payload)
- `localStorage` read/write in `frontend/src/api.local.ts`
- Module registry `default_data()` correctness
- Pydantic model validation in `backend/app/routers/modules.py`
- Import/export JSON round-trip compatibility

## Coverage Gaps

**High risk — no tests:**
- `runMigrations()` in `frontend/src/lib/migrations.ts`: migration chains execute correctly version-by-version
- `ModuleSpec.migrate()` in `backend/app/modules/registry.py`: same concern server-side
- `api.local.ts` localStorage adapter: correctness of read/write/import/export
- Auth logic in `backend/app/auth.py`: token extraction, single-user creation on first request
- Pydantic field validation: boundary values (e.g., `weight: int = Field(ge=0, le=5)`)
- Cross-module ref resolution: goals linking to values IDs that no longer exist

**Medium risk:**
- `calcProfile()` in `frontend/src/modules/orientation/scoring.ts`: scoring algorithm correctness
- Crisis detection in `App.tsx`: PHQ-9 item index check on `checkinData`

## Adding Tests (When Ready)

**Frontend — recommended setup:**
```bash
cd frontend && npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

Add to `frontend/package.json`:
```json
{ "scripts": { "test": "vitest run", "test:watch": "vitest" } }
```

Priority test targets:
- `frontend/src/lib/migrations.ts` — pure function, easy to unit test
- `frontend/src/modules/*/index.ts` migration dicts — test each version step
- `frontend/src/modules/orientation/scoring.ts` — pure scoring logic

**Backend — recommended setup:**
```bash
cd backend && pip install -e ".[dev]"
# httpx is already listed — use it with FastAPI's TestClient
```

Create `backend/tests/conftest.py` with an in-memory SQLite fixture, then test:
- `backend/app/routers/modules.py` — GET/PUT round-trip per module
- `backend/app/modules/registry.py` — `migrate()` and `validate()` methods
- `backend/app/auth.py` — token rejection and single-user creation

---

*Testing analysis: 2026-04-21*
