---
phase: 1
slug: correctness-build
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (backend); no frontend test framework (Vitest is v2 scope) |
| **Config file** | none — Wave 0 creates test files |
| **Quick run command** | `cd backend && python -m pytest tests/ -x` |
| **Full suite command** | `cd backend && python -m pytest tests/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** `cd backend && ruff check app/` + `cd frontend && npm run typecheck`
- **After every plan wave:** `cd backend && python -m pytest tests/ -x`
- **Before `/gsd-verify-work`:** Full suite must be green + offline HTML build verified in Chrome
- **Max feedback latency:** ~30 seconds (lint + typecheck); ~5 seconds (pytest)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 1-QUAL01 | — | 1 | QUAL-01 | Migrated data written back to localStorage (no stale reads) | manual | N/A — no frontend test framework | ❌ no framework | ⬜ pending |
| 1-QUAL02 | — | 1 | QUAL-02 | Error boundary shows fallback; sidebar stays navigable | manual | N/A | ❌ no framework | ⬜ pending |
| 1-QUAL03 | — | 1 | QUAL-03 | uid() returns crypto.randomUUID() or Math.random fallback | manual | N/A | ❌ no framework | ⬜ pending |
| 1-QUAL04 | — | 1 | QUAL-04 | GET /api/modules/{id} returns original data when migration throws | integration | `pytest tests/test_modules.py::test_migration_error -x` | ❌ W0 | ⬜ pending |
| 1-QUAL05a | — | 1 | QUAL-05 | Empty KOMPASS_TOKEN raises ValueError at startup | unit | `pytest tests/test_config.py::test_empty_token_rejected -x` | ❌ W0 | ⬜ pending |
| 1-QUAL05b | — | 1 | QUAL-05 | Default token logs WARNING | unit | `pytest tests/test_config.py::test_default_token_warning -x` | ❌ W0 | ⬜ pending |
| 1-DEPS01 | — | 1 | DEPS-01 | SQLModel 0.0.32+ imports without error | smoke | `cd backend && python -c "import sqlmodel; print(sqlmodel.__version__)"` | ✅ inline | ⬜ pending |
| 1-DEPS02 | — | 1 | DEPS-02 | vite-plugin-singlefile 2.3.2 installed | smoke | `cd frontend && npm list vite-plugin-singlefile` | ✅ inline | ⬜ pending |
| 1-DEPS03 | — | 1 | DEPS-03 | Offline HTML build completes; loads in Chrome via file:// | manual | `cd frontend && npm run build:local` | manual verify | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/__init__.py` — package init
- [ ] `backend/tests/conftest.py` — shared FastAPI test client fixture (httpx.AsyncClient)
- [ ] `backend/tests/test_config.py` — QUAL-05: empty token rejected, default token warning logged
- [ ] `backend/tests/test_modules.py` — QUAL-04: migration error returns last-known-good data

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| localApi runs migrations + writes back to localStorage | QUAL-01 | No frontend test framework (Vitest is v2 scope) | Open browser DevTools → Application → localStorage → simulate schema version mismatch → reload module → verify data is migrated and version updated |
| Error boundary shows fallback text; sidebar navigable | QUAL-02 | No frontend test framework | Trigger a render error (add `throw new Error()` temporarily) → verify "Fehler in diesem Modul." appears → navigate to other module → verify it renders normally |
| uid() uses crypto.randomUUID() in secure context | QUAL-03 | No frontend test framework | Open app on localhost → DevTools Console → import `uid` → verify result is UUID format |
| Offline HTML build loads via file:// in Chrome | DEPS-03 | Requires manual browser verification per D-10 | `npm run build:local` → open `dist-local/index.html` via `file://` in Chrome → verify app loads and modules render |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
