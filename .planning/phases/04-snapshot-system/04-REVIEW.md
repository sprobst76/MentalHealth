---
phase: 04-snapshot-system
reviewed: 2026-04-22T16:17:30Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - backend/tests/test_snapshots.py
  - backend/app/routers/snapshots.py
  - backend/app/modules/values.py
  - backend/app/schemas/api.py
  - backend/app/schemas/__init__.py
  - backend/app/main.py
  - frontend/src/types.ts
  - frontend/src/api.ts
  - frontend/src/api.local.ts
  - frontend/src/modules/synthese/SyntheseModule.tsx
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-22T16:17:30Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

The snapshot system is well-structured overall. Auth is correctly enforced via
`Depends(current_user_id)` on all three endpoints. The `MAX_SNAPSHOTS` guard,
migration error fallback, and immutability guarantee are all implemented. The
frontend types are accurate and the `localApi` mirrors the server API interface
faithfully.

Two substantive issues stand out: the `GET /api/snapshots/{id}` endpoint has a
documented security contract (`T-4-04: filters by both snapshot id AND user_id`)
that is not implemented in code — the query filters by `snapshot_id` only — and
the `localApi.createSnapshot` has no snapshot count limit, making it diverge from
the backend's `MAX_SNAPSHOTS` guard. Three warnings cover missing error feedback
in the frontend and an unsafe state-desync pattern in the compare handlers.

## Critical Issues

### CR-01: GET /{id} does not filter by user_id — contradicts documented T-4-04 contract

**File:** `backend/app/routers/snapshots.py:163`

**Issue:** The module-level docstring explicitly lists `"GET /{id} filters by both
snapshot id AND user_id — 404 if not found (T-4-04)"` as a design decision. The
actual query on line 163 only filters by `Snapshot.id`:

```python
snap = session.exec(
    select(Snapshot).where(Snapshot.id == snapshot_id)   # no user_id filter
).first()
```

The `user_id` dependency is injected but immediately suppressed with
`# noqa: ARG001 — auth enforced, single-user v1`. For the current single-user
deployment this is functionally safe (there is only one user). However:

1. The module docstring is false: the implementation does **not** implement T-4-04.
2. The test `test_get_snapshot_migration_error` inserts a snapshot with a different
   `fake_user_id` and asserts `200` — confirming any authenticated user can read
   any snapshot regardless of ownership. The test comment acknowledges this
   ("der GET-Endpoint sucht nur nach der Snapshot-ID, nicht nach user_id-Filterung
   bei Einzelabruf") — which directly contradicts the module docstring.
3. If multi-user support is enabled (the schema and `User` model already exist),
   this silently becomes an IDOR (Insecure Direct Object Reference) vulnerability.

**Fix:** Either add the `user_id` filter to the query (preferred — matches the
stated contract and is safe to add now) or correct the docstring and the T-4-04
claim to accurately reflect that single-user v1 does not scope by user. Adding
the filter is one line:

```python
snap = session.exec(
    select(Snapshot).where(
        Snapshot.id == snapshot_id,
        Snapshot.user_id == user_id,   # enforces T-4-04
    )
).first()
# Remove the noqa: ARG001 comment — user_id is now used
```

Update the test `test_get_snapshot_migration_error` to insert with the real
user's `user_id` (obtainable via `GET /api/modules` or by adding a fixture that
returns the authenticated user's ID).

## Warnings

### WR-01: localApi.createSnapshot has no MAX_SNAPSHOTS guard

**File:** `frontend/src/api.local.ts:108`

**Issue:** The server API enforces a hard cap of 200 snapshots per user with an
HTTP 422 response. The `localApi` equivalent at line 108 has no such guard. In
offline/single-file mode, users can create unbounded snapshots which will grow
`localStorage` without limit. This also means the two API implementations have
diverging behaviour that is invisible to callers.

**Fix:** Add a count check before creating:

```typescript
createSnapshot(label?: string): Promise<SnapshotMeta> {
  const metas = loadSnaps();
  const MAX_SNAPSHOTS = 200;
  if (metas.length >= MAX_SNAPSHOTS) {
    return Promise.reject(
      new Error(`Maximum number of snapshots (${MAX_SNAPSHOTS}) reached.`)
    );
  }
  // ... rest of existing implementation
```

### WR-02: listSnapshots initial load silently discards errors

**File:** `frontend/src/modules/synthese/SyntheseModule.tsx:230`

**Issue:** The `useEffect` that loads the snapshot list on mount uses:

```typescript
api.listSnapshots().then(setSnaps).catch(() => {});
```

The empty `.catch(() => {})` swallows any error without setting `snapError` or
any other visible state. If the API call fails (server down, token missing, quota
error), the Snapshots section renders as if no snapshots exist. The user gets no
feedback and has no way to distinguish "no snapshots yet" from "load failed".

**Fix:** Propagate the error to `snapError`:

```typescript
useEffect(() => {
  api.listSnapshots()
    .then(setSnaps)
    .catch((err: unknown) => {
      setSnapError(err instanceof Error ? err.message : "Snapshots konnten nicht geladen werden.");
    });
}, []);
```

### WR-03: Snapshot compare handlers leave compareA/compareB ID set when fetch fails

**File:** `frontend/src/modules/synthese/SyntheseModule.tsx:255–273`

**Issue:** In `selectCompareA` and `selectCompareB`, if `api.getSnapshot(id)` throws,
the handler sets `snapA`/`snapB` to `null` but leaves `compareA`/`compareB` at the
selected ID:

```typescript
async function selectCompareA(id: string | null) {
  setCompareA(id);            // ID set
  if (!id) { setSnapA(null); return; }
  try {
    const full = await api.getSnapshot(id);
    setSnapA(full);
  } catch {
    setSnapA(null);           // data cleared — but compareA is still the failing ID
  }
}
```

The comparison section correctly guards with `snapA && snapB` so no crash occurs.
But the dropdown shows a snapshot selected while the comparison is blank, with no
error message. If the user selects the same snapshot again after a transient
failure, the `onChange` fires with the same `id` — React's `<select>` won't
re-trigger `onChange` because the value hasn't changed — leaving the user stuck.

**Fix:** Reset `compareA` to `null` on failure, or expose an error beside the
select:

```typescript
} catch (err: unknown) {
  setCompareA(null);   // reset selection so re-selection is possible
  setSnapA(null);
  setSnapError(err instanceof Error ? err.message : "Snapshot A konnte nicht geladen werden.");
}
```

### WR-04: React key uses value label (non-unique) in the values comparison table

**File:** `frontend/src/modules/synthese/SyntheseModule.tsx:446`

**Issue:** The values delta table uses `r.label` as the React row key:

```tsx
<tr key={r.label}>
```

`computeValuesDelta` deduplicates on `v.label.toLowerCase()` and uses
`va?.label ?? vb?.label ?? lc` as the display label. If both `snapA` and `snapB`
contain a value with the same lowercase label but different capitalisation (e.g.
`"Freiheit"` in A, `"FREIHEIT"` in B), the display label will be `"Freiheit"`
(from A). This is one row — so the key is unique in that case.

The real risk is two distinct values with **identical labels** in the same
snapshot (user enters "Freiheit" twice). In that scenario, `allLabels` (a Set
keyed on lowercase) deduplicates to a single entry, silently dropping one value.
This is a data loss in the display and produces a duplicated React key if the
same label appears via both snapshots.

The same pattern is repeated for YSQ schemas on line 477, though YSQ labels are
defined in a constant array and are unique by construction.

**Fix:** Use a stable composite key. For values, the safest key is the lowercase
canonical form (`lc`), which is guaranteed unique within the row array:

```tsx
return [...allLabels].map((lc) => {
  // ...
  return { lc, label: ..., weightA: ..., livingA: ..., weightB: ..., livingB: ... };
});
// In JSX:
<tr key={r.lc}>
```

## Info

### IN-01: select(func.count()) should prefer an explicit column argument

**File:** `backend/app/routers/snapshots.py:88–90`

**Issue:** The MAX_SNAPSHOTS guard uses `select(func.count())` with no column
argument. SQLAlchemy correctly infers `FROM snapshots` from the `.where()` clause
and generates `SELECT count(*) FROM snapshots WHERE ...`. It works, but the more
idiomatic and explicit form avoids the implicit inference:

```python
# Current (correct but relies on WHERE-clause inference)
select(func.count()).where(Snapshot.user_id == user_id)

# Preferred (explicit, no inference needed)
select(func.count(Snapshot.id)).where(Snapshot.user_id == user_id)
```

### IN-02: document.execCommand("copy") is deprecated

**File:** `frontend/src/modules/synthese/SyntheseModule.tsx:288`

**Issue:** The clipboard fallback in `copyReport` uses
`document.execCommand("copy")` which is deprecated in all modern browsers. It
is used as a fallback when `navigator.clipboard.writeText` fails (e.g. in
non-secure contexts or when permissions are denied). For the primary server-backed
deployment this is a non-issue since the app runs on HTTPS. For offline/file://
mode `navigator.clipboard` may be unavailable, making the fallback load-bearing.

The deprecated API still works in all major browsers today but may be removed in
future. No immediate action required, but it should be replaced when a suitable
alternative exists (e.g. a user-visible text area for manual copy).

### IN-03: No test for MAX_SNAPSHOTS enforcement or unauthenticated snapshot access

**File:** `backend/tests/test_snapshots.py`

**Issue:** The test suite covers the happy path (create, list, get, migration
fallback) but two stated requirements lack coverage:

1. **T-4-05 (MAX_SNAPSHOTS):** No test verifies that creating the 201st snapshot
   returns HTTP 422. Creating 200 snapshots in a test is impractical, but the
   guard could be tested by temporarily lowering MAX_SNAPSHOTS or by directly
   inserting rows into the DB and then making one POST.

2. **Auth rejection:** No test verifies that omitting or using a wrong token on
   `POST /api/snapshots`, `GET /api/snapshots`, or `GET /api/snapshots/{id}`
   returns HTTP 401. Especially relevant because the `get_snapshot` function
   currently ignores `user_id` (CR-01); a test that asserts unauthenticated
   access is rejected would catch any future auth regression.

---

_Reviewed: 2026-04-22T16:17:30Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
