---
phase: 04-snapshot-system
plan: "01"
subsystem: testing
tags: [pytest, asyncio, snapshots, tdd, red-gate]

# Dependency graph
requires: []
provides:
  - "Failing integration test suite for /api/snapshots endpoints (5 tests)"
  - "RED gate for SNAP-01, SNAP-02, SNAP-03 — blocks plan 04-02 until GREEN"
affects:
  - 04-02-snapshots-router
  - 04-03-snapshot-get-single

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED gate: test file written before router exists — all 5 tests fail with 404"
    - "Direct DB insert pattern using Session(test_engine) with pre-saved ID to avoid DetachedInstanceError"

key-files:
  created:
    - backend/tests/test_snapshots.py
  modified: []

key-decisions:
  - "snapshot.id saved to local variable before session.commit() to avoid SQLAlchemy DetachedInstanceError on lazy-loaded attribute access"
  - "fake user_id for direct DB insert in test_get_snapshot_migration_error uses uuid4() — endpoint lookup is by snapshot id only, not user-filtered"

patterns-established:
  - "Snapshot DB blob uses envelope: {\"modules\": {...}} — not flat; metadata response omits modules key"
  - "Fallback-test (QUAL-04) inserts unknown module with schema_version=99 directly via test_engine Session"

requirements-completed: [SNAP-01, SNAP-02, SNAP-03]

# Metrics
duration: 12min
completed: 2026-04-22
---

# Phase 4 Plan 01: Snapshot API RED Test Suite

**5 failing pytest-asyncio integration tests that gate SNAP-01/02/03 — all fail with 404 because no snapshot router exists yet**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-22T00:00:00Z
- **Completed:** 2026-04-22T00:12:00Z
- **Tasks:** 1 (TDD RED phase)
- **Files modified:** 1

## Accomplishments

- Created `backend/tests/test_snapshots.py` with 5 `@pytest.mark.asyncio` tests
- Each test has a docstring referencing its SNAP-XX requirement
- All 5 tests fail with `404 Not Found` — confirmed RED gate (no router registered)
- Direct DB insert pattern for QUAL-04 fallback test uses pre-saved UUID to avoid SQLAlchemy `DetachedInstanceError`

## Task Commits

1. **Task 1: Write RED test suite for snapshot API endpoints** - `656c44e` (test)

## Files Created/Modified

- `backend/tests/test_snapshots.py` — 5 failing integration tests for POST /api/snapshots, GET /api/snapshots, GET /api/snapshots/{id}

## Decisions Made

- SQLAlchemy `DetachedInstanceError` on `fake_snapshot.id` after `session.commit()`: fixed by storing `fake_snap_id = uuid4()` before creating the ORM object, so the ID is accessible outside the session context.
- `user_id` for direct DB insert uses `uuid4()` (arbitrary) because the GET endpoint for a single snapshot is looked up by snapshot `id`, not filtered by `user_id`. This avoids needing an auth round-trip for the setup step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DetachedInstanceError in test_get_snapshot_migration_error**
- **Found during:** Task 1, first pytest run
- **Issue:** `fake_snapshot.id` accessed after `session.commit()` triggers SQLAlchemy `DetachedInstanceError` — ORM object expires after commit outside the session context
- **Fix:** Store `fake_snap_id = uuid4()` before constructing `Snapshot(id=fake_snap_id, ...)`, then use `fake_snap_id` in the GET URL
- **Files modified:** `backend/tests/test_snapshots.py`
- **Verification:** Second pytest run shows all 5 tests fail with `AssertionError: 404` (correct RED state, not SQLAlchemy error)
- **Committed in:** `656c44e` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in test setup)
**Impact on plan:** Fix was necessary for test to fail from the right reason (missing router, not test infrastructure error). No scope creep.

## Issues Encountered

- `python` not in PATH on host — used project venv `~/.venv/bin/pytest` directly
- `settings.single_user_id` does not exist in `config.py` — plan comment referenced a non-existent attribute; resolved with `uuid4()` approach

## Known Stubs

None — test file only, no production stubs.

## Threat Flags

None — test infrastructure file, no new network endpoints or trust boundaries introduced.

## Next Phase Readiness

- RED gate confirmed: `pytest tests/test_snapshots.py` exits non-zero (5 FAILED)
- Plan 04-02 can now implement the snapshot router and turn these tests GREEN
- No blockers

---

*Phase: 04-snapshot-system*
*Completed: 2026-04-22*
