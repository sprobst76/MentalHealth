---
phase: 02-content-gaps
plan: "05"
subsystem: frontend/modules/ysq
tags: [typescript, ysq, types, constants, module-def]
dependency_graph:
  requires: [02-04]
  provides: [ysq/types.ts, ysq/constants.ts, ysq/index.ts]
  affects: [02-06, 02-07, 02-08]
tech_stack:
  added: []
  patterns: [ModuleDef pattern, YsqSchema interface, Likert answer scale]
key_files:
  created:
    - frontend/src/modules/ysq/types.ts
    - frontend/src/modules/ysq/constants.ts
    - frontend/src/modules/ysq/index.ts
  modified: []
decisions:
  - "YSQ_SCHEMA_MAP keys are string indices '0'–'17' to match notes dict keys"
  - "YSQ_MAX_ITEM_SCORE=4 assumed from UI-SPEC; plan-08 verifies against reference/kompass.html"
  - "index.ts references YsqModule/YsqSummary (not yet created); acceptable since index.ts not yet imported by registry.ts"
metrics:
  duration: "3 minutes"
  completed: "2026-04-21T16:06:36Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
---

# Phase 2 Plan 05: YSQ Type Contracts and Module Definition Summary

**One-liner:** YSQ TypeScript type contracts (YsqData, YsqAnswer), 18-schema YSQ-S3 constants skeleton, and ysqModule ModuleDef wiring for plans 06-07 to build against.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ysq/types.ts and ysq/constants.ts | 9adf76c | frontend/src/modules/ysq/types.ts, frontend/src/modules/ysq/constants.ts |
| 2 | Create ysq/index.ts | 0e5fa88 | frontend/src/modules/ysq/index.ts |

---

## What Was Built

Three interface-first files that define the YSQ module's data shape and identity:

**types.ts** — `YsqAnswer` type alias (`number | null`) and `YsqData` interface with:
- `answers: YsqAnswer[] | null` — committed questionnaire result (length 90, null before first completion)
- `draft: YsqAnswer[] | null` — in-progress session draft
- `notes: Record<string, string>` — free-text note per schema (key = schema index string)

**constants.ts** — YSQ-S3 structure constants:
- `YSQ_SCHEMAS` — 18 schemas in standard YSQ-S3 order with placeholder items (populated in plan-08)
- `YSQ_MAX_ITEM_SCORE = 4`, `YSQ_MAX_SCHEMA_SCORE = 20`
- `YSQ_SCHEMA_MAP` — lookup by string index "0"–"17"
- `YSQ_ANSWER_SCALE` — 4-point German Likert labels from UI-SPEC

**index.ts** — `ysqModule: ModuleDef<YsqData>` with id="ysq", phaseNum="02", schemaVersion=1, defaultData returning `{answers: null, draft: null, notes: {}}`.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

| File | Content | Reason |
|------|---------|--------|
| frontend/src/modules/ysq/constants.ts | `items: ["", "", "", "", ""]` for all 18 schemas | Plan-08 populates from reference/kompass.html (D-01) |
| frontend/src/modules/ysq/index.ts | Imports YsqModule and YsqSummary (not yet created) | Components created in plans 06-07; index.ts not yet imported by registry.ts |

These stubs are intentional and tracked. The module cannot be rendered until plans 06-07 create the components and plan-08 populates item texts.

---

## Threat Flags

None — type definition files only, no runtime data flow or API calls.

---

## Self-Check: PASSED

- frontend/src/modules/ysq/types.ts — FOUND
- frontend/src/modules/ysq/constants.ts — FOUND
- frontend/src/modules/ysq/index.ts — FOUND
- Commit 9adf76c — FOUND
- Commit 0e5fa88 — FOUND
