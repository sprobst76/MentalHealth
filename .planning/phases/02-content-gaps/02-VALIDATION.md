---
phase: 2
slug: content-gaps
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x (backend), no frontend test framework yet |
| **Config file** | `backend/pyproject.toml` (`[tool.pytest.ini_options]`) |
| **Quick run command** | `cd backend && python -m pytest tests/ -x -q` |
| **Full suite command** | `cd backend && python -m pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/ -x -q`
- **After every plan wave:** Run `cd backend && python -m pytest tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-checkin-backend | TBD | 1 | CONT-01 | — | N/A | pytest | `cd backend && python -m pytest tests/test_modules.py::test_checkin -v` | ❌ W0 | ⬜ pending |
| 2-ysq-backend | TBD | 1 | CONT-02 | — | N/A | pytest | `cd backend && python -m pytest tests/test_modules.py::test_ysq -v` | ❌ W0 | ⬜ pending |
| 2-constants-extraction | TBD | 1 | CONT-06 | — | N/A | manual | Verify imports resolve: `cd frontend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 2-ysq-constants | TBD | 2 | CONT-02,03 | — | N/A | manual | YSQ_SCHEMAS array length === 18, each schema has 5 items | ❌ (needs reference/kompass.html) | ⬜ pending |
| 2-ysq-frontend | TBD | 2 | CONT-03 | — | N/A | manual | Questionnaire renders, nav works, answers persist | ✅ | ⬜ pending |
| 2-ysq-results | TBD | 2 | CONT-04 | — | N/A | manual | Bar chart shows sorted schemas; skip shown distinctly | ✅ | ⬜ pending |
| 2-ysq-summary | TBD | 3 | CONT-05 | — | N/A | manual | Synthese page shows YSQ top-3 block | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_modules.py` — extend with checkin + ysq test stubs (existing file from Phase 1)
- [ ] Ensure `backend/tests/conftest.py` covers new module IDs

*Note: Existing Phase 1 infrastructure (conftest.py, test_modules.py) is extensible — Wave 0 adds test stubs only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| YSQ questionnaire navigation (prev/next, skip) | CONT-03 | No frontend test framework | Open localhost:5173, navigate through YSQ schemas with prev/next/skip buttons |
| In-progress state persists on page reload | CONT-03 | Browser state | Partially fill YSQ, reload page, verify draft answers survive |
| Bar chart renders correctly for skipped schemas | CONT-04 | Visual rendering | Skip a schema, view results, verify skipped shows distinctly from scored |
| YSQ summary block on Synthese page | CONT-05 | Cross-module rendering | Complete YSQ, navigate to Synthese, verify top-3 block appears |
| Checkin saves in server mode (no 404) | CONT-01 | Requires running backend | Start docker compose, add a check-in entry, verify it persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
