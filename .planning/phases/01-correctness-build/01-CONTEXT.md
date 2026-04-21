# Phase 1: Correctness & Build — Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix active data-loss bugs (local migrations not running, import bypassing the active API), harden the app shell (error boundary, UUID safety, backend migration error handling), and update dependencies (SQLModel, vite-plugin-singlefile, Vite 5 → 7).

No new features. No module additions. Only correctness, resilience, and dependency hygiene.

</domain>

<decisions>
## Implementation Decisions

### Error Boundary (QUAL-02)

- **D-01:** Error state is a minimal text-only inline note — two lines: "Fehler in diesem Modul." and "Seite neu laden um fortzufahren." — rendered in the standard paper/ink color scheme. No Card wrapper, no retry button, no interactive recovery.
- **D-02:** No `error.message` shown to the user. The presentation stays clean. Error details are logged to console for DevTools debugging.
- **D-03 (prior decision, STATE.md):** Error boundary wraps only the active module render area in `App.tsx` — not app-wide. Sidebar and other modules continue to work while one module is broken.

### UUID Safety (QUAL-03)

- **D-04 (prior decision, STATE.md):** Replace `Math.random()` with `crypto.randomUUID()` everywhere. Keep a `Math.random`-based fallback only for `file://` contexts where `crypto.randomUUID` may not be available (Secure Context requirement). Centralize this into a shared `uid()` utility — Claude's discretion on exact file location (`frontend/src/lib/uid.ts` is the natural home).

### localApi Migration (QUAL-01)

- **D-05:** `localApi.getModule` must run `runMigrations()` and write the migrated result back to localStorage if the version changed. Silent write-back — no user-visible feedback. If a migration throws, surface it the same way as the server path (error state, not silent swallow). Claude's discretion on exact implementation.

### Backend Migration Error Handling (QUAL-04)

- **D-06:** If a migration function throws during `GET /api/modules/{id}`, the endpoint returns the original stored data (last-known-good), not HTTP 500. Error is logged via Python's `logging` module with the module ID and exception for context. Same guard applies to the write-back in the GET path (not PUT — PUT validation errors surface as 422, which is correct).

### Token Enforcement (QUAL-05)

- **D-07:** If `KOMPASS_TOKEN` equals the default value `"change-me-please"`: log a WARNING via Python's `logging` at startup. App still starts. Suitable for personal dev use where the token was never changed.
- **D-08:** If `KOMPASS_TOKEN` is empty string: hard reject at startup via a Pydantic `@field_validator` in `Settings`. App refuses to start. This prevents accidental unauthenticated deployments — the deliberate bypass must be a code change, not just an env var.

### Dependency Updates (DEPS-01, DEPS-02, DEPS-03)

- **D-09:** Vite 5 → 7 directly (no Vite 6 waypoint). One migration pass, fewer config changes.
- **D-10:** "Verified" for the offline HTML build (DEPS-03 success criterion) = build completes without errors + manual Chrome `file://` check. Safari is a nice-to-have, not a phase blocker.
- **D-11:** SQLModel pinned to `>=0.0.32` (DEPS-01). `vite-plugin-singlefile` pinned to exact `2.3.2` (DEPS-02). Both are constraint changes in manifest files only.

### Claude's Discretion

- Exact file location for shared `uid()` utility (natural: `frontend/src/lib/uid.ts`)
- Python logging format for migration failures and token warnings (module-level logger is standard)
- Whether to extract the error boundary into a standalone component file or keep it inline in `App.tsx` as a class component

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — QUAL-01 through QUAL-05 (correctness), DEPS-01 through DEPS-03 (dependencies) — all Phase 1 requirements with acceptance criteria

### Roadmap
- `.planning/ROADMAP.md` — Phase 1 "Correctness & Build" section — success criteria that define done

### Key Implementation Files
- `frontend/src/api.local.ts` — `localApi.getModule` (lines 31–52) — needs migration call added here (QUAL-01)
- `frontend/src/App.tsx` — where the error boundary wraps module render area (QUAL-02); also the buggy `localApi.importAll` hardcode (lines 23–35)
- `backend/app/auth.py` — existing token check logic (QUAL-05 changes go in `config.py` Settings, not here)
- `backend/app/config.py` — Pydantic Settings where empty-token validator is added (QUAL-05)
- `backend/app/routers/modules.py` — GET handler with migration logic (QUAL-04 guard goes here, lines 59–65)
- `frontend/src/modules/beliefs_act/BeliefsActModule.tsx` — `uid()` usage (QUAL-03)
- `frontend/src/modules/goals/GoalsModule.tsx` — `uid()` usage (QUAL-03)
- `frontend/src/modules/obstacles/ObstaclesModule.tsx` — `uid()` usage (QUAL-03)
- `frontend/src/modules/checkin/CheckinModule.tsx` — `uid()` usage (QUAL-03)
- `frontend/package.json` — Vite and vite-plugin-singlefile version pins (DEPS-02, DEPS-03)
- `backend/pyproject.toml` — SQLModel version pin (DEPS-01)

### Architecture Reference
- `.planning/codebase/CONCERNS.md` — Full audit of all known bugs, debt, and gaps — read before planning to avoid re-discovering issues already mapped

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/lib/migrations.ts` — `runMigrations()` already exists; localApi just needs to call it
- `backend/app/modules/registry.py` — `ModuleSpec.migrate()` — the migration chain is already wired for the server path; the GET router just needs a try/except around it

### Established Patterns
- Error display: existing module error state in `App.tsx` uses `store[id].error` (a string) shown below the active module — the error boundary visual should be consistent with this pattern
- Python logging: no structured logging yet (`uvicorn` default only) — `logging.getLogger(__name__)` is the standard here, no structlog setup needed for Phase 1
- Pydantic field validation: `@field_validator` with `mode="before"` or `"after"` on `Settings` — same pattern as any Pydantic v2 validator

### Integration Points
- Error boundary wraps the module render block in `App.tsx` — the exact location is where `activeModule.Component` is rendered; the existing `store[id].error` display pattern sits just below it
- `localApi.getModule` return path in `api.local.ts` (lines 31–52) is where `runMigrations` + write-back is added — server path in `App.tsx` (lines 65–70) shows what the after-migration write-back looks like
- `backend/app/main.py` startup event (or lifespan context) is where the token warning log goes — check if a lifespan handler already exists before adding one

</code_context>

<specifics>
## Specific Ideas

- Error text copy: "Fehler in diesem Modul." / "Seite neu laden um fortzufahren." — exact strings decided in discussion
- No retry/reload button in the error boundary — clean text only
- Token warning must use Python `logging.warning(...)`, not `print()` — consistent with how the rest of the backend should log

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-correctness-build*
*Context gathered: 2026-04-21*
