# Codebase Concerns

**Analysis Date:** 2026-04-21

---

## Security Concerns

**Auth enforcement is conditionally active, not always enforced:**
- Risk: When `KOMPASS_TOKEN` is set to an empty string (the stated dev shortcut), all endpoints become fully unauthenticated. Any process on localhost can read/write all user data.
- Files: `backend/app/auth.py` (line 31–38), `backend/app/config.py` (line 8)
- Current mitigation: `config.py` sets `kompass_token: str = "change-me-please"` as the default, so auth is active out-of-the-box unless deliberately overridden. The env-based bypass is documented but easy to misconfigure in a deployed environment.
- Recommendation: Document clearly that empty-string token must never be used in any network-accessible deployment. Consider rejecting an empty token value in `Settings` validation.

**Default token ships as a predictable hardcoded string:**
- Risk: `"change-me-please"` is the default value in `config.py`. If a user deploys without setting `KOMPASS_TOKEN` in their environment, authentication is active but with a known token.
- Files: `backend/app/config.py` (line 8)
- Recommendation: At minimum log a warning on startup if the default value is unchanged, or refuse to start in production mode with it.

**Token exposed in frontend build:**
- Risk: `VITE_KOMPASS_TOKEN` is baked into the compiled JavaScript bundle at build time. Any user with browser devtools can extract the token from the bundle.
- Files: `frontend/src/api.ts` (line 5)
- Current mitigation: Single-user personal tool — acceptable for the threat model. Becomes a problem if the deployed URL is ever shared.

**No CSRF protection:**
- Risk: The API accepts `PUT` requests with a `Content-Type: application/json` bearer token. This is protected by the bearer token requirement, but only if `KOMPASS_TOKEN` is set.
- Files: `backend/app/main.py`, `backend/app/routers/modules.py`
- Current mitigation: Bearer token requirement acts as effective CSRF mitigation when enabled.

**CORS configured via environment, defaults to localhost only:**
- Current state: `cors_origins: str = "http://localhost:5173"` — acceptable for dev. Production deployment must override this explicitly.
- Files: `backend/app/config.py` (line 9)

---

## Missing Features (CLAUDE.md TODO vs. Actual State)

**YSQ module — listed in CLAUDE.md but not implemented:**
- CLAUDE.md lists `backend/app/modules/ysq.py` in the directory structure and marks "YSQ-Modul portieren" as a TODO.
- Actual state: `ysq.py` does not exist in `backend/app/modules/`. No corresponding frontend module exists under `frontend/src/modules/ysq/`.
- Impact: The YSQ (Young Schema Questionnaire) intake flow is entirely absent. This is described as the first recommended next step in CLAUDE.md.

**Snapshot system — backend model exists, no API routes:**
- CLAUDE.md specifies: `POST /api/snapshots`, `GET /api/snapshots`
- Actual state: `Snapshot` model is defined in `backend/app/models.py` (line 38–45) and the `snapshots` table is created by the Alembic migration, but no router exists for snapshot creation, listing, or retrieval.
- Files: `backend/app/models.py`, `backend/app/routers/` (directory contains only `health.py` and `modules.py`)
- Impact: The primary motivating feature ("Zeitverlauf") of the port from HTML is entirely non-functional on the backend. The frontend has no snapshot UI either.

**Export/Import endpoints — no backend implementation:**
- CLAUDE.md specifies: `GET /api/export`, `POST /api/import`
- Actual state: Neither route exists in the backend. Export/import is implemented only in the local-storage mode (`frontend/src/api.local.ts` — `exportAll`, `importAll`), and only surfaces in the UI when `VITE_STORAGE=local`.
- Files: `frontend/src/App.tsx` (lines 12–35, 142–173), `frontend/src/api.local.ts` (lines 68–85)
- Impact: Backend/server-mode users have no data portability. Compatibility with the HTML-v1 export format is untested.

**Auth middleware listed as disabled:**
- CLAUDE.md explicitly marks "Auth-Middleware aktivieren (aktuell ist der Token-Check kommentiert)" as a TODO.
- Actual state: Auth is not commented out — `get_current_user` is wired via `Depends(current_user_id)` on both `GET /{module_id}` and `PUT /{module_id}`. The todo in CLAUDE.md appears outdated relative to the current code.
- Note: The conditional bypass (empty token = no auth) described above remains a real gap, but the todo item as written no longer matches the implementation.

**Checkin module has no backend counterpart:**
- Frontend implements a full `checkin` module (`frontend/src/modules/checkin/`) with PHQ-9 and GAD-7 questionnaires.
- Actual state: No `checkin.py` exists in `backend/app/modules/`. The frontend checkin module is not registered in the backend registry (`backend/app/modules/registry.py`).
- Impact: In server mode, a `GET /api/modules/checkin` call returns HTTP 404. The checkin module only works in local-storage mode (`VITE_STORAGE=local`). All checkin data is silently lost when switching to server mode.

---

## Technical Debt

**`any` types in frontend registry and module code:**
- `ModuleDef<T = any>` and `migrations: Record<number, (data: any) => any>` in `frontend/src/modules/registry.ts` (line 23, 28) remove type safety from the migration chain.
- Files: `frontend/src/modules/registry.ts`
- Impact: Migration functions receive untyped data; errors surface at runtime only.

**`uid()` uses `Math.random()` — not collision-safe:**
- Multiple modules generate item IDs with `Math.random().toString(36).slice(2, 10)` (8 chars, base 36 = ~41 bits).
- Files: `frontend/src/modules/beliefs_act/BeliefsActModule.tsx` (line 9–11), `frontend/src/modules/goals/GoalsModule.tsx` (line 11–13), `frontend/src/modules/obstacles/ObstaclesModule.tsx` (line 11–13), `frontend/src/modules/checkin/CheckinModule.tsx` (line 23–25)
- Impact: Theoretical collision risk if many items are created in one session; no cryptographic randomness. `crypto.randomUUID()` is available in all modern browsers and would be zero-effort upgrade.

**Hardcoded GOAL_PROMPTS and EXPLORATION_PROMPTS in component files:**
- `GOAL_PROMPTS` is defined inline in `frontend/src/modules/goals/GoalsModule.tsx` (lines 17–23), not in `goals/constants.ts`.
- `EXPLORATION_PROMPTS` is defined inline in `frontend/src/modules/obstacles/ObstaclesModule.tsx` (lines 15–21).
- This violates the explicit convention in CLAUDE.md: "Inhaltliche Konstanten zuerst — niemals im Component-File hardcoden."
- Files: `frontend/src/modules/goals/GoalsModule.tsx`, `frontend/src/modules/obstacles/ObstaclesModule.tsx`

**`beliefs_act` module uses `value_id: str` instead of a typed `Ref`:**
- `ActCommitment.value_id` in the backend (`backend/app/modules/beliefs_act.py`, line 10) is a plain string pointing to a values item, not a `Ref = { moduleId, id }` as specified in CLAUDE.md.
- The frontend `BeliefsActModule.tsx` reads `c.value_id` directly and matches it against `values.selected` — correct today, but diverges from the cross-module reference design.
- Files: `backend/app/modules/beliefs_act.py`, `frontend/src/modules/beliefs_act/BeliefsActModule.tsx`
- Impact: If values are ever sourced from a second module, this coupling breaks.

**`DEFUSION_EXAMPLES` hardcoded in component, not in constants file:**
- `DEFUSION_EXAMPLES` is defined at module level in `frontend/src/modules/beliefs_act/BeliefsActModule.tsx` (lines 13–19), not in a `constants.ts` file. The `beliefs_act/` directory has no `constants.ts`.
- Files: `frontend/src/modules/beliefs_act/BeliefsActModule.tsx`

**`document.execCommand('copy')` deprecated fallback:**
- `SyntheseModule.tsx` uses the deprecated `document.execCommand("copy")` as a clipboard fallback (lines 153–157).
- Files: `frontend/src/modules/synthese/SyntheseModule.tsx`
- Impact: Will stop working in future browser versions. The primary `navigator.clipboard.writeText` path is correct; the fallback should be removed or replaced.

**No error boundary in App.tsx:**
- A module component that throws will crash the entire app. There is no React error boundary wrapping module rendering.
- Files: `frontend/src/App.tsx`

---

## Incomplete Implementations

**Synthese page has no snapshot-over-time view:**
- `SyntheseModule.tsx` renders a static summary of current data. The design intent (per CLAUDE.md) is time-series comparison via snapshots. No snapshot history UI exists.
- Files: `frontend/src/modules/synthese/SyntheseModule.tsx`, `frontend/src/modules/synthese/index.ts`

**`localApi` does not apply frontend migrations when loading data:**
- `localApi.getModule` in `frontend/src/api.local.ts` returns stored data as-is without running `runMigrations`. The server path in `App.tsx` (line 66–70) does run migrations, but the local path does not.
- Files: `frontend/src/api.local.ts` (lines 31–52), `frontend/src/App.tsx` (lines 65–70)
- Impact: Any user who has stored data under schema version 1 and then updates to a version 2 schema will silently receive stale data in local mode until a migration is manually triggered.

**Backend migration for schema version mismatch writes back immediately without error handling:**
- In `backend/app/routers/modules.py` (lines 59–65), when a record's `schema_version` is older than the spec, the migration runs and the result is written back in the same request. If the migration function raises, the exception propagates as an unhandled 500. There is no rollback or partial-migration guard.
- Files: `backend/app/routers/modules.py`

**Import in server mode calls `localApi.importAll` regardless of storage mode:**
- `App.tsx` (line 29) calls `localApi.importAll(dump)` directly, bypassing the `api` abstraction. This means import always writes to localStorage even when `VITE_STORAGE` is not set and the server API is active.
- Files: `frontend/src/App.tsx` (lines 23–35)

---

## Performance Concerns

**All modules are loaded eagerly on app start:**
- `App.tsx` initializes all module states and begins loading the active module immediately. All modules are imported statically in `frontend/src/modules/registry.ts` — no code splitting or lazy loading.
- Files: `frontend/src/modules/registry.ts`, `frontend/src/App.tsx`
- Impact: Negligible for the current number of modules but will grow linearly with module count.

**`allData` is recomputed on every render:**
- In `App.tsx` (line 97), `allData` is computed with `Object.fromEntries(...)` on every render, not memoized. Cross-module components that depend on `allData` will re-render on any store update.
- Files: `frontend/src/App.tsx` (line 97)

**No pagination or virtualization on check-in history list:**
- `CheckinModule.tsx` renders the full entry history as a flat list. Over years of weekly use this could reach 100–200 entries.
- Files: `frontend/src/modules/checkin/CheckinModule.tsx`

---

## Test Coverage Gaps

**Zero automated tests exist:**
- No test files exist anywhere in the codebase. `pyproject.toml` lists `pytest`, `httpx`, and `ruff` as dev dependencies but no tests have been written.
- Files: `backend/pyproject.toml` (dev dependencies), no `tests/` directory
- Risk: Backend migration logic, Pydantic schema validation, and auth behavior are completely untested. Frontend migration functions in `frontend/src/lib/migrations.ts` are also untested.
- Priority: High — migration functions are the most critical code path because data corruption there is silent and permanent.

---

## Dependency Risks

**`vite-plugin-singlefile` version unpinned (`^2.0.2`):**
- This plugin controls the single-file HTML build output. A major version bump could silently break the offline mode.
- Files: `frontend/package.json`

**`sqlmodel>=0.0.22` — SQLModel is pre-1.0:**
- SQLModel is listed as `>=0.0.22`, which is a pre-release version series. Breaking changes between minor versions have historically occurred.
- Files: `backend/pyproject.toml`

**No lockfile verification in CI for backend:**
- `pyproject.toml` uses range dependencies (`>=`) with no `requirements.lock` or pip-tools lockfile. Builds are not reproducible without one.
- Files: `backend/pyproject.toml`

---

## Gaps Between CLAUDE.md Design and Implementation

**CLAUDE.md directory structure lists `ysq.py` as existing:**
- The CLAUDE.md architecture diagram shows `backend/app/modules/ysq.py` as a file in the tree. It does not exist. The diagram is aspirational, not descriptive.

**CLAUDE.md TODO marks all core modules as not-yet-ported:**
- The TODO list marks YSQ, Beliefs-Schema, Beliefs-ACT, Goals, Obstacles, and Synthese as pending. In practice, all of these except YSQ are fully implemented (backend schema + frontend component + summary block). The TODO list has not been updated to reflect progress.
- Verified complete: `beliefs_schema`, `beliefs_act`, `goals`, `obstacles`, `synthese`, `orientation`
- Still missing: `ysq` (no backend file, no frontend folder)

**CLAUDE.md does not mention the `checkin` or `orientation` modules:**
- Both modules are implemented and registered but are absent from the CLAUDE.md TODO tracker. `checkin` is a significant addition (PHQ-9, GAD-7, crisis detection) with no backend counterpart.

**`SnapshotResponse` Pydantic schema defined but unused:**
- `backend/app/schemas/api.py` defines `SnapshotResponse` (line 27–30), but no router uses it because the snapshot endpoints don't exist.
- Files: `backend/app/schemas/api.py`

---

*Concerns audit: 2026-04-21*
