---
phase: 02-content-gaps
plan: "04"
subsystem: backend
tags: [ysq, backend, pydantic, registry, tdd]
dependency_graph:
  requires: [02-02]
  provides: [backend-ysq-module]
  affects: [backend/app/modules/registry.py, backend/app/modules/ysq.py]
tech_stack:
  added: []
  patterns: [module-spec-pattern, nullable-list-fields, pydantic-v2]
key_files:
  created:
    - backend/app/modules/ysq.py
  modified:
    - backend/app/modules/registry.py
decisions:
  - "answers and draft fields use list[int | None] | None — outer None means no run yet, inner None means skipped item; this mirrors the TypeScript YsqAnswer[] | null shape exactly"
  - "notes field uses Field(default_factory=dict) not {} to avoid mutable default"
  - "SPEC.order = 60 — places ysq after obstacles (50) in module navigation order"
metrics:
  duration: "80s"
  completed: "2026-04-21T16:02:49Z"
  tasks_completed: 2
  files_changed: 2
---

# Phase 02 Plan 04: YSQ Backend Module Summary

YsqData Pydantic model with nullable 90-element arrays (answers/draft) and notes dict; ysq.SPEC registered in backend registry at order=60.

## What Was Built

`backend/app/modules/ysq.py` implements the Young Schema Questionnaire backend module following the established values.py reference pattern. The `YsqData` model uses `list[int | None] | None` for both `answers` and `draft` fields — the outer `None` represents "no questionnaire run yet" / "no active session", while inner `None` slots represent skipped items. The `notes` field stores free-text annotations keyed by schema index strings "0"–"17".

`backend/app/modules/registry.py` was updated to import `ysq` and include `ysq.SPEC` in `_build_modules()`. The sort-by-order logic places ysq last (order=60) in the module list.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create backend/app/modules/ysq.py | 4d603d8 | backend/app/modules/ysq.py (created) |
| 2 | Register ysq.SPEC in backend registry | 601d91c | backend/app/modules/registry.py (modified) |

## TDD Gate Compliance

This task used the pre-existing failing tests from plan-02 as the RED gate:
- `test_ysq_roundtrip` — was failing with 404 before Task 1
- `test_ysq_null_slots_preserved` — was failing with 404 before Task 1

GREEN gate: both tests pass after Task 1 (ysq.py) + Task 2 (registry).

## Verification Results

```
4 passed in 0.06s
tests/test_modules.py::test_migration_error_returns_last_known_good PASSED
tests/test_modules.py::test_checkin_roundtrip PASSED
tests/test_modules.py::test_ysq_roundtrip PASSED
tests/test_modules.py::test_ysq_null_slots_preserved PASSED
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The backend module is fully functional; the frontend YSQ component will be built in plans 05-07.

## Threat Flags

No new security surface introduced beyond what the threat model documents. The generic modules router already validates all PUT payloads via `SPEC.validate()`, which runs full Pydantic validation on `YsqData`. Non-integer array elements return 422 as expected (T-02-05 mitigated).

## Self-Check: PASSED

- backend/app/modules/ysq.py — FOUND
- backend/app/modules/registry.py — FOUND (contains `ysq` import and `ysq.SPEC`)
- Commit 4d603d8 — FOUND
- Commit 601d91c — FOUND
- All 4 pytest tests pass
