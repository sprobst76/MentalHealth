---
phase: 04-snapshot-system
plan: "05"
subsystem: frontend
tags: [snapshots, comparison, delta, synthese, react, SNAP-06]

# Dependency graph
requires:
  - "04-03-SUMMARY.md — api.getSnapshot(id): Promise<SnapshotFull> in api.ts and api.local.ts"
  - "04-04-SUMMARY.md — SyntheseModule snapshot list and snaps state (snaps.length >= 2 gate)"
provides:
  - "SyntheseModule snapshot comparison delta view (SNAP-06)"
  - "computeValuesDelta — Values wichtig/gelebt per label (toLowerCase join key)"
  - "computeYsqDelta — YSQ score per schema (18 rows, null = dash)"
  - "computeCheckinDelta — latest Checkin PHQ-9 and GAD-7 totals"
  - "Two dropdowns for Snapshot A / Snapshot B selection"
  - "Delta table with Values, YSQ, Check-in sub-tables"
affects:
  - frontend/src/modules/synthese/SyntheseModule.tsx

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level helper functions (computeValuesDelta, computeYsqDelta, computeCheckinDelta) before component export — keep component body lean"
    - "label.toLowerCase() as join key for Values comparison — prevents false mismatches on capitalization (RESEARCH.md pitfall 3)"
    - "IIFE pattern (() => {...})() inside JSX for conditional sub-table rendering"
    - "void selectCompareA/B() in onChange — consistent async-event pattern"
    - "snapA && snapB gate before delta table — delta never renders with partially loaded state"

key-files:
  created: []
  modified:
    - frontend/src/modules/synthese/SyntheseModule.tsx

key-decisions:
  - "Atomic single commit for Tasks 1+2 — TypeScript strict noUnusedLocals would fail Task 1 in isolation (compareA/B state variables not yet referenced in JSX)"
  - "YSQ score per schema = sum of 5 items; all-null items yield null score shown as dash — consistent with missing data convention"
  - "Values join key: label.toLowerCase() not id — IDs differ across snapshots taken at different schema versions; label is stable user-authored text"

# Metrics
duration: ~2min
completed: 2026-04-22
---

# Phase 4 Plan 05: Snapshot Comparison Delta View

**Delta view added to SyntheseModule — two snapshot dropdowns and a three-section delta table (Values wichtig/gelebt, YSQ schema scores, PHQ-9/GAD-7 totals) with label-based join and dash for missing data**

## Performance

- **Duration:** ~2 min
- **Completed:** 2026-04-22
- **Tasks:** 2 (committed atomically)
- **Files created:** 0
- **Files modified:** 1

## Accomplishments

### Task 1: Comparison state and fetch handlers

- Added `SnapshotFull` to the existing types import
- Added `YSQ_SCHEMAS` and `YsqData` imports from the ysq module
- Added four state variables: `compareA`, `compareB`, `snapA`, `snapB`
- Added `selectCompareA` and `selectCompareB` async handler functions that call `api.getSnapshot(id)` and set the corresponding full-snapshot state; clear state on empty selection or fetch error

### Task 2: Delta helper functions and comparison UI

- Added module-level `ValueDeltaRow` interface and three pure helper functions before the component export:
  - `computeValuesDelta` — builds union of value labels (lowercased join key), returns per-row weightA/livingA/weightB/livingB (null when label absent from a snapshot)
  - `computeYsqDelta` — iterates YSQ_SCHEMAS (18), slices answers array at schemaIdx*5, returns null score if all 5 items null
  - `computeCheckinDelta` — finds latest entry by timestamp sort in each snapshot, returns PHQ-9/GAD-7 totals via `sumAnswers`
- Added "Vergleich" Card (rendered when `snaps.length >= 2`):
  - Two `<select>` dropdowns (Snapshot A / Snapshot B) with `void selectCompare*()` in onChange
  - Delta table section rendered only when both `snapA && snapB` are non-null
  - Three sub-tables: Werte, YSQ-Schemata, Check-in
  - All missing values display "—" (null-coalescing)
  - All styling follows CLAUDE.md conventions: rounded-sm, ink/paper CSS variables, no emojis, text-xs tracking label pattern

## Task Commits

1. **Tasks 1+2: comparison state, handlers, helpers, UI** — `b8bc65d` (feat) — atomic commit (noUnusedLocals enforced)

## Files Created/Modified

- `frontend/src/modules/synthese/SyntheseModule.tsx` — comparison state, handlers, delta helper functions, and full comparison section JSX added (+240 lines, -1 line)

## Decisions Made

1. **Atomic single commit** — Same constraint as plan 04-04: TypeScript strict mode causes Task 1 to fail typecheck in isolation because state variables are not yet referenced in JSX. Both tasks committed together.

2. **label.toLowerCase() join key** — Value IDs are generated as UUIDs at item-creation time and may differ between snapshots taken months apart (e.g., if user deleted and re-added a value with the same label). Joining by lowercased label is the semantically correct identity for comparison, as specified in RESEARCH.md pitfall 3.

3. **YSQ all-null = null score** — If all 5 items for a schema are null (never answered), the score is null and displays as "—". A score of 0 (all answered as 0) is shown as 0. This correctly distinguishes "skipped" from "answered minimal".

## Deviations from Plan

None — plan executed exactly as written. Atomic commit reflects same typecheck constraint documented in plan 04-04.

## Test Results

- `npm run typecheck`: exits 0
- Backend suite: 17/17 passed (no backend changes)

## Known Stubs

None — comparison view is fully wired to `api.getSnapshot`. Both server and local modes are covered by the API client implemented in plan 04-03 (local mode returns `{}` modules for offline, which correctly renders all cells as "—").

## Threat Flags

None — all threat model items (T-4-15 through T-4-18) addressed as documented in the plan. Snapshot IDs come exclusively from the server-provided `snaps` list; React escapes all user-authored text content.

## Self-Check: PASSED

- `frontend/src/modules/synthese/SyntheseModule.tsx` — contains computeValuesDelta, computeYsqDelta, computeCheckinDelta, selectCompareA, selectCompareB, toLowerCase, "Snapshot A", "YSQ-Schemata", "PHQ-9", "GAD-7"
- Commit `b8bc65d` exists in git log
- `npm run typecheck` exits 0
- Backend 17/17 passed
