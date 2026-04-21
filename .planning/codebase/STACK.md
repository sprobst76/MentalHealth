# Technology Stack

**Analysis Date:** 2026-04-21

## Languages

**Primary:**
- Python 3.12 - Backend API server (`backend/`)
- TypeScript 5.5 - Frontend application (`frontend/src/`)

**Secondary:**
- CSS - Styling via Tailwind utility classes + custom CSS variables (`frontend/src/styles/index.css`)

## Runtime

**Backend Environment:**
- Python 3.12 (enforced via `requires-python = ">=3.12"` in `backend/pyproject.toml`)
- Uvicorn ASGI server (standard extras) — `uvicorn[standard]>=0.30`

**Frontend Environment:**
- Node 20 (pinned in Docker Compose via `node:20-alpine` image)
- ESM modules (`"type": "module"` in `frontend/package.json`)

**Package Managers:**
- Backend: pip with `pyproject.toml` (PEP 621); lockfile not present
- Frontend: npm; `package-lock.json` expected (standard npm)

## Frameworks

**Backend Core:**
- FastAPI `>=0.115` - HTTP API framework (`backend/app/main.py`)
- SQLModel `>=0.0.22` - ORM combining SQLAlchemy + Pydantic v2 (`backend/app/db.py`, `backend/app/models.py`)
- Pydantic `>=2.8` - Data validation and settings
- pydantic-settings `>=2.4` - Environment-based configuration (`backend/app/config.py`)
- Alembic `>=1.13` - Database migrations (`backend/alembic/`)
- python-multipart `>=0.0.9` - Form data parsing

**Frontend Core:**
- React 18.3 - UI framework (`frontend/src/`)
- Vite 5.3 - Dev server and build tool (`frontend/vite.config.ts`)

**Styling:**
- Tailwind CSS 3.4 - Utility-first CSS (`frontend/tailwind.config.js`)
- PostCSS 8.4 + Autoprefixer 10.4 - CSS processing

**Fonts (self-hosted via fontsource):**
- `@fontsource-variable/fraunces` 5.1 - Display/serif font
- `@fontsource-variable/inter-tight` 5.1 - Body/sans font

**Testing (backend dev extras):**
- pytest `>=8`
- httpx `>=0.27` - async HTTP client for test requests

**Linting:**
- Ruff `>=0.6` - Python linter/formatter (`line-length = 100`, `target-version = "py312"` in `backend/pyproject.toml`)

## Build Tools

**Backend:**
- setuptools `>=69` + wheel - Python build backend
- Package discovery: `include = ["app*"]` finds `backend/app/`

**Frontend:**
- `@vitejs/plugin-react` 4.3 - React/JSX transform for Vite
- `vite-plugin-singlefile` 2.0 - Bundles entire app into one self-contained HTML file when `VITE_STORAGE=local`
- TypeScript compiler (`tsc --noEmit`) runs before every build as type-check step

**Build modes (defined in `frontend/package.json`):**
```bash
npm run dev          # Vite dev server on port 5173
npm run build        # Type-check + build for API-backed deployment
npm run build:local  # Type-check + single-file build (VITE_STORAGE=local, outDir dist-local)
npm run preview      # Serve production build locally
npm run typecheck    # tsc --noEmit only
```

## TypeScript Configuration

Source: `frontend/tsconfig.json`

- Target: ES2022
- Lib: ES2022, DOM, DOM.Iterable
- Module: ESNext, bundler resolution
- JSX: react-jsx
- Strict mode enabled: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- `resolveJsonModule`, `isolatedModules`, `esModuleInterop` all enabled

## Database Technologies

**Development:**
- SQLite — file at `/data/kompass.db` (container) or `./kompass.db` (native)
- Connection via `DATABASE_URL=sqlite:////data/kompass.db`

**Production:**
- PostgreSQL via `psycopg[binary]>=3.2` (optional extra `[postgres]` in `backend/pyproject.toml`)
- Example URL: `postgresql+psycopg://user:pass@db:5432/kompass`

**Schema management:**
- Alembic handles structural migrations (`backend/alembic/versions/`)
- In-band module-level data migrations for schema evolution within module JSON blobs

## Container Setup

**Orchestration:** Docker Compose (`docker-compose.yml`)

| Service | Base Image | Port |
|---------|-----------|------|
| backend | Custom (`backend/Dockerfile` — `python:3.12-slim`) | 8000 |
| frontend | `node:20-alpine` | 5173 |

**Named volume:** `kompass_data` — mounted to `/data` in backend container for SQLite persistence.

Backend entrypoint: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

## Platform Requirements

**Development (native):**
- Python 3.12+
- Node 20+
- pip + npm

**Development (Docker):**
- Docker + Docker Compose (no other requirements)

**Production:**
- Docker Compose deployment (direct port exposure, no Traefik/reverse proxy in current config)
- Or any WSGI/ASGI host that can run Uvicorn with Python 3.12

---

*Stack analysis: 2026-04-21*
