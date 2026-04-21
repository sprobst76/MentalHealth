---
phase: 01-correctness-build
plan: "01"
subsystem: backend/tests
tags: [testing, tdd, pytest, httpx, qual-04, qual-05]
dependency_graph:
  requires: []
  provides:
    - backend/tests/__init__.py
    - backend/tests/conftest.py
    - backend/tests/test_config.py
    - backend/tests/test_modules.py
  affects:
    - backend/app/config.py (tested by test_config.py)
    - backend/app/main.py (tested by test_config.py — lifespan import)
    - backend/app/routers/modules.py (tested by test_modules.py)
tech_stack:
  added:
    - pytest-asyncio>=0.23 (async test runner)
    - asyncio_mode=auto (pyproject.toml pytest config)
  patterns:
    - httpx.AsyncClient + ASGITransport for FastAPI integration tests
    - SQLModel in-memory SQLite engine with get_session dependency override
    - patch.object on frozen dataclass class method (not instance)
key_files:
  created:
    - backend/tests/__init__.py
    - backend/tests/conftest.py
    - backend/tests/test_config.py
    - backend/tests/test_modules.py
  modified:
    - backend/pyproject.toml
decisions:
  - "Used in-memory SQLite with dependency override (get_session) for isolation — avoids touching real DB file"
  - "Patched ModuleSpec.migrate at class level (not instance) because ModuleSpec is a frozen dataclass"
  - "asyncio_mode=auto avoids per-test @pytest.mark.asyncio decorators"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 01 Plan 01: Backend Test Infrastructure Summary

**One-liner:** pytest infrastructure with httpx/ASGITransport fixtures and RED-phase tests covering QUAL-04 migration-error guard and QUAL-05 empty-token validation.

## What Was Built

Four files create the backend test layer from scratch (no tests existed before):

- `backend/tests/__init__.py` — empty package init for pytest discovery
- `backend/tests/conftest.py` — async `client` fixture using `httpx.AsyncClient` with `ASGITransport(app=app)` and in-memory SQLite via `get_session` dependency override; `auth_headers` fixture
- `backend/tests/test_config.py` — three tests for QUAL-05: empty token rejected, default token accepted, default token triggers WARNING (fails RED until Plan 02 adds `lifespan` and `field_validator`)
- `backend/tests/test_modules.py` — one integration test for QUAL-04: migration error returns HTTP 200 not 500 (fails RED until Plan 02 adds try/except guard in `_load_or_default`)

`pyproject.toml` updated with `pytest-asyncio>=0.23` dev dep and `asyncio_mode = "auto"`.

## Test Status (RED — intentional)

| Test | Status | Reason |
|------|--------|--------|
| `test_empty_token_rejected` | FAIL | `field_validator` not yet in `config.py` |
| `test_default_token_is_accepted` | PASS | baseline — validates Settings instantiation |
| `test_default_token_warning` | FAIL | `lifespan` not yet in `main.py` |
| `test_migration_error_returns_last_known_good` | FAIL | no try/except in `_load_or_default` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] conftest needed in-memory DB with get_session override**

- **Found during:** Task 2 (initial test run)
- **Issue:** The test client used the real DB engine; `users` table didn't exist in the test environment, causing `OperationalError: no such table: users` — tests failed for the wrong reason, masking the actual QUAL-04 behavior under test
- **Fix:** Updated `conftest.py` to create an in-memory SQLite engine with `SQLModel.metadata.create_all()` and override `get_session` dependency so all requests use the isolated test DB
- **Files modified:** `backend/tests/conftest.py`
- **Commit:** 82a54e2

**2. [Rule 3 - Blocking] Frozen dataclass cannot be patched on instance**

- **Found during:** Task 2 (second test run)
- **Issue:** `patch.object(spec, "migrate", ...)` raised `FrozenInstanceError` because `ModuleSpec` is a `@dataclass(frozen=True)` — instance attribute assignment is prohibited
- **Fix:** Changed to `patch.object(ModuleSpec, "migrate", ...)` — patches the class method instead, which works and correctly intercepts all calls to `spec.migrate()` during the test
- **Files modified:** `backend/tests/test_modules.py`
- **Commit:** 82a54e2

## Self-Check: PASSED

Files exist:
- `backend/tests/__init__.py` — FOUND
- `backend/tests/conftest.py` — FOUND
- `backend/tests/test_config.py` — FOUND
- `backend/tests/test_modules.py` — FOUND

Commits:
- `021088b` — feat(01-01): add test package init, httpx fixture, and pytest-asyncio config — FOUND
- `82a54e2` — test(01-01): add failing RED tests for QUAL-04 and QUAL-05 — FOUND
