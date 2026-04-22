---
phase: 02-content-gaps
reviewed: 2026-04-22T10:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - backend/app/modules/checkin.py
  - backend/app/modules/registry.py
  - backend/app/modules/ysq.py
  - backend/tests/test_modules.py
  - frontend/src/modules/beliefs_act/BeliefsActModule.tsx
  - frontend/src/modules/beliefs_act/constants.ts
  - frontend/src/modules/goals/GoalsModule.tsx
  - frontend/src/modules/goals/constants.ts
  - frontend/src/modules/obstacles/ObstaclesModule.tsx
  - frontend/src/modules/obstacles/constants.ts
  - frontend/src/modules/registry.ts
  - frontend/src/modules/ysq/YsqModule.tsx
  - frontend/src/modules/ysq/YsqSummary.tsx
  - frontend/src/modules/ysq/constants.ts
  - frontend/src/modules/ysq/index.ts
  - frontend/src/modules/ysq/types.ts
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-22T10:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the YSQ module (backend + frontend), the checkin module backend, the goals/obstacles/beliefs_act frontend modules, and the shared frontend registry. The codebase is well-structured and follows the established Registry pattern consistently. No security vulnerabilities or critical logic errors were found.

Five warnings are flagged — all correctness risks: a dangerous non-null assertion in the overview render path, a silent resume-logic bug when a draft is fully answered, an off-by-one in the progress bar, a `beliefs_schema` schema set mismatch that silently hides 4 schemas from the Obstacles UI, and a missing `type="button"` that could trigger unintended form submission. Five info items cover dead code, naming inconsistency, and minor robustness gaps.

---

## Warnings

### WR-01: Non-null assertion on `data.answers` crashes overview when `answers` is null

**File:** `frontend/src/modules/ysq/YsqModule.tsx:180`
**Issue:** In the overview mode render path, `data.answers!` is used at line 180 to slice into the answers array. However, the component can reach overview mode with `data.answers === null`: the mode initialiser on line 20–24 sets `mode = "overview"` when `data.answers != null`, but nothing prevents the user from pressing the browser's back button or navigating away and returning with a stale `mode` state value — and more critically, the guard on line 198 (`data.answers == null`) renders a "no results" card but the `schemaResults` computation at line 179–184 runs *before* that conditional check and will throw a `TypeError` on `null.slice(…)`.

```tsx
// Line 179–184 — runs unconditionally in the overview branch:
const schemaResults = YSQ_SCHEMAS.map((schema, i) => {
  const items = data.answers!.slice(i * 5, i * 5 + 5);  // crashes when answers === null
  ...
});
```

**Fix:** Move `schemaResults` and `sorted` inside the conditional that checks `data.answers != null`, or add an early-return guard before line 179:

```tsx
if (mode !== "questionnaire") {
  if (data.answers == null) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* ... header ... */}
        <Card>
          <h2 className="display text-xl mb-2">Noch keine Ergebnisse</h2>
          <p className="text-sm text-ink-soft">...</p>
        </Card>
        {/* re-fill button */}
      </div>
    );
  }

  const schemaResults = YSQ_SCHEMAS.map((schema, i) => {
    const items = data.answers!.slice(i * 5, i * 5 + 5); // safe here
    ...
  });
  ...
}
```

---

### WR-02: Resume logic skips to last schema when draft is fully answered

**File:** `frontend/src/modules/ysq/YsqModule.tsx:26-34`
**Issue:** The `currentSchemaIdx` initialiser finds "the first schema page where all items are null" to resume. If the user answered all 90 items but did not click "Abschließen", the loop finds no fully-null page and falls through to `return 17` — resuming at schema 17 (Punitiveness), not at schema 0 where they should review from the start. The correct behaviour for a complete draft should be to land at schema 0 (or a review screen), not at the last schema.

```tsx
// Lines 28–33 — the fallthrough:
for (let i = 0; i < 18; i++) {
  const slice = data.draft.slice(i * 5, i * 5 + 5);
  if (slice.every((v) => v === null)) return i;
}
return 17;  // Bug: lands at last schema instead of 0 for a fully-answered draft
```

**Fix:** Return `0` for the fully-answered draft case (user can page through to review/edit), or detect this state explicitly and switch to overview mode:

```tsx
for (let i = 0; i < 18; i++) {
  const slice = data.draft.slice(i * 5, i * 5 + 5);
  if (slice.every((v) => v === null)) return i;
}
return 0; // fully-answered draft: start from beginning for review
```

---

### WR-03: Progress bar off-by-one — never reaches 100% on the final schema

**File:** `frontend/src/modules/ysq/YsqModule.tsx:95-98`
**Issue:** The progress bar width is calculated as `(currentSchemaIdx / 18) * 100%`. On the last schema (index 17), this renders `(17/18)*100% ≈ 94%`, never reaching full width. The bar should be full when the user is on the last page.

```tsx
style={{ width: `${(currentSchemaIdx / 18) * 100}%` }}
```

**Fix:** Use `(currentSchemaIdx + 1) / 18 * 100` to express "schemas completed or current":

```tsx
style={{ width: `${((currentSchemaIdx + 1) / 18) * 100}%` }}
```

---

### WR-04: `beliefs_schema` SCHEMAS constant covers 13 schemas; YSQ has 18 — 4 cross-referenced schemas are silently invisible in ObstaclesModule

**File:** `frontend/src/modules/obstacles/ObstaclesModule.tsx:21-24` and `frontend/src/modules/beliefs_schema/constants.ts`
**Issue:** `beliefOptions` is derived from `allData.beliefs_schema.entries`, which only contains entries for the 13 schemas present in `beliefs_schema/constants.ts` (the schema-therapy module). The YSQ has 18 schemas. Four YSQ schemas that have no counterpart in `beliefs_schema` — `dependence`, `enmeshment`, `entitlement`, and `insufficient_self_control` — can never appear in the Obstacles "Gespeist von Glaubenssätzen" picker, even if the user scored high on them in the YSQ. The mapping is silently incomplete; no warning is shown to the user.

**Fix (short-term):** Add a comment in `ObstaclesModule.tsx` documenting the known gap, so future developers do not assume the cross-reference is exhaustive:

```tsx
// Note: beliefOptions reflects beliefs_schema entries (13 schemas).
// 4 YSQ schemas (dependence, enmeshment, entitlement, insufficient_self_control)
// have no beliefs_schema counterpart and will not appear here.
const beliefOptions = useMemo(() => { ... }, [allData]);
```

**Fix (proper):** Either extend `beliefs_schema/constants.ts` to cover all 18 YSQ schemas or add a separate picker for YSQ-only schemas. The cross-module ref shape already supports multiple `moduleId` values.

---

### WR-05: Missing `type="button"` on `<input>` inside a potential form wrapper — ObstaclesModule accordion toggle

**File:** `frontend/src/modules/goals/GoalsModule.tsx:118`
**Issue:** The title `<input>` at line 118 does not specify `type="text"`. While browsers default to `type="text"` for inputs without a `type`, the project convention (`CLAUDE.md`) requires explicit `type` on interactive elements, and the absence mirrors a class of bugs where inputs inside a form without explicit types behave unexpectedly. This is a secondary concern compared to the primary missing `type="button"` risk elsewhere, but consistently flagged for the same reason the project explicitly calls out.

```tsx
<input
  value={g.title}
  onChange={(e) => update(g.id, { title: e.target.value })}
  placeholder="..."
  className="..."
/>
```

**Fix:** Add `type="text"`:

```tsx
<input
  type="text"
  value={g.title}
  ...
/>
```

The same pattern appears in `ObstaclesModule.tsx:100` (obstacle title input) and in `BeliefsActModule.tsx:172` (first_action input).

---

## Info

### IN-01: `YsqSummary` double-casts `reduce` accumulator unnecessarily

**File:** `frontend/src/modules/ysq/YsqSummary.tsx:19`
**Issue:** The reduce expression casts both the initial value and the accumulator: `(sum, v) => (sum as number) + (v ?? 0), 0 as number`. TypeScript can infer the accumulator type from the initial value `0`; the casts are noise and slightly obscure the intent.

**Fix:**
```tsx
const score = allNull ? null : items.reduce((sum, v) => sum + (v ?? 0), 0);
```

---

### IN-02: `YsqModule.tsx` uses HTML entity `&#252;` in JSX instead of the literal character

**File:** `frontend/src/modules/ysq/YsqModule.tsx:268`
**Issue:** The button label reads `Fragebogen neu ausf&#252;llen` (line 268). JSX supports Unicode directly in text children; the HTML entity is unnecessary and inconsistent with the rest of the codebase.

**Fix:**
```tsx
Fragebogen neu ausfüllen
```

---

### IN-03: `registry.ts` comment `// CONT-03` is stale and misleading

**File:** `frontend/src/modules/registry.ts:39`
**Issue:** The comment `// CONT-03: insert here — both are structured questionnaires` at line 39 references a task tracking label that has already been completed (ysqModule is registered). Stale task-tracking comments in source code cause confusion about whether the comment documents intent or residual work.

**Fix:** Remove the comment now that the module is registered, or replace it with a structural note if the grouping is intentional:

```typescript
// structured questionnaires — grouped before orientation modules
checkinModule,
ysqModule,
```

---

### IN-04: `checkin.py` `migrations` dict typed as `dict[int, Any]` instead of the precise `Callable` type

**File:** `backend/app/modules/checkin.py:35`
**Issue:** The `migrations` dict is typed as `dict[int, Any]`. The `ModuleSpec` dataclass expects `dict[int, Callable[[dict[str, Any]], dict[str, Any]]]`. While the empty dict passes validation at runtime, the looser type annotation means mypy/pyright will not catch a malformed migration function if one is added later. `ysq.py` has the same pattern at line 34.

**Fix:** Use the precise type from the registry (import is already available):

```python
from collections.abc import Callable
from typing import Any

migrations: dict[int, Callable[[dict[str, Any]], dict[str, Any]]] = {}
```

---

### IN-05: `test_migration_error_returns_last_known_good` sets `stale_version = spec.schema_version - 1` but `values` module is at `schema_version=1` — version becomes 0

**File:** `backend/tests/test_modules.py:29`
**Issue:** When `spec.schema_version == 1`, `stale_version` is `0`. The `ModuleSpec.migrate` method iterates `range(from_version + 1, schema_version + 1)` which is `range(1, 2)` — a single migration step. This is fine as long as there is no migration registered for version 1 (there isn't), but the test comment says "the router thinks migration is needed" yet `schema_version=0` is not a meaningful version in the system (versions start at 1 by convention). If the `values` module is later bumped to `schema_version=2`, the test will silently start testing a real migration path rather than the error-handling path it intends to cover. The test should document this dependency explicitly.

**Fix:** Add an assertion or comment:

```python
# values module is at schema_version=1 with no registered migrations,
# so stale_version=0 triggers the migration path but no migration function
# is found — the router returns the stored data as-is (last-known-good).
assert spec.schema_version == 1, "Update this test if values schema_version changes"
stale_version = spec.schema_version - 1
```

---

_Reviewed: 2026-04-22T10:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
