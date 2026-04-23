---
phase: 05-schema-guided-insights
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - frontend/vitest.config.ts
  - frontend/src/modules/ysq/hints.ts
  - frontend/src/modules/ysq/hints.test.ts
  - frontend/src/lib/insights.ts
  - frontend/src/lib/insights.test.ts
  - frontend/package.json
  - frontend/src/modules/synthese/constants.ts
  - frontend/src/modules/synthese/InsightsBlock.tsx
  - frontend/src/modules/synthese/SyntheseModule.tsx
  - frontend/src/modules/registry.ts
  - frontend/src/App.tsx
  - frontend/src/modules/goals/GoalsModule.tsx
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Phase 5 introduces schema-guided insights: `YSQ_HINTS` content data, an `InsightsBlock` component, extracted pure functions in `insights.ts`, a Vitest setup, and goal-prefill navigation via `GoalsModule`. The core logic is clean and well-structured. The new pure functions (`computeSchemaScore`, `getTop3Schemas`, `getValueGaps`) are correct and thoroughly tested.

Two warnings are present: a latent bug in crisis detection in `App.tsx` that predates this phase but is exposed by the new check-in integration, and a code duplication in `SyntheseModule.tsx` that duplicates logic now extracted into `insights.ts`. Three informational items cover the `execCommand` fallback, redundant vitest globals, and the test coverage gap for a score-tie case.

## Warnings

### WR-01: App.tsx crisis detection reads unsorted entries array

**File:** `frontend/src/App.tsx:125`
**Issue:** `checkinData?.entries?.[0]` assumes the first array element is the most recent entry. Entries are stored in insertion order and never sorted in this access path. If the user has multiple check-in entries, the crisis flag (`phq9[PHQ9_SUICIDE_ITEM_INDEX] > 0`) in the sidebar may reflect an old entry rather than the latest one. In contrast, `SyntheseModule.tsx` lines 246-248 correctly sorts descending by timestamp before reading `[0]`. The sidebar can silently show no crisis banner even when the latest entry contains a suicidal ideation item.

**Fix:**
```typescript
// frontend/src/App.tsx — replace lines 124-128
const checkinData = allData?.checkin as CheckinData | undefined;
const latestEntry = checkinData?.entries?.length
  ? [...checkinData.entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  : undefined;
const crisisDetected = Boolean(
  latestEntry && (latestEntry.phq9?.[PHQ9_SUICIDE_ITEM_INDEX] ?? 0) > 0,
);
```

---

### WR-02: computeYsqDelta in SyntheseModule.tsx duplicates logic now in insights.ts

**File:** `frontend/src/modules/synthese/SyntheseModule.tsx:183-196`
**Issue:** `computeYsqDelta` contains an inline schema scoring loop (lines 183-196) that is semantically identical to `computeSchemaScore` in `frontend/src/lib/insights.ts`. The extraction of `computeSchemaScore` in this phase created a canonical implementation, but the duplicate in `SyntheseModule.tsx` was not replaced. Any future bug fix or behaviour change to the scoring algorithm must now be applied in two places. The duplication also violates the explicit pattern of keeping scoring logic in `lib/insights.ts` (per the comment in `insights.ts` line 9: "Pattern copied from computeYsqDelta in SyntheseModule.tsx lines 180-198").

**Fix:** Import `computeSchemaScore` from `../../lib/insights` and use it inside `computeYsqDelta`:
```typescript
// Replace the two inline IIFE blocks in computeYsqDelta with:
import { computeSchemaScore } from "../../lib/insights";

function computeYsqDelta(snapA, snapB) {
  const getAnswers = (snap) =>
    (snap?.modules?.ysq?.data as YsqData | undefined)?.answers ?? null;
  const answersA = getAnswers(snapA);
  const answersB = getAnswers(snapB);

  return YSQ_SCHEMAS.map((schema, i) => ({
    label: schema.label,
    scoreA: answersA ? computeSchemaScore(answersA, i) : null,
    scoreB: answersB ? computeSchemaScore(answersB, i) : null,
  }));
}
```

---

## Info

### IN-01: execCommand("copy") fallback is deprecated

**File:** `frontend/src/modules/synthese/SyntheseModule.tsx:303`
**Issue:** `document.execCommand("copy")` is used as a clipboard fallback. This API is deprecated in all modern browsers. In practice the `navigator.clipboard.writeText` path covers all supported environments for this app. The fallback branch is dead code in any supported browser.

**Fix:** Remove the fallback branch, or if IE/old-browser support is a concern, document the intent with a comment. Simplest cleanup:
```typescript
async function copyReport() {
  const text = buildTextReport(allData as Record<string, any>);
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  } catch {
    // clipboard API unavailable — silently skip
  }
}
```

---

### IN-02: vitest globals: true is set but tests use explicit imports

**File:** `frontend/vitest.config.ts:6`
**Issue:** `globals: true` injects `describe`, `it`, `expect` etc. as globals, but every test file imports them explicitly from `vitest` (e.g. `hints.test.ts:1`, `insights.test.ts:1`). The `globals` option is unused. This is harmless but misleading — a future contributor may remove the imports and rely on globals, changing the style of the file inconsistently.

**Fix:** Either remove `globals: true` from the config (keeping explicit imports, which is the better TypeScript practice), or keep it and document the intent. Prefer removing it to keep the config minimal and imports self-documenting.

---

### IN-03: getTop3Schemas test does not cover score-tie ordering

**File:** `frontend/src/lib/insights.test.ts:64-76`
**Issue:** The "results are sorted descending by score" test verifies `result[0].score >= result[1].score >= result[2].score` but only sets up three schemas with distinct scores (5, 10, 3). It does not test the tie-breaking case (equal scores). The `insights.ts` sort is not stable in a tie because the comparator returns `0`, leaving tie order implementation-defined. If schema ordering matters when scores are equal (e.g. for consistent display), a tie-breaking rule and a corresponding test should be added.

**Fix:** Add a tie-breaking comparator in `getTop3Schemas` and a corresponding test:
```typescript
// insights.ts — sort with stable tie-breaker by schema array index (implicit via .map order)
.sort((a, b) => b.score - a.score)
// Array.prototype.sort is stable in V8/Node 11+ — insertion order is preserved for ties.
// Document this assumption explicitly if relied upon.
```
And add to the test suite:
```typescript
it("tie scores preserve schema array order", () => {
  const answers = Array(90).fill(null) as (number | null)[];
  answers[0] = 3; // schema 0: score 3
  answers[5] = 3; // schema 1: score 3
  const result = getTop3Schemas(answers);
  expect(result[0].schema.id).toBe("abandonment"); // lower index first
  expect(result[1].schema.id).toBe("mistrust");
});
```

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
