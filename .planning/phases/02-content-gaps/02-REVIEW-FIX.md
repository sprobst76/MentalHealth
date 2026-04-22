---
phase: 02-content-gaps
fixed_at: 2026-04-22T08:25:09Z
review_path: .planning/phases/02-content-gaps/02-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-04-22T08:25:09Z
**Source review:** .planning/phases/02-content-gaps/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### WR-01: Non-null assertion on `data.answers` crashes overview when `answers` is null

**Files modified:** `frontend/src/modules/ysq/YsqModule.tsx`
**Commit:** e2821d0
**Applied fix:** Replaced the unconditional `schemaResults` computation (which used `data.answers!`) with an early-return guard block for `data.answers == null`. The null path now returns a self-contained "Noch keine Ergebnisse" card with a "Fragebogen neu ausfüllen" button. The non-null path falls through to the `schemaResults` computation where `data.answers!` is safe. The old ternary `{data.answers == null ? ... : ...}` in JSX was eliminated entirely.

---

### WR-02: Resume logic skips to last schema when draft is fully answered

**Files modified:** `frontend/src/modules/ysq/YsqModule.tsx`
**Commit:** e2821d0
**Applied fix:** Changed the fallthrough `return 17` to `return 0` in the `currentSchemaIdx` initialiser. When a draft has all 90 items answered (no fully-null page found), the user now starts review from schema 0 instead of landing on the last schema (Punitiveness).

---

### WR-03: Progress bar off-by-one — never reaches 100% on the final schema

**Files modified:** `frontend/src/modules/ysq/YsqModule.tsx`
**Commit:** e2821d0
**Applied fix:** Changed `(currentSchemaIdx / 18) * 100` to `((currentSchemaIdx + 1) / 18) * 100`. On schema 1 of 18 the bar shows ~5.6%; on schema 18 of 18 it shows 100%.

---

### WR-04: `beliefs_schema` SCHEMAS constant covers 13 schemas; YSQ has 18 — 4 cross-referenced schemas silently invisible in ObstaclesModule

**Files modified:** `frontend/src/modules/obstacles/ObstaclesModule.tsx`
**Commit:** c4cd5cc
**Applied fix:** Added a three-line comment above the `beliefOptions` useMemo documenting the known gap: the four YSQ schemas without a `beliefs_schema` counterpart (`dependence`, `enmeshment`, `entitlement`, `insufficient_self_control`) will not appear in the belief picker. The proper fix (extending `beliefs_schema/constants.ts` to cover all 18 schemas) is left for a future session per REVIEW.md guidance.

---

### WR-05: Missing `type="text"` on `<input>` elements in GoalsModule and ObstaclesModule

**Files modified:** `frontend/src/modules/goals/GoalsModule.tsx`, `frontend/src/modules/obstacles/ObstaclesModule.tsx`
**Commit:** a2079ab
**Applied fix:** Added `type="text"` to:
- `GoalsModule.tsx`: goal title input and `first_step` input
- `ObstaclesModule.tsx`: obstacle title input

`BeliefsActModule.tsx` line 173 (`first_action` input) already had `type="text"` — no change needed there.

---

_Fixed: 2026-04-22T08:25:09Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
