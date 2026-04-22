---
phase: 03-data-portability
plan: "01"
subsystem: backend
tags: [portability, export, import, html-v1-compat, tdd]
dependency_graph:
  requires: []
  provides:
    - GET /api/export — HTML-v1 flat format export of all module records
    - POST /api/import — raw blob import with HTML-v1 compatibility
  affects:
    - backend/app/main.py
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle for portability endpoints
    - user_id exclusively from Depends(current_user_id) — never from payload
    - No Pydantic validation on import — raw blob, lazy migration on next GET
key_files:
  created:
    - backend/app/routers/portability.py
    - backend/tests/test_portability.py
  modified:
    - backend/app/main.py
    - .gitignore
decisions:
  - "portability.py accepts any module_id without Registry check (PORT-02 HTML-v1 compat)"
  - "Import skips '_'-prefixed metadata keys silently (no error for _version, _exported)"
  - "uv.lock excluded from git per CLAUDE.md 'lockfile not present' specification"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-22T14:12:15Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 3 Plan 01: Backend Portability Endpoints Summary

**One-liner:** GET /api/export und POST /api/import mit HTML-v1-Kompatibilität, Bearer-Auth-Scoping und TDD RED/GREEN-Zyklus.

---

## What Was Built

Zwei neue Backend-Endpoints im neuen Router `backend/app/routers/portability.py`:

- **GET /api/export** — Gibt alle `ModuleRecord`-Zeilen des authentifizierten Users als HTML-v1-kompatibles JSON zurück: `{"_version": 1, "_exported": "...", "values": {"schema_version": 1, "data": {...}, "updated_at": "..."}, ...}`

- **POST /api/import** — Nimmt HTML-v1-kompatible Payloads entgegen, schreibt rohe Blobs per UPSERT in `module_records`. Kein Pydantic-Validate, kein Registry-Check — unbekannte Modul-IDs (z. B. `"orientation"` aus HTML-v1) werden akzeptiert und persistent gespeichert.

Beide Endpoints filtern via `WHERE ModuleRecord.user_id == user_id` (user_id ausschließlich aus `Depends(current_user_id)`).

---

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TDD RED — test_portability.py | ea887d3 | backend/tests/test_portability.py |
| 2 | portability.py + main.py registrieren | 61d6b81 | backend/app/routers/portability.py, backend/app/main.py |
| — | Deviation: .gitignore uv.lock | 877489a | .gitignore |

---

## TDD Gate Compliance

- RED gate commit: `ea887d3` — `test(03-01): add failing RED tests for PORT-01 and PORT-02`
- GREEN gate commit: `61d6b81` — `feat(03-01): implement GET /api/export and POST /api/import`
- REFACTOR: kein separater Refactor-Commit nötig — Implementierung war sauber

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] uv.lock in .gitignore aufgenommen**
- **Found during:** Task 2 (nach `uv sync --extra dev`)
- **Issue:** `uv sync` erzeugte eine `uv.lock`-Datei, die nicht committet werden sollte (CLAUDE.md: "lockfile not present")
- **Fix:** `uv.lock` zu `.gitignore` hinzugefügt
- **Files modified:** `.gitignore`
- **Commit:** 877489a

Sonst — Plan exakt wie geschrieben ausgeführt.

---

## Verification Results

```
tests/test_portability.py::test_export_format         PASSED
tests/test_portability.py::test_export_all_modules    PASSED
tests/test_portability.py::test_import_stores_blob    PASSED
tests/test_portability.py::test_import_html_v1_compat PASSED
tests/test_portability.py::test_import_roundtrip      PASSED

12 passed in 0.12s  (volle Suite — keine Regressions)
```

Acceptance criteria:
- `backend/app/routers/portability.py` existiert — ja
- `grep -n "portability" backend/app/main.py` → 2 Treffer — ja (Zeile 10, 38)
- `pytest tests/test_portability.py` → 5 Tests grün — ja
- `pytest tests/` → volle Suite grün — ja (12/12)
- `grep "get_module" backend/app/routers/portability.py` → 0 Code-Treffer — ja

---

## Known Stubs

Keine. Beide Endpoints sind vollständig implementiert und verdrahtet.

---

## Threat Flags

Keine neuen Threat-Flags — alle Threats aus dem Plan-Threat-Model sind durch die Implementierung adressiert (T-03-01: user_id aus Depends, T-03-02: SELECT mit user_id-Filter, T-03-03/T-03-04: accept).

---

## Self-Check: PASSED

- `backend/app/routers/portability.py` — FOUND
- `backend/tests/test_portability.py` — FOUND
- Commit ea887d3 — FOUND
- Commit 61d6b81 — FOUND
- Commit 877489a — FOUND
