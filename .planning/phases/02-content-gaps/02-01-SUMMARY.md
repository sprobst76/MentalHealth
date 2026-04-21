---
phase: 02-content-gaps
plan: "01"
subsystem: frontend-modules
tags: [refactor, constants, beliefs_act, obstacles, goals]
dependency_graph:
  requires: []
  provides: [DEFUSION_EXAMPLES, EXPLORATION_PROMPTS, GOAL_PROMPTS in constants files]
  affects: [beliefs_act/BeliefsActModule.tsx, obstacles/ObstaclesModule.tsx, goals/GoalsModule.tsx]
tech_stack:
  added: []
  patterns: [inline-to-constants extraction]
key_files:
  created:
    - frontend/src/modules/beliefs_act/constants.ts
    - frontend/src/modules/obstacles/constants.ts
  modified:
    - frontend/src/modules/goals/constants.ts
    - frontend/src/modules/goals/GoalsModule.tsx
    - frontend/src/modules/beliefs_act/BeliefsActModule.tsx
    - frontend/src/modules/obstacles/ObstaclesModule.tsx
decisions: []
metrics:
  duration: "3 minutes"
  completed: "2026-04-21"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 6
---

# Phase 2 Plan 01: Inline Prompt Arrays to constants.ts Summary

**One-liner:** GOAL_PROMPTS, DEFUSION_EXAMPLES und EXPLORATION_PROMPTS aus Komponenten-Bodies in dedizierte constants.ts-Dateien extrahiert — reine Refaktorierung ohne Verhaltensänderung.

## What Was Built

Drei inline-deklarierte String-Arrays wurden aus den Komponenten-Bodies entfernt und in die zugehörigen `constants.ts`-Dateien verschoben:

- `GOAL_PROMPTS` aus `GoalsModule.tsx` → in `goals/constants.ts` ergänzt (neben `HORIZON_LABEL` und `STATUS_LABEL`)
- `DEFUSION_EXAMPLES` aus `BeliefsActModule.tsx` → neue Datei `beliefs_act/constants.ts`
- `EXPLORATION_PROMPTS` aus `ObstaclesModule.tsx` → neue Datei `obstacles/constants.ts`

Alle Komponenten importieren die Konstanten nun aus `"./constants"`. Die String-Werte sind byte-genau identisch mit den ursprünglichen Inline-Deklarationen.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extract GOAL_PROMPTS to goals/constants.ts | be5c72c | goals/constants.ts, goals/GoalsModule.tsx |
| 2 | Extract DEFUSION_EXAMPLES and EXPLORATION_PROMPTS | 4744d05 | beliefs_act/constants.ts (new), obstacles/constants.ts (new), BeliefsActModule.tsx, ObstaclesModule.tsx |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `cd frontend && npx tsc --noEmit` passed with exit code 0 after each task
- All acceptance criteria verified via grep (imports present, inline declarations absent, exports correct)

## Self-Check: PASSED

- `/home/spro/development/MentalHealth/frontend/src/modules/beliefs_act/constants.ts` — exists
- `/home/spro/development/MentalHealth/frontend/src/modules/obstacles/constants.ts` — exists
- `/home/spro/development/MentalHealth/frontend/src/modules/goals/constants.ts` — modified with GOAL_PROMPTS
- Commits be5c72c and 4744d05 confirmed in git log
