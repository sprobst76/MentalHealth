---
phase: 03-data-portability
plan: "02"
subsystem: api
tags: [typescript, fetch, api-client, export, import]

# Dependency graph
requires:
  - phase: 03-data-portability/03-01
    provides: Backend-Endpoints GET /api/export und POST /api/import
provides:
  - serverApi.exportAll() — Promise<Record<string, unknown>> via GET /api/export
  - serverApi.importAll(dump) — Promise<void> via POST /api/import
  - Paritat zwischen serverApi und localApi fuer Export/Import-Signaturen
affects:
  - 03-data-portability/03-03  # App.tsx nutzt api.exportAll() und api.importAll()

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "serverApi-Methoden nutzen ausschliesslich den request<T>-Helper — kein eigenes fetch"
    - "exportAll/importAll-Signaturen sind await-kompatibel zwischen server- und lokalem Modus"

key-files:
  created: []
  modified:
    - frontend/src/api.ts

key-decisions:
  - "importAll sendet rohen JSON-Blob an das Backend — Validierung liegt ausschliesslich im Backend (kein Pydantic-Check im Frontend)"
  - "exportAll gibt Promise<Record<string, unknown>> zurueck, damit App.tsx beide API-Modi (server/lokal) identisch behandeln kann"

patterns-established:
  - "Neue API-Methoden immer ueber request<T>() — nie eigenes fetch in serverApi"
  - "Methoden-Signaturen muessen zwischen serverApi und localApi paritaetisch sein"

requirements-completed:
  - PORT-03

# Metrics
duration: 2min
completed: "2026-04-22"
---

# Phase 3 Plan 02: serverApi Export/Import Summary

**serverApi um exportAll() und importAll() erweitert — GET /api/export und POST /api/import ueber request<T>-Helper, await-kompatibel mit localApi-Signaturen**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-22T14:06:00Z
- **Completed:** 2026-04-22T14:08:39Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `serverApi.exportAll()` ergaenzt: gibt `Promise<Record<string, unknown>>` zurueck via GET /api/export
- `serverApi.importAll(dump)` ergaenzt: gibt `Promise<void>` zurueck via POST /api/import
- Beide Methoden nutzen ausschliesslich den bestehenden `request<T>`-Helper
- TypeScript-Compiler (tsc --noEmit) akzeptiert die Aenderung fehlerfrei
- Signatur-Paritaet mit `localApi.exportAll()` und `localApi.importAll()` sichergestellt

## Task Commits

Jeder Task wurde atomar committet:

1. **Task 1: serverApi um exportAll und importAll erweitern** - `ec23cf9` (feat)

**Plan-Metadaten:** wird mit SUMMARY-Commit hinzugefuegt

## Files Created/Modified
- `frontend/src/api.ts` — serverApi um exportAll und importAll erweitert (7 Zeilen hinzugefuegt)

## Decisions Made
- Reihenfolge der Methoden: exportAll/importAll nach health, vor der schliessenden `}` — entspricht dem Kommentar-Platzhalter aus dem urspruenglichen Code
- Keine Typenimporte noetig: `Record<string, unknown>` und `void` sind built-in TypeScript-Typen

## Deviations from Plan

Keine — Plan exakt wie geschrieben ausgefuehrt.

Das Script `npm run type-check` existiert nicht; der korrekte Name ist `npm run typecheck` (ohne Bindestrich). Dies war eine Dokumentationsabweichung im Plan, kein Fehler in der Implementierung. Abweichungsregel nicht benoetigt, da `typecheck` erfolgreich mit Exit-Code 0 lief.

## Issues Encountered
- `npm run type-check` schlug fehl (falsch geschriebener Script-Name im Plan — lautet tatsaechlich `npm run typecheck`)
- `node_modules/` waren im Worktree nicht installiert — `npm install` ausgefuehrt, danach lief `tsc --noEmit` fehlerfrei

## User Setup Required
Keine — keine externen Dienste benoetigt.

## Next Phase Readiness
- `api.exportAll()` und `api.importAll()` sind im server-Modus jetzt verfuegbar
- Plan 03-03 (App.tsx-Integration) kann Export/Import-UI direkt ueber `await api.exportAll()` und `await api.importAll(dump)` implementieren
- Keine Blocker

---
*Phase: 03-data-portability*
*Completed: 2026-04-22*
