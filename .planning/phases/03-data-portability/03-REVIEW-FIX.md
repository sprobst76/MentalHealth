---
phase: 03-data-portability
fixed_at: 2026-04-22T10:30:00Z
review_path: .planning/phases/03-data-portability/03-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-04-22T10:30:00Z
**Source review:** .planning/phases/03-data-portability/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: `localApi.exportAll` gives synchronous return, caller expects `Promise`

**Files modified:** `frontend/src/api.local.ts`
**Commit:** 09b0fe7
**Applied fix:** Changed `exportAll()` return type from `Record<string, unknown>` to `Promise<Record<string, unknown>>` and wrapped the return value in `Promise.resolve(out)`. Changed `importAll()` return type from `void` to `Promise<void>` and added `return Promise.resolve()` at the end. Both adapters now match the `serverApi` async interface exactly. TypeScript type-check passed cleanly.

---

### WR-02: `JSON.parse` error in `importJSON` not handled

**Files modified:** `frontend/src/App.tsx`
**Commit:** 5053947
**Applied fix:** Replaced the bare `JSON.parse(e.target?.result as string)` call with a guarded sequence: (1) extract `raw = e.target?.result`, (2) check `typeof raw !== "string" || !raw.trim()` and alert if empty, (3) parse, then (4) check `!dump || typeof dump !== "object" || Array.isArray(dump)` and alert if not a plain object. The `catch` block for genuine `SyntaxError` exceptions remains in place. TypeScript type-check passed cleanly.

---

### WR-03: No guard against massively large import payload (DoS vector)

**Files modified:** `backend/app/routers/portability.py`
**Commit:** 1905139
**Applied fix:** Added module-level constants `MAX_IMPORT_ENTRIES = 100` and `MODULE_ID_MAX_LEN = 50`. Added `HTTPException` to the fastapi import. At the top of `import_all`, raises HTTP 422 when `len(payload) > MAX_IMPORT_ENTRIES`. Inside the loop, after the existing `_`-prefix and `isinstance` check, skips (appends truncated key to `skipped`) any key whose length exceeds `MODULE_ID_MAX_LEN`. Python syntax check passed cleanly.

---

_Fixed: 2026-04-22T10:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
