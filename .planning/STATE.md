# Kompass — Project State

**Last updated:** 2026-04-21

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

**Current phase:** 1 — Correctness & Build
**Current plan:** None (planning not yet started)
**Status:** Not started

**Progress bar:**
```
Phase 1 [          ] 0%
Phase 2 [          ] 0%
Phase 3 [          ] 0%
Phase 4 [          ] 0%
```

**Requirements covered:** 0 / 24

---

## Next Action

Run `/gsd-plan-phase 1` to decompose Phase 1 into executable plans.

Phase 1 covers: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, DEPS-01, DEPS-02, DEPS-03

---

## Accumulated Context

### Decisions logged
- Snapshot-System deferred to Phase 4 — DB table exists, routes do not; user unsure of value (PROJECT.md Key Decisions)
- Export format must stay HTML-v1 flat (`{_version, _exported, module_id: {…}}`), not nested under `"modules"` — hard constraint for backward compatibility
- Snapshots use a different envelope from exports: nested under `"modules"`, stores `schema_version` per entry for forward migration
- Error Boundary wraps only the active module render area in `App.tsx`, not app-wide; sidebar must stay navigable

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
2. Read ROADMAP.md Phase 1 detail section for scope
3. Run `/gsd-plan-phase 1` if plans are not yet created, or continue executing the active plan

---

*State initialized: 2026-04-21*
