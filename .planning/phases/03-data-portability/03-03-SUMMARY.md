---
phase: 03-data-portability
plan: "03"
subsystem: frontend
tags: [export, import, api, portability, mode-aware]
dependency_graph:
  requires:
    - "03-02"  # serverApi.exportAll / serverApi.importAll implementiert
  provides:
    - "frontend/src/App.tsx (mode-aware Export/Import)"
  affects:
    - "frontend/src/App.tsx"
tech_stack:
  added: []
  patterns:
    - "async/await für api.exportAll() und api.importAll()"
    - "void-cast für fire-and-forget async onClick-Handler"
    - "title-Attribut als erklärender Hinweis (PORT-04 Designentscheidung)"
key_files:
  created: []
  modified:
    - frontend/src/App.tsx
decisions:
  - "PORT-04: Import-Button nie disabled — POST /api/import existiert nach Phase 3 immer; erklärender Hinweis als title-Tooltip umgesetzt"
  - "isLocal-Variable bleibt erhalten (genutzt im title-Attribut des Import-Buttons)"
  - "void exportJSON() als onClick-Pattern — Promise-Rejection wird nach Plan bewusst ignoriert (T-03-08 accept)"
metrics:
  duration: "15 min"
  completed: "2026-04-22T14:17:32Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 03 Plan 03: Mode-Aware Export/Import Summary

**One-liner:** `App.tsx` nutzt nun den universellen `api`-Adapter für Export und Import — `localApi`-Import entfernt, Buttons in beiden Modi sichtbar, PORT-04 als `title`-Tooltip umgesetzt.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | App.tsx — exportJSON/importJSON mode-aware + Buttons in beiden Modi | 2f2ed78 | frontend/src/App.tsx |
| 2 | Checkpoint human-verify (auto-approved) | — | — |

---

## What Was Built

`frontend/src/App.tsx` wurde in vier präzisen Schritten umgebaut:

1. **`localApi`-Import entfernt** — `import { localApi } from "./api.local"` gelöscht
2. **`exportJSON()` async** — ruft `await api.exportAll()` auf statt `localApi.exportAll()`
3. **`importJSON()` async reader** — `reader.onload` ist `async`, ruft `await api.importAll(dump)` auf
4. **UI-Block entkoppelt** — `{isLocal && (<>...</>)}` Guard entfernt; Export- und Import-Buttons direkt gerendert (immer sichtbar in beiden Modi)

PORT-04-Anforderung: Import-Button ist nie `disabled` (POST /api/import existiert nach Phase 3 immer). Erklärender Hinweis als `title`-Attribut: im Server-Modus zeigt Hover den Text "Import via Backend-Endpoint (POST /api/import)".

---

## Acceptance Criteria Verified

```
grep "localApi" frontend/src/App.tsx       → 0 Treffer  [OK]
grep "await api.exportAll" App.tsx         → 1 Treffer  [OK]
grep "await api.importAll" App.tsx         → 1 Treffer  [OK]
grep "isLocal &&" App.tsx                  → 0 Treffer  [OK]
grep "POST /api/import" App.tsx            → 1 Treffer  [OK]
npm run typecheck (tsc --noEmit)           → 0 Fehler   [OK]
```

---

## Deviations from Plan

Keine — Plan exakt wie beschrieben ausgeführt.

---

## Known Stubs

Keine. Die Verdrahtung ist vollständig: `api` routet im lokalen Modus zu `localApi` (localStorage) und im Server-Modus zu `serverApi` (FastAPI-Backend).

---

## Threat Flags

Keine neuen Threat-relevanten Surfaces. Die im Plan dokumentierten Bedrohungen T-03-07 und T-03-08 sind korrekt adressiert:
- T-03-07: `JSON.parse` im try/catch in `importJSON()` — korrupte Dateien zeigen Alert
- T-03-08: `void exportJSON()` im onClick — Promise-Rejection bewusst ignoriert (accept)

---

## Self-Check: PASSED

- `frontend/src/App.tsx` existiert und ist korrekt modifiziert
- Commit `2f2ed78` existiert in git log
- TypeScript-Compiler meldet 0 Fehler nach den Änderungen
