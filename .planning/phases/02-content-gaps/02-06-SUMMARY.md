---
phase: 02-content-gaps
plan: "06"
subsystem: frontend/ysq
tags: [ysq, questionnaire, bar-chart, state-machine, react]
dependency_graph:
  requires: [02-05]
  provides: [YsqModule component]
  affects: [frontend/src/modules/ysq/index.ts]
tech_stack:
  added: []
  patterns:
    - Two-mode state machine (questionnaire / overview) matching CheckinModule pattern
    - Draft persistence on every navigation step via onChange full-replacement spread
    - CSS/Flexbox bar chart with severity color mapping via CSS variables
key_files:
  created:
    - frontend/src/modules/ysq/YsqModule.tsx
  modified: []
decisions:
  - Used explicit type annotation `(sum: number, v)` in reduce to avoid TS18047 on YsqAnswer[] type
  - barColor() uses CSS variable strings (var(--sage) etc.) not hex values per CLAUDE.md conventions
  - "Fragebogen neu ausfüllen" button text uses HTML entity &#252; to avoid unicode in JSX attribute
metrics:
  duration_minutes: 1
  tasks_completed: 1
  files_created: 1
  files_modified: 0
  completed_date: "2026-04-21"
requirements: [CONT-03, CONT-04]
---

# Phase 2 Plan 06: YsqModule — Questionnaire and Results View Summary

YSQ questionnaire with 18-page pagination, draft persistence, and CSS bar chart results view with per-schema note fields.

---

## What Was Built

`frontend/src/modules/ysq/YsqModule.tsx` implements the complete interactive YSQ module:

**Questionnaire mode:**
- Paginated over 18 schema pages, 5 answer items per page (4-point Likert scale)
- Progress bar showing `(currentSchemaIdx / 18) * 100%` fill
- Resume logic: on mount, if `data.draft` is non-null, the component starts in questionnaire mode at the first schema where all 5 items are still null
- Zurück / Weiter / Uberspringen / Abschliessen navigation
- Uberspringen shown when all 5 items on current page are null (schemaIsSkipped)
- Draft persisted via `onChange({ ...data, draft: [...localDraft] })` on every forward and backward navigation step
- Abschliessen commits: `onChange({ ...data, answers: [...localDraft], draft: null })`

**Overview mode:**
- Sorted bar chart (descending by score; null/skipped schemas sorted to bottom)
- Each bar row: schema label, CSS flex bar track with fill colored by `barColor()`, score annotation
- Skipped schemas show dash and "nicht ausgefüllt" italic label
- Note `<input>` per row with `maxLength={200}`, persisted via onChange
- "Fragebogen neu ausfullen" button to restart questionnaire
- Disclaimer text as required by UI-SPEC

---

## Decisions Made

1. **TypeScript fix for reduce accumulator** — `items.reduce((sum: number, v) => ...)` with explicit type annotation needed because `items` is `(number | null)[]` and TypeScript inferred sum as `number | null`. Added `: number` type annotation to the accumulator parameter.

2. **barColor CSS variables** — Function returns `"var(--sage)"`, `"var(--ocean)"`, `"var(--accent)"` (string references to CSS custom properties), never raw hex values. This ensures theme consistency if CSS variables change.

3. **onChange always full spread** — All four onChange call sites use `{ ...data, field: newValue }` pattern; no partial patches.

---

## Deviations from Plan

None — plan executed exactly as written. The only TypeScript error remaining after task completion is `YsqSummary` not found in `ysq/index.ts`, which is expected until plan-07 creates that file (documented in plan acceptance criteria).

---

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build YsqModule.tsx | b075ea1 | frontend/src/modules/ysq/YsqModule.tsx (created) |

---

## Known Stubs

The YSQ schema item texts in `constants.ts` are placeholder empty strings (`""`). This was established in plan-05 and is intentional — plan-08 will populate the actual YSQ-S3 item texts from `reference/kompass.html`. The questionnaire mode renders correctly structurally; items will display as blank until plan-08 runs.

---

## Threat Flags

No new security-relevant surface introduced beyond what is declared in the plan's threat model. `maxLength={200}` on all note inputs is implemented as required by T-02-10 mitigation.

---

## Self-Check: PASSED

- `frontend/src/modules/ysq/YsqModule.tsx` — FOUND
- Commit b075ea1 — FOUND
