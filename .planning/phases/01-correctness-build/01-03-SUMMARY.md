---
phase: 01-correctness-build
plan: "03"
subsystem: frontend
tags: [correctness, error-boundary, uid, local-storage, migration]
dependency_graph:
  requires: []
  provides:
    - uid utility (crypto.randomUUID with fallback)
    - ErrorBoundary component
    - localApi migration write-back
  affects:
    - frontend/src/api.local.ts
    - frontend/src/App.tsx
    - frontend/src/modules/beliefs_act/BeliefsActModule.tsx
    - frontend/src/modules/goals/GoalsModule.tsx
    - frontend/src/modules/obstacles/ObstaclesModule.tsx
    - frontend/src/modules/checkin/CheckinModule.tsx
tech_stack:
  added: []
  patterns:
    - React class component error boundary with getDerivedStateFromError
    - crypto.randomUUID with Math.random fallback for file:// contexts
    - localStorage migration write-back on schema_version mismatch
key_files:
  created:
    - frontend/src/lib/uid.ts
    - frontend/src/components/ErrorBoundary.tsx
  modified:
    - frontend/src/api.local.ts
    - frontend/src/App.tsx
    - frontend/src/modules/beliefs_act/BeliefsActModule.tsx
    - frontend/src/modules/goals/GoalsModule.tsx
    - frontend/src/modules/obstacles/ObstaclesModule.tsx
    - frontend/src/modules/checkin/CheckinModule.tsx
decisions:
  - ErrorBoundary uses key={activeId} in App.tsx so navigating away resets the boundary — one broken module cannot block the sidebar
  - uid fallback produces two concatenated Math.random segments (16 chars) to reduce collision probability when UUID unavailable
  - runMigrations errors propagate as rejected Promise; App.tsx catch block surfaces them as store[id].error (no try/catch in getModule)
metrics:
  duration: "~15 minutes"
  completed: "2026-04-21T09:11:42Z"
  tasks_completed: 2
  files_changed: 8
---

# Phase 1 Plan 03: Frontend Correctness Fixes Summary

One-liner: Shared `uid()` with `crypto.randomUUID`, class-based `ErrorBoundary` with navigation reset, and `localApi.getModule` migration write-back fix.

## What Was Built

**Task 1 — uid.ts + localApi migration fix (commit 1624a6d)**

Created `frontend/src/lib/uid.ts` as a single shared utility exporting `uid()`. Uses `crypto.randomUUID()` in secure contexts (HTTPS/localhost) and falls back to a double `Math.random().toString(36)` segment for `file://` contexts where Secure Context may be absent (Firefox/Safari behavior).

Fixed `frontend/src/api.local.ts` `getModule`: added `import { runMigrations }` and a migration branch that detects `stored.schema_version < mod.schemaVersion`, calls `runMigrations`, writes the result back to `localStorage` using the target `schema_version` (not the stored version — avoids re-migrating on every load), and returns the migrated record.

**Task 2 — ErrorBoundary + uid replacement (commit 98c5b42)**

Created `frontend/src/components/ErrorBoundary.tsx` as a React class component. Shows `Fehler in diesem Modul. / Seite neu laden um fortzufahren.` in `text-ink-soft` on error. Logs via `console.error` only — no `error.message` in the DOM (STRIDE T-01-07). Wired in `App.tsx` with `<ErrorBoundary key={activeId}>` so navigating away unmounts and remounts the boundary, clearing the error state.

Removed the inline `function uid() { return Math.random()... }` from all four module files (`BeliefsActModule.tsx`, `GoalsModule.tsx`, `ObstaclesModule.tsx`, `CheckinModule.tsx`) and replaced with `import { uid } from "../../lib/uid"`.

## Verification Results

- `tsc --noEmit` exits 0
- `grep -r "from.*lib/uid" frontend/src/modules/` — 4 matches (all four modules)
- No `Math.random` remaining in the four module files
- `grep "ErrorBoundary key=" frontend/src/App.tsx` — matches
- `grep "runMigrations" frontend/src/api.local.ts` — matches (import + call site)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

No new security-relevant surface introduced. Threat mitigations T-01-05, T-01-06, T-01-07 from the plan's threat register are all implemented:
- T-01-05: `runMigrations` errors propagate as Promise rejection → `store[id].error` (no silent corruption)
- T-01-06: `ErrorBoundary` isolates crash to active module slot; sidebar continues
- T-01-07: `ErrorBoundary` shows only static text, no `error.message` in rendered output

## Self-Check: PASSED

- uid.ts exists and contains `crypto.randomUUID`
- ErrorBoundary.tsx exists and contains `getDerivedStateFromError`
- App.tsx contains `ErrorBoundary key=`
- api.local.ts contains `schema_version: mod.schemaVersion` write-back
- Commits 1624a6d and 98c5b42 present in worktree log
