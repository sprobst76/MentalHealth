---
phase: 3
slug: data-portability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x (backend) |
| **Config file** | `backend/pyproject.toml` (`[tool.pytest.ini_options]`) |
| **Quick run command** | `cd backend && uv run pytest tests/test_portability.py -q` |
| **Full suite command** | `cd backend && uv run pytest -q` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && uv run pytest tests/test_portability.py -q`
- **After every plan wave:** Run `cd backend && uv run pytest -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | PORT-01 | — | Export only reads own user's records (user_id filter) | integration | `cd backend && uv run pytest tests/test_portability.py::test_export -q` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | PORT-02 | — | Import overwrites only own user's records | integration | `cd backend && uv run pytest tests/test_portability.py::test_import -q` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | PORT-03 | — | serverApi.exportAll() returns same shape as localApi | unit | `cd frontend && npm run type-check` | ✅ | ⬜ pending |
| 3-03-01 | 03 | 1 | PORT-03 | — | App.tsx uses api (not localApi) for export/import | unit | `grep -n "localApi\." frontend/src/App.tsx` (expect 0 matches) | ✅ | ⬜ pending |
| 3-03-02 | 03 | 1 | PORT-04 | — | Import button visible in both modes, disabled state correct | manual | Browser test: check Import button state in server mode | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_portability.py` — stubs for PORT-01, PORT-02 (export/import round-trip, HTML-v1 compatibility)

*Existing conftest.py and test infrastructure from Phase 1 covers fixtures.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Export-Datei im Browser herunterladen | PORT-01 | File-Download via Blob+URL ist nicht automatisierbar mit pytest | 1. App öffnen, 2. Export klicken, 3. JSON-Datei prüfen: enthält `_version`, `_exported`, Modulschlüssel |
| HTML-v1-Datei importieren | PORT-02 | Echte Datei aus `reference/` einlesen | 1. `reference/kompass-2026-04-20.json` als Import hochladen, 2. App neu laden, 3. Daten in allen Modulen prüfen |
| Import-Button-Zustand im Server-Modus | PORT-04 | UI-Kondition im Browser sichtbar | Import-Button soll im Server-Modus sichtbar und aktiv sein (nicht deaktiviert) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
