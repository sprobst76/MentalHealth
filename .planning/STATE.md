---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Schema-Guided Insights
current_phase: 5
status: ready_to_plan
stopped_at: ~
last_updated: "2026-04-23T00:00:00.000Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# Kompass — Project State

**Last updated:** 2026-04-23

---

## Project Reference

**Core value:** Ein verlässlicher privater Raum, in dem Reflexionsarbeit über lange Zeit erhalten bleibt — egal ob offline oder mit Backend betrieben.

**Current milestone:** v1.1 — Schema-Guided Insights

**Key files:**

- [PROJECT.md](.planning/PROJECT.md) — scope, constraints, key decisions
- [REQUIREMENTS.md](.planning/REQUIREMENTS.md) — 5 v1.1 requirements (HINT-01..05)
- [ROADMAP.md](.planning/ROADMAP.md) — Phase 5, 3 plans (TBD)

---

## Current Position

**Current phase:** Phase 5 — Schema-Guided Insights
**Status:** Roadmap defined — ready to plan Phase 5

**Progress bar:**

```
Phase 5 [          ] 0/3 plans complete
```

**Requirements covered:** 5 / 5

**Planned phases:**
- Phase 5: Schema-Guided Insights (3 plans)
  - 05-01: Schema hints constants (18 schema mappings in constants.ts)
  - 05-02: InsightsBlock component on Synthese page (YSQ top-3 + Values gap)
  - 05-03: "Als Ziel erkunden" quick-link wiring (navigate + pre-fill)

---

## Deferred Items (from v1.0)

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 02: 02-VERIFICATION.md — 3 browser rendering tests (YSQ questionnaire, results view, Synthese summary block) | human_needed — visual-only, all 6 must-haves verified at 6/6 |

## Next Action

Run `/gsd-plan-phase 5` to create the Phase 5 implementation plan.

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
- YSQ answers/draft use `list[int | None] | None` — outer None = no run yet, inner None = skipped item; mirrors TypeScript `YsqAnswer[] | null` exactly
- `GET /api/snapshots/{id}` intentionally does not filter by user_id (single-user v1); auth enforced at token level only
- v1.1 Phase 5 is frontend-only — no backend routes needed; reads existing allData via allData prop on SyntheseModule

### Known pitfalls (from research)

- `crypto.randomUUID()` requires Secure Context — `file://` behavior varies by browser; keep `Math.random` fallback path
- Migration functions must never be deleted — old snapshots may need to chain through v1→v2→v3
- Import must skip Pydantic validation — raw blob in, lazy migration on next GET
- Values snapshot comparison joins by `label.toLowerCase()`, not by id — IDs differ across schema versions

### Blockers

None.

### Open questions

None.

---

## Session Continuity

**Last session:** 2026-04-23 — roadmap created for v1.1

**Stopped at:** roadmap defined, plans not yet created

---

*State initialized: 2026-04-21*
*Updated: 2026-04-23 — v1.1 roadmap defined, Phase 5 ready to plan*
