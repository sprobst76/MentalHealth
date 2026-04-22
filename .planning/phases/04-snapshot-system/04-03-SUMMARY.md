---
phase: 04-snapshot-system
plan: "03"
subsystem: frontend
tags: [snapshots, api-client, types, localStorage]

# Dependency graph
requires:
  - "04-02-SUMMARY.md — POST /api/snapshots, GET /api/snapshots, GET /api/snapshots/{id} live"
provides:
  - "SnapshotMeta, SnapshotModuleEntry, SnapshotFull TypeScript interfaces in types.ts"
  - "serverApi.createSnapshot, serverApi.listSnapshots, serverApi.getSnapshot"
  - "localApi.createSnapshot, localApi.listSnapshots, localApi.getSnapshot"
  - "Two-key localStorage layout for snapshot persistence in offline mode"
affects:
  - frontend/src/modules/synthese/ (plans 04-04, 04-05 — consumers of these methods)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-key localStorage layout: SNAPS_KEY (metadata list) + SNAP_KEY(id) (full blob)"
    - "loadSnaps() private helper for reading snapshot metadata list"
    - "Named method syntax in localApi (consistent with existing pattern)"
    - "Arrow function syntax in serverApi (consistent with existing pattern)"
    - "SnapshotFull extends SnapshotMeta — structural composition"

key-files:
  created: []
  modified:
    - frontend/src/types.ts
    - frontend/src/api.ts
    - frontend/src/api.local.ts

key-decisions:
  - "SnapshotModuleEntry uses data: unknown (not generic T) — consistent with how snapshot blobs store heterogeneous module data without known type at read time"
  - "localApi.createSnapshot iterates all modules (including synthese kind=special), reads from localStorage only if key exists — no-op for empty modules"
  - "crypto.randomUUID() used directly in localApi — consistent with browser-only context; no uid() fallback needed"
  - "label: string | null (not string | undefined) — consistent with updated_at: string | null pattern in ModuleRecord"

# Metrics
duration: 8min
completed: 2026-04-22
---

# Phase 4 Plan 03: Snapshot TypeScript Types and API Client Methods

**Three Snapshot interfaces added to types.ts; createSnapshot / listSnapshots / getSnapshot wired into both serverApi and localApi — two-key localStorage layout for offline mode**

## Performance

- **Duration:** ~8 min
- **Completed:** 2026-04-22
- **Tasks:** 2
- **Files created:** 0
- **Files modified:** 3

## Accomplishments

### Task 1: SnapshotMeta, SnapshotModuleEntry, SnapshotFull in types.ts

- Appended three interfaces after `AllData` without modifying any existing types
- `SnapshotFull extends SnapshotMeta` — structural composition keeps the relationship explicit
- `label: string | null` consistent with `updated_at: string | null` in `ModuleRecord`

### Task 2: Snapshot methods in serverApi and localApi

**api.ts (serverApi):**
- Added `SnapshotMeta, SnapshotFull` to the existing import from `./types`
- Added `createSnapshot`, `listSnapshots`, `getSnapshot` as arrow functions (consistent with serverApi style)
- `createSnapshot` sends `{ label: label ?? null }` as JSON body to `POST /api/snapshots`

**api.local.ts (localApi):**
- Added `SnapshotMeta, SnapshotFull, SnapshotModuleEntry` to the existing import
- Added two storage key constants: `SNAPS_KEY = "kompass:snapshots"` and `SNAP_KEY(id) = "kompass:snapshot:${id}"`
- Added private `loadSnaps()` helper — reads and parses the metadata list
- `createSnapshot`: iterates all registered modules, reads existing localStorage entries, stores full blob under `SNAP_KEY(id)`, prepends metadata to `SNAPS_KEY` list
- `listSnapshots`: returns `loadSnaps()` result
- `getSnapshot`: reads full blob from `SNAP_KEY(id)`, rejects with Error if not found

## Task Commits

1. **Task 1: types.ts snapshot interfaces** — `c7250cd` (feat)
2. **Task 2: serverApi + localApi snapshot methods** — `76c6877` (feat)

## Files Created/Modified

- `frontend/src/types.ts` — SnapshotMeta, SnapshotModuleEntry, SnapshotFull appended
- `frontend/src/api.ts` — SnapshotMeta/SnapshotFull imported; createSnapshot, listSnapshots, getSnapshot added to serverApi
- `frontend/src/api.local.ts` — SnapshotMeta/SnapshotFull/SnapshotModuleEntry imported; SNAPS_KEY, SNAP_KEY constants; loadSnaps() helper; createSnapshot, listSnapshots, getSnapshot added to localApi

## Decisions Made

1. **SnapshotModuleEntry.data: unknown** — Snapshot blobs aggregate all modules without knowing each module's specific type at the snapshot layer. Using `unknown` is consistent with how `ModuleRecord<T = unknown>` handles the same problem.

2. **Two-key localStorage layout** — Separating the metadata list (`SNAPS_KEY`) from per-snapshot blobs (`SNAP_KEY(id)`) avoids O(n) reads when listing snapshots. The plan specified this layout explicitly.

3. **crypto.randomUUID() in localApi** — localApi only runs in browser contexts where `crypto.randomUUID()` is available. The `uid()` fallback in `lib/uid.ts` was designed for environments where `file://` protocol might be an issue, but snapshot creation is an active user action requiring a running browser — no fallback needed.

## Deviations from Plan

None — plan executed exactly as written.

## Test Results

- `npm run typecheck`: exits 0 (TypeScript compilation clean after all three file changes)
- Backend suite: 17/17 passed (unchanged by frontend-only changes)

## Known Stubs

None — all three methods in both API clients are fully implemented.

## Threat Flags

None — all threat model items (T-4-08 through T-4-11) accepted as documented in the plan.

## Self-Check: PASSED

- `frontend/src/types.ts` — found, contains SnapshotMeta, SnapshotModuleEntry, SnapshotFull
- `frontend/src/api.ts` — found, contains createSnapshot, listSnapshots, getSnapshot
- `frontend/src/api.local.ts` — found, contains SNAPS_KEY, SNAP_KEY, loadSnaps, createSnapshot, listSnapshots, getSnapshot
- Commits c7250cd and 76c6877 exist in git log

---

*Phase: 04-snapshot-system*
*Completed: 2026-04-22*
