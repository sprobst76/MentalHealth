# Kompass — Project State

**Last updated:** 2026-04-21T12:05Z

---

## Project Reference

**Core value:** Ein verlässlicher privater Raum, in dem Reflexionsarbeit über lange Zeit erhalten bleibt — egal ob offline oder mit Backend betrieben.

**Current milestone:** v1 Completion

**Key files:**
- [PROJECT.md](.planning/PROJECT.md) — scope, constraints, key decisions
- [REQUIREMENTS.md](.planning/REQUIREMENTS.md) — all 24 v1 requirements with IDs
- [ROADMAP.md](.planning/ROADMAP.md) — 4 phases, success criteria, plans

---

## Current Position

**Current phase:** 2 — Content Gaps
**Current plan:** 02 (next to execute)
**Status:** Phase 2 in progress — plan 02-01 complete (1/8)

**Progress bar:**
```
Phase 1 [==========] 100% (all 4 plans complete)
Phase 2 [=         ] 12% (1/8 plans complete)
Phase 3 [          ] 0%
Phase 4 [          ] 0%
```

**Requirements covered:** 9 / 24 (QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, DEPS-01, DEPS-02, DEPS-03, CONT-06)

---

## Next Action

Phase 2 planned (8 plans, 5 waves). **Note:** Plan 02-08 (YSQ constants population) requires `reference/kompass.html` on disk before Wave 5 can execute — plans 02-01 through 02-07 run fully autonomously.

Run: `/gsd-execute-phase 2`

---

## Accumulated Context

### Decisions logged
- Snapshot-System deferred to Phase 4 — DB table exists, routes do not; user unsure of value (PROJECT.md Key Decisions)
- Export format must stay HTML-v1 flat (`{_version, _exported, module_id: {…}}`), not nested under `"modules"` — hard constraint for backward compatibility
- Snapshots use a different envelope from exports: nested under `"modules"`, stores `schema_version` per entry for forward migration
- Error Boundary wraps only the active module render area in `App.tsx`, not app-wide; sidebar must stay navigable
- vite-plugin-singlefile pinned without caret (`"2.3.2"`) — 2.3.3 is untested against Vite 7 in this project (T-01-08)
- vite.config.ts required no changes for Vite 7 compatibility — existing config used no deprecated APIs
- Offline build runs via Docker (node:20-alpine) because host Node 18 is below Vite 7's minimum of 20.19

### Known pitfalls (from research)
- `crypto.randomUUID()` requires Secure Context — `file://` behavior varies by browser; keep `Math.random` fallback path
- Migration functions must never be deleted — old snapshots may need to chain through v1→v2→v3
- Import must skip Pydantic validation — raw blob in, lazy migration on next GET

### Blockers
None.

### Open questions
None.

---

## Session Continuity

To resume work in a new session:
1. Read this file for current position
2. Read ROADMAP.md for phase overview
3. Run `/gsd-execute-phase 2` to begin Phase 2 (Content Gaps), or `/gsd-plan-phase 2` if Phase 2 plans are not yet created

**Last session:** 2026-04-21 — Phase 2 plan 02-01 executed. GOAL_PROMPTS, DEFUSION_EXAMPLES, EXPLORATION_PROMPTS extracted to constants.ts files (CONT-06).
**Stopped at:** Phase 2 plan 02-02 (next to execute).

---

*State initialized: 2026-04-21*
