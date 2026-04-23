---
phase: 05-schema-guided-insights
plan: "02"
subsystem: ui
tags: [react, typescript, tailwind, ysq, synthese, insights]

# Dependency graph
requires:
  - phase: 05-01
    provides: YSQ_HINTS_MAP constant (ysq/hints.ts), getTop3Schemas/getValueGaps utilities (lib/insights.ts)

provides:
  - InsightsBlock component: top-3 YSQ schema cards (name, score, healingDirection, goalSuggestions, obstacleHints) + values gap section
  - synthese/constants.ts: 6 UI string constants (INSIGHTS_SECTION_HEADING, SCHEMA_INSIGHTS_GOAL_SUGGESTIONS_LABEL, SCHEMA_INSIGHTS_OBSTACLES_LABEL, VALUES_GAP_SECTION_LABEL, VALUES_GAP_HINT_TEXT, EXPLORE_AS_GOAL_LABEL)
  - SyntheseModule renders InsightsBlock after module summary cards, before Snapshots

affects:
  - 05-03 (wires onNavigateToGoals prop; removes temporary cast in SyntheseModule)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All display strings in a component imported from a co-located constants.ts — no inline German text in JSX"
    - "Guard pattern: InsightsBlock returns null when ysqData.answers is null"
    - "Temporary cast (rest as any) for props not yet on ModuleProps — removed in follow-up plan"

key-files:
  created:
    - frontend/src/modules/synthese/constants.ts
    - frontend/src/modules/synthese/InsightsBlock.tsx
  modified:
    - frontend/src/modules/synthese/SyntheseModule.tsx

key-decisions:
  - "All UI strings centralized in synthese/constants.ts — enforces CLAUDE.md convention that no German text appears inline in JSX"
  - "Temporary (rest as any) cast for onNavigateToGoals rather than widening ModuleProps — Plan 05-03 owns that API extension"
  - "InsightsBlock returns null for both empty-YSQ and no-gaps cases, rendering nothing rather than an empty section"

patterns-established:
  - "synthese/constants.ts: UI string constants follow the same pattern as other modules' constants.ts files"
  - "InsightsBlock guard: null check on ysqData?.answers at component top, before any computation"

requirements-completed:
  - HINT-02
  - HINT-03
  - HINT-05

# Metrics
duration: 3min
completed: 2026-04-23
---

# Phase 5 Plan 02: InsightsBlock Component Summary

**InsightsBlock renders YSQ top-3 schema cards with healingDirection/goalSuggestions/obstacleHints and values gap section on the Synthese page, all strings from constants.ts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-23T06:20:09Z
- **Completed:** 2026-04-23T06:23:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `synthese/constants.ts` created with 6 exported string constants — satisfies HINT-05 (no hardcoded strings in component body)
- `InsightsBlock.tsx` renders top-3 YSQ schema cards (schema name in accent color, score "N / 30", healingDirection, goalSuggestions list, "Als Ziel erkunden" button in ocean color, obstacleHints list); returns null when `ysqData.answers` is null — satisfies HINT-02
- Values gap section shows items where `weight − living >= 2` with gap badge and hint text — satisfies HINT-03
- `SyntheseModule.tsx` imports and renders `<InsightsBlock>` after module summary cards, before Snapshots section
- TypeScript clean; 19/19 Vitest tests pass (no new tests needed — logic under test was covered in Plan 01)

## Task Commits

1. **Task 1: Create synthese/constants.ts** - `bb92b04` (feat)
2. **Task 2: Create InsightsBlock.tsx and wire into SyntheseModule.tsx** - `655d695` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `frontend/src/modules/synthese/constants.ts` — 6 UI string exports for InsightsBlock display text
- `frontend/src/modules/synthese/InsightsBlock.tsx` — YSQ top-3 schema cards + values gap section; guard against null answers
- `frontend/src/modules/synthese/SyntheseModule.tsx` — added InsightsBlock import, `...rest` destructure with temporary cast, `<InsightsBlock>` rendered before Snapshots

## Decisions Made

- Centralized all display strings in `constants.ts` per CLAUDE.md convention ("Inhaltliche Konstanten zuerst")
- Used `(rest as any).onNavigateToGoals` temporary cast rather than extending `ModuleProps` — Plan 05-03 owns that prop extension
- `InsightsBlock` returns null early on empty state rather than rendering an empty section header

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `node_modules` not present in worktree at start — ran `npm install --prefer-offline` to install dependencies before running `tsc` and `vitest`. This is expected in fresh worktrees.

## Known Stubs

- `onNavigateToGoals` prop on `InsightsBlock` is present but receives a temporary cast from `(rest as any)` in `SyntheseModule`. The button renders and calls the prop if provided, but `App.tsx` does not yet pass the prop. Full wiring is Plan 05-03.

## Threat Flags

No new security-relevant surface introduced. InsightsBlock is a read-only display component that reads `allData` already present in the browser session. Single-user, auth-gated. No new network endpoints, auth paths, or file access patterns.

## Next Phase Readiness

- InsightsBlock fully rendered on Synthese page — insights are visible to the user
- "Als Ziel erkunden" button is present and calls `onNavigateToGoals` prop when provided
- Plan 05-03 can extend `ModuleProps`, pass the navigation handler from `App.tsx`, and remove the temporary cast in `SyntheseModule.tsx`

---
*Phase: 05-schema-guided-insights*
*Completed: 2026-04-23*
