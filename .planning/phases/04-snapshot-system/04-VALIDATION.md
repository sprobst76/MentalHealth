---
phase: 4
slug: snapshot-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8 + pytest-asyncio |
| **Config file** | `backend/pyproject.toml` `[tool.pytest.ini_options]` |
| **Quick run command** | `cd backend && python -m pytest tests/test_snapshots.py -x -q` |
| **Full suite command** | `cd backend && python -m pytest tests/ -q` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/test_snapshots.py -x -q`
- **After every plan wave:** Run `cd backend && python -m pytest tests/ -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | SNAP-01,02,03 | T-4-01 | test stubs force RED before implementation | integration | `pytest tests/test_snapshots.py -x -q` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | SNAP-01 | T-4-02 | user_id from Depends never from payload | integration | `pytest tests/test_snapshots.py::test_create_snapshot -x` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | SNAP-01 | T-4-02 | label stored as raw string, no injection | integration | `pytest tests/test_snapshots.py::test_create_snapshot_label -x` | ❌ W0 | ⬜ pending |
| 4-02-03 | 02 | 1 | SNAP-02 | — | metadata only, no blob in list | integration | `pytest tests/test_snapshots.py::test_list_snapshots -x` | ❌ W0 | ⬜ pending |
| 4-02-04 | 02 | 1 | SNAP-03 | — | forward migration applied on GET /{id} | integration | `pytest tests/test_snapshots.py::test_get_snapshot_migrated -x` | ❌ W0 | ⬜ pending |
| 4-02-05 | 02 | 1 | SNAP-03 | — | QUAL-04 guard: bad migration → raw data returned, no 500 | integration | `pytest tests/test_snapshots.py::test_get_snapshot_migration_error -x` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | — | — | serverApi types compile cleanly | type-check | `cd frontend && npm run typecheck` | ✅ | ⬜ pending |
| 4-04-01 | 04 | 3 | SNAP-04,05,06 | — | full backend suite green after UI changes | integration | `cd backend && python -m pytest tests/ -q` | ✅ | ⬜ pending |
| 4-05-01 | 05 | 1 | — | — | values v2 migration: living field preserved on PUT | integration | `pytest tests/test_modules.py -x -q` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_snapshots.py` — RED stubs for SNAP-01, SNAP-02, SNAP-03 (follows `test_portability.py` pattern)

*Existing conftest.py and test infrastructure covers all other needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Snapshot creation button visible on Synthese page | SNAP-04 | No Vitest/e2e in project | Open app → navigate to Synthese → confirm "Snapshot erstellen" form visible |
| Snapshot list shows after creation | SNAP-05 | No e2e | Create snapshot → confirm list updates with date/label |
| Delta comparison panel renders | SNAP-06 | No e2e | Select two snapshots → confirm Values/YSQ/Checkin delta table shows correct values |
| localApi snapshot round-trip | SNAP-04,05,06 | localStorage requires browser | In local build: create snapshot, reload, confirm snapshot persists in list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
