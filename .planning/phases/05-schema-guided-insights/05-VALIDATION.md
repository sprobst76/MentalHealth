---
phase: 5
slug: schema-guided-insights
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-23
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (not yet installed — Wave 0 installs) |
| **Config file** | `frontend/vitest.config.ts` — Wave 0 gap |
| **Quick run command** | `cd frontend && npx vitest run src/modules/ysq/hints.test.ts src/lib/insights.test.ts` |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | HINT-01 | unit | `cd frontend && npx vitest run src/modules/ysq/hints.test.ts` | Wave 0 gap | ⬜ pending |
| 5-01-02 | 01 | 1 | HINT-05 | unit | `cd frontend && npx vitest run src/modules/ysq/hints.test.ts` | Wave 0 gap | ⬜ pending |
| 5-02-01 | 02 | 2 | HINT-02 | unit | `cd frontend && npx vitest run src/lib/insights.test.ts` | Wave 0 gap | ⬜ pending |
| 5-02-02 | 02 | 2 | HINT-02 | unit | `cd frontend && npx vitest run src/lib/insights.test.ts` | Wave 0 gap | ⬜ pending |
| 5-02-03 | 02 | 2 | HINT-03 | unit | `cd frontend && npx vitest run src/lib/insights.test.ts` | Wave 0 gap | ⬜ pending |
| 5-03-01 | 03 | 3 | HINT-04 | manual | navigate+prefill flow in browser | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/modules/ysq/hints.test.ts` — tests for HINT-01 (all 18 schema IDs present in YSQ_HINTS_MAP)
- [ ] `frontend/src/lib/insights.test.ts` — tests for HINT-02 (getTop3Schemas), HINT-03 (getValueGaps)
- [ ] `frontend/package.json` — add `"vitest": "^2.0"` and `"test": "vitest run"` script
- [ ] `frontend/vitest.config.ts` — minimal config for jsdom environment

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Als Ziel erkunden" button navigates to goals and pre-fills title + description | HINT-04 | Navigation + DOM state across component boundaries; requires real browser | 1. Fill YSQ fully. 2. Go to Synthese. 3. Click "Als Ziel erkunden" in first InsightsBlock. 4. Verify Ziele module opens with pre-filled title and description. 5. Verify user can edit. 6. Save and confirm goal saved. |
| InsightsBlock shows no blocks when YSQ answers is null | HINT-02 | Visual verification needed | 1. Clear YSQ data (or use fresh account). 2. Go to Synthese. 3. Verify no InsightsBlock present. |
| No emojis / no inline string literals in InsightsBlock body | HINT-05 | Code review | Read `InsightsBlock.tsx` — all displayed text must come from `hints` prop or imported constants |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
