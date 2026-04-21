---
phase: 01-correctness-build
plan: "02"
subsystem: backend
tags: [correctness, security, dependencies, auth, migrations]
dependency_graph:
  requires: []
  provides: [empty-token-validation, default-token-warning, migration-error-guard, sqlmodel-pin]
  affects: [backend/app/config.py, backend/app/main.py, backend/app/routers/modules.py, backend/pyproject.toml]
tech_stack:
  added: []
  patterns: [pydantic-field_validator, fastapi-lifespan, python-logging, try-except-last-known-good]
key_files:
  created: []
  modified:
    - backend/app/config.py
    - backend/app/main.py
    - backend/app/routers/modules.py
    - backend/pyproject.toml
decisions:
  - "Empty KOMPASS_TOKEN rejected at Settings load via @field_validator (D-08)"
  - "Default token triggers WARNING log at startup via lifespan context manager (D-07)"
  - "Migration failure returns last-known-good stored data, logs error with exc_info=True (D-06)"
  - "SQLModel pinned to >=0.0.32 for Pydantic 2.12+ Annotated field compatibility (D-11)"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-21T09:11:48Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 01 Plan 02: Backend Correctness Hardening Summary

**One-liner:** Empty KOMPASS_TOKEN rejected at startup via Pydantic validator; default token triggers WARNING via FastAPI lifespan; migration failures return last-known-good data with structured error logging; SQLModel pinned to >=0.0.32.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add empty-token validator and lifespan startup warning | 08bfc89 | backend/app/config.py, backend/app/main.py |
| 2 | Guard migration errors and pin SQLModel | c60bf61 | backend/app/routers/modules.py, backend/pyproject.toml |

## What Was Built

### Task 1: config.py + main.py

`backend/app/config.py` now has:
- `_DEFAULT_TOKEN = "change-me-please"` constant (re-used for comparison in main.py)
- `@field_validator("kompass_token", mode="after")` classmethod `token_must_not_be_empty` that raises `ValueError` if the token is empty string — causes Pydantic `ValidationError` at `Settings()` construction, preventing app startup
- `from __future__ import annotations`, `import logging`, module-level `logger`

`backend/app/main.py` now has:
- Async `lifespan` context manager using `asynccontextmanager`
- Startup check: if `settings.kompass_token == _DEFAULT_TOKEN`, emits `logger.warning(...)` with the default value
- `app = FastAPI(..., lifespan=lifespan)` — lifespan wired in
- `_DEFAULT_TOKEN` imported from `.config` to avoid string duplication

### Task 2: routers/modules.py + pyproject.toml

`backend/app/routers/modules.py` now has:
- `import logging` and `logger = logging.getLogger(__name__)` added after existing imports
- Migration block in `_load_or_default` wrapped in `try/except Exception as exc`
- On exception: `logger.error("Migration failed for module %r ...", module_id, record.schema_version, spec.schema_version, exc, exc_info=True)`
- After logger call: `data = record.data` restores last-known-good, ensuring GET returns 200 with original data instead of propagating 500

`backend/pyproject.toml`:
- `sqlmodel>=0.0.22` changed to `sqlmodel>=0.0.32`

## Verification Results

- `ruff check app/` — All checks passed (zero violations)
- `Settings(kompass_token='', ...)` raises `ValidationError` with "must not be empty" in message
- `_DEFAULT_TOKEN` and `lifespan` importable from their respective modules
- `exc_info=True` present in migration error handler
- `sqlmodel>=0.0.32` confirmed in pyproject.toml

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

No new security surface introduced beyond what is covered in the plan's threat model.

## Self-Check: PASSED

- `backend/app/config.py` — FOUND
- `backend/app/main.py` — FOUND
- `backend/app/routers/modules.py` — FOUND
- `backend/pyproject.toml` — FOUND
- Commit 08bfc89 — FOUND
- Commit c60bf61 — FOUND
