---
phase: 05-schema-guided-insights
plan: "05-03"
subsystem: ui
tags: [react, typescript, goals, navigation, prefill, moduleprops]

# Dependency graph
requires:
  - phase: 05-02
    provides: InsightsBlock with "Als Ziel erkunden" button and temporary onNavigateToGoals cast
provides:
  - ModuleProps<T> with typed optional onNavigateToGoals callback
  - App.tsx goalPrefill state + handleNavigateToGoals handler + __goalPrefill allData injection
  - GoalsModule.tsx isGoalPrefill type guard + prefill useEffect (one-shot goal creation on mount)
  - SyntheseModule.tsx cleaned up — temporary Plan 02 cast removed
affects: [goals, synthese, registry, App]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "__goalPrefill protocol key — internal App.tsx→GoalsModule channel via allData, cleared after one render tick via setTimeout"
    - "isGoalPrefill type guard pattern — avoids unsafe 'as any' casts for protocol keys in allData (RESEARCH.md Pitfall 4)"
    - "AllData explicit type annotation on allData object in App.tsx when conditional spread would otherwise narrow the inferred type too tightly"

key-files:
  created: []
  modified:
    - frontend/src/modules/registry.ts
    - frontend/src/modules/synthese/SyntheseModule.tsx
    - frontend/src/App.tsx
    - frontend/src/modules/goals/GoalsModule.tsx

key-decisions:
  - "Use setTimeout(setGoalPrefill(null), 0) to clear prefill after GoalsModule mounts — one-shot protocol prevents duplicate goals on subsequent visits"
  - "Add explicit AllData type annotation on allData to prevent TypeScript narrowing the conditional spread to a too-specific type"
  - "isGoalPrefill type guard at file level (not inline) keeps useEffect body clean and testable"

patterns-established:
  - "Protocol key pattern: prefix internal allData keys with __ to namespace them as non-user data"
  - "One-shot navigation prefill: set state → navigate → clear after tick. GoalsModule useEffect fires once on empty dep array"

requirements-completed: [HINT-04]

# Metrics
duration: 2min
completed: 2026-04-23
---

# Phase 5 Plan 03: Navigate + Prefill Wiring Summary

**End-to-end HINT-04 flow: clicking "Als Ziel erkunden" in InsightsBlock navigates to GoalsModule with a pre-filled, immediately-open goal using schema label + goalSuggestion text**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-23T06:25:51Z
- **Completed:** 2026-04-23T06:28:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- ModuleProps<T> gains the typed `onNavigateToGoals?` optional callback — Plan 02 temporary cast removed cleanly from SyntheseModule
- App.tsx wires the full navigation + prefill protocol: goalPrefill state, handleNavigateToGoals, __goalPrefill injection into allData, prop threading to active.Component
- GoalsModule.tsx reads `__goalPrefill` on first mount via a type-guarded useEffect — creates and opens a pre-filled goal; subsequent module visits do not re-trigger

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onNavigateToGoals to ModuleProps, clean up SyntheseModule cast** - `2fde867` (feat)
2. **Task 2: Wire goalPrefill state in App.tsx and prefill useEffect in GoalsModule** - `ef6e98a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/src/modules/registry.ts` — ModuleProps<T> gains `onNavigateToGoals?` optional field
- `frontend/src/modules/synthese/SyntheseModule.tsx` — destructures onNavigateToGoals cleanly; Plan 02 temporary cast and TODO removed
- `frontend/src/App.tsx` — goalPrefill state, handleNavigateToGoals, AllData-typed allData with __goalPrefill injection, onNavigateToGoals prop threading; added `import type { AllData }` from types
- `frontend/src/modules/goals/GoalsModule.tsx` — useEffect import added; isGoalPrefill type guard (file-level); prefill useEffect creates + opens goal on mount

## Decisions Made

- `setTimeout(setGoalPrefill(null), 0)` clears the prefill key after one render tick — GoalsModule's empty-dep useEffect fires exactly once on mount, preventing duplicate goals on later visits
- Explicit `const allData: AllData = { ... }` type annotation required because TypeScript's inference narrowed the conditional spread `...(condition ? { __goalPrefill } : {})` to a type that excluded `checkin` and other module keys — widening back to `Record<string, unknown>` fixes the error cleanly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type narrowing on allData with conditional spread**
- **Found during:** Task 2 (App.tsx allData construction)
- **Issue:** TypeScript inferred `allData` as an intersection type excluding module-keyed properties like `checkin` when the conditional spread `...(condition ? { __goalPrefill } : {})` was added — causing TS2339 error on `allData?.checkin`
- **Fix:** Added explicit `const allData: AllData = { ... }` type annotation to widen the type back to `Record<string, unknown>` as intended
- **Files modified:** `frontend/src/App.tsx` (import type AllData added, type annotation added)
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `ef6e98a` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript inference bug)
**Impact on plan:** Required fix for correctness; no scope creep.

## Issues Encountered

None beyond the TypeScript inference issue documented above as a deviation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HINT-04 fully wired end-to-end: InsightsBlock button → App.tsx navigation + prefill → GoalsModule prefill useEffect
- Manual browser verification step still required (per VALIDATION.md): complete YSQ, navigate to Synthese, click "Als Ziel erkunden", confirm goal opens pre-filled in edit mode, confirm no duplicate on return visit
- Phase 5 all 3 plans complete; v1.1 Schema-Guided Insights milestone ready for final review

---
*Phase: 05-schema-guided-insights*
*Completed: 2026-04-23*

## Self-Check: PASSED

- FOUND: frontend/src/modules/registry.ts
- FOUND: frontend/src/modules/synthese/SyntheseModule.tsx
- FOUND: frontend/src/App.tsx
- FOUND: frontend/src/modules/goals/GoalsModule.tsx
- FOUND: .planning/phases/05-schema-guided-insights/05-03-SUMMARY.md
- FOUND commit: 2fde867 (Task 1)
- FOUND commit: ef6e98a (Task 2)
