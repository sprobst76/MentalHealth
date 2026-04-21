# External Integrations

**Analysis Date:** 2026-04-21

## APIs & External Services

**None.** Kompass has no third-party API integrations. It is intentionally self-contained: no analytics services, no AI/LLM backends, no social or sharing APIs. All data stays local or on the user's own server.

## Data Storage

**Primary Database:**
- SQLite (development) — local file at `backend/kompass.db` or `/data/kompass.db` in container
- PostgreSQL (production-ready) — connection via `DATABASE_URL` env var
  - Client: SQLModel (SQLAlchemy + Pydantic v2 combined ORM)
  - Migration tool: Alembic (`backend/alembic/`)
  - Optional dependency: `psycopg[binary]>=3.2` (`pip install -e ".[postgres]"`)

**File Storage:** None — no blob/object storage. All data is JSON in the database.

**Caching:** None.

**Local Storage (frontend):**
- `frontend/src/api.local.ts` — localStorage-backed API shim used when `VITE_STORAGE=local` or when running as a `file://` URL
- Enables fully offline, single-file operation without any backend
- Active when `import.meta.env.VITE_STORAGE === "local"` or `window.location.protocol === "file:"`
- Checked in `frontend/src/api.ts` — the `api` export switches between `serverApi` and `localApi`

## Authentication & Identity

**Approach:** Single-user bearer token from environment variable.

**Backend implementation** (`backend/app/auth.py`):
- Token read from `KOMPASS_TOKEN` env var via `backend/app/config.py` (pydantic-settings)
- Every protected endpoint calls `Depends(get_current_user)`
- Token check: `Authorization: Bearer <token>` header compared to `settings.kompass_token`
- Returns HTTP 401 if token is wrong or missing (when `KOMPASS_TOKEN` is non-empty)
- Setting `KOMPASS_TOKEN` to empty string disables auth check (local dev mode)
- A single `User` row (name = `"owner"`) is auto-created on first authenticated request

**Frontend implementation** (`frontend/src/api.ts`):
- Token read from `VITE_KOMPASS_TOKEN` (build-time env var)
- Sent as `Authorization: Bearer <token>` header on every request
- No login flow — token is embedded at build time or set via env

**No multi-user support** in v1. Schema has `user_id` FK on `module_records` to allow future extension, but there is only ever one user (`"owner"`).

## Monitoring & Observability

**Error Tracking:** None — no Sentry, Datadog, or similar.

**Logs:** Uvicorn stdout logs only. Access via `docker compose logs -f backend`.

**Health endpoint:** `GET /health` — implemented in `backend/app/routers/health.py`.

## CI/CD & Deployment

**Hosting:** No hosting platform configured. Docker Compose with direct port exposure is the current deployment model.

**CI Pipeline:** None detected — no `.github/workflows/`, no GitLab CI, no CircleCI config.

## CORS Configuration

Managed by `fastapi.middleware.cors.CORSMiddleware` in `backend/app/main.py`.

- Allow-list controlled by `CORS_ORIGINS` env var (comma-separated)
- Default: `http://localhost:5173`
- Credentials, all methods, and all headers are permitted

## Environment Configuration

All configuration is read by `backend/app/config.py` via pydantic-settings (reads `.env` file and environment variables).

**Backend env vars** (defined in `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `KOMPASS_TOKEN` | `change-me-please` | Bearer token for single-user auth |
| `DATABASE_URL` | `sqlite:////data/kompass.db` | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated CORS allow-list |

**Frontend env vars** (Vite build-time, `VITE_` prefix):

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE` | `http://localhost:8000` | Backend URL for API calls |
| `VITE_KOMPASS_TOKEN` | `` (empty) | Bearer token forwarded from `KOMPASS_TOKEN` |
| `VITE_STORAGE` | `` (empty) | Set to `local` to enable localStorage mode and single-file build |

**Secrets location:**
- `.env` file at project root (gitignored, copied from `.env.example`)
- Docker Compose reads `.env` automatically and injects variables into both services

## Webhooks & Callbacks

**Incoming:** None.

**Outgoing:** None.

## Fonts

Fonts are served from the npm package bundle (fontsource), not from Google Fonts CDN at runtime:
- `@fontsource-variable/fraunces` — Fraunces variable font
- `@fontsource-variable/inter-tight` — Inter Tight variable font

Font files are bundled into the build output (or inlined in single-file mode), so no external font CDN requests occur at runtime.

---

*Integration audit: 2026-04-21*
