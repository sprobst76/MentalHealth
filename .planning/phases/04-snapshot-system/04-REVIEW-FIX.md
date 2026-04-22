---
phase: 04-snapshot-system
fixed_at: 2026-04-22T16:45:00Z
review_path: .planning/phases/04-snapshot-system/04-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-04-22T16:45:00Z
**Source review:** .planning/phases/04-snapshot-system/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (1 Critical, 4 Warnings)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: GET /{id} does not filter by user_id — contradicts documented T-4-04 contract

**Files modified:** `backend/app/routers/snapshots.py`, `backend/tests/test_snapshots.py`
**Commit:** da206a4
**Applied fix:** Added `Snapshot.user_id == user_id` to the WHERE clause in `get_snapshot`, removing the `# noqa: ARG001` suppression and updating the docstring to accurately describe T-4-04 enforcement. Updated `test_get_snapshot_migration_error` to look up the authenticated owner's real `user_id` from the DB (via a preceding `GET /api/modules/values` call that triggers lazy user creation) and insert the test snapshot under that ID, so the endpoint's ownership check passes. All 17 backend tests pass.

### WR-01: localApi.createSnapshot has no MAX_SNAPSHOTS guard

**Files modified:** `frontend/src/api.local.ts`
**Commit:** 1bada23
**Applied fix:** Added a `MAX_SNAPSHOTS = 200` count check at the top of `createSnapshot`. The function now calls `loadSnaps()` once, uses the result for both the guard and the subsequent `metas.unshift(meta)` (eliminating the redundant second `loadSnaps()` call that was in the original). Returns a rejected Promise with a descriptive error message when the cap is reached, matching the backend's HTTP 422 behaviour.

### WR-02: listSnapshots initial load silently discards errors

**Files modified:** `frontend/src/modules/synthese/SyntheseModule.tsx`
**Commit:** b1693e9
**Applied fix:** Replaced the empty `.catch(() => {})` on the `useEffect` mount with a handler that calls `setSnapError(...)` with the error message or a German fallback string, so the existing `snapError` display in the JSX surfaces load failures to the user.

### WR-03: Snapshot compare handlers leave compareA/compareB ID set when fetch fails

**Files modified:** `frontend/src/modules/synthese/SyntheseModule.tsx`
**Commit:** 9c95251
**Applied fix:** In both `selectCompareA` and `selectCompareB`, the `catch` block now resets the corresponding `compareA`/`compareB` state to `null` (in addition to clearing `snapA`/`snapB`) and calls `setSnapError` with the error message. This unblocks re-selection after a transient failure and makes the blank comparison view self-explanatory.

### WR-04: React key uses value label (non-unique) in the values comparison table

**Files modified:** `frontend/src/modules/synthese/SyntheseModule.tsx`
**Commit:** d3c1234
**Applied fix:** Added `lc: string` to the `ValueDeltaRow` interface and included `lc` in the objects returned by `computeValuesDelta`. Changed `<tr key={r.label}>` to `<tr key={r.lc}>` in the values delta table. The lowercase canonical form is guaranteed unique within the row array because `allLabels` is a `Set` keyed on lowercase. The YSQ table (line 489) was left unchanged as reviewer confirmed YSQ labels are unique by construction.

---

_Fixed: 2026-04-22T16:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
