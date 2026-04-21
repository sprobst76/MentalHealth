# Kompass — Roadmap

**Milestone:** v1 Completion
**Created:** 2026-04-21
**Granularity:** Standard

---

## Phases

- [x] **Phase 1: Correctness & Build** — Fix active data-loss bugs, harden the app shell, update dependencies
- [ ] **Phase 2: Content Gaps** — Checkin backend module + full YSQ module (backend, frontend, results, summary) + extract constants
- [ ] **Phase 3: Data Portability** — Export/Import backend endpoints + mode-aware wiring in App.tsx
- [ ] **Phase 4: Snapshot System** — Snapshot API routes + minimal UI (create, list, compare) on Synthese page

---

## Phase Details

### Phase 1: Correctness & Build
**Goal**: The app is reliable in both local and server mode — no silent data loss, no crash cascades, no broken dependencies
**Depends on**: Nothing (first phase)
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, DEPS-01, DEPS-02, DEPS-03
**Success Criteria** (what must be TRUE):
  1. Opening a module in local mode after a schema upgrade delivers the migrated data, not the stale pre-migration data
  2. A module that throws a render error shows an inline error state — the sidebar and other modules continue to work
  3. All generated IDs (beliefs, goals, obstacles, checkin entries) are valid UUIDs, with a `Math.random` fallback only in `file://` contexts where `crypto.randomUUID` is unavailable
  4. The backend returns the last-known-good data (not HTTP 500) if a migration function throws, and the error is logged with context
  5. The offline HTML build completes without errors under Vite 7 and loads correctly in Firefox via `file://`
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 01-01-PLAN.md — Backend test infrastructure (Wave 0 gaps: conftest, test_config, test_modules)
- [x] 01-02-PLAN.md — Backend fixes: QUAL-04 migration error guard, QUAL-05 token validation, DEPS-01 SQLModel pin
- [x] 01-03-PLAN.md — Frontend fixes: QUAL-01 localApi migration write-back, QUAL-02 ErrorBoundary, QUAL-03 uid() utility
- [x] 01-04-PLAN.md — Dependency upgrade: DEPS-02 vite-plugin-singlefile 2.3.2, DEPS-03 Vite 5→7 + offline build verify

### Phase 2: Content Gaps
**Goal**: All existing frontend modules have a corresponding backend module, and the YSQ module is fully usable from questionnaire to results
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):
  1. In server mode, completing a check-in (PHQ-9 / GAD-7) saves the data — no 404, the data persists across page reloads
  2. The user can work through the YSQ questionnaire (18 schema pages, 5 items each), skip schemas, and return to an earlier schema without losing answers
  3. After completing the YSQ, a bar chart shows all 18 schema scores sorted descending, with a free-text note field per schema
  4. The Synthese page shows a YSQ summary block listing the 3 highest-scoring schemas
  5. Hardcoded prompt arrays (goal prompts, exploration prompts, defusion examples) live in `constants.ts` files, not inside component bodies
**Plans**: 8 plans
**UI hint**: yes

Plans:
- [ ] 02-01-PLAN.md — Constants extraction: GOAL_PROMPTS, DEFUSION_EXAMPLES, EXPLORATION_PROMPTS (CONT-06)
- [ ] 02-02-PLAN.md — Backend test stubs: checkin + ysq integration tests (Wave 0 gap)
- [ ] 02-03-PLAN.md — Checkin backend module + registry registration (CONT-01)
- [ ] 02-04-PLAN.md — YSQ backend module + registry registration (CONT-02)
- [ ] 02-05-PLAN.md — YSQ type contracts: types.ts + constants.ts skeleton + index.ts (CONT-03/04/05 infrastructure)
- [ ] 02-06-PLAN.md — YSQ module component: questionnaire + results bar chart (CONT-03, CONT-04)
- [ ] 02-07-PLAN.md — YSQ summary block + frontend registry wiring (CONT-05)
- [ ] 02-08-PLAN.md — YSQ constants population from reference/kompass.html [BLOCKED until file on disk] (CONT-02, CONT-03)

### Phase 3: Data Portability
**Goal**: Users can export all their data and import it back — in both local and server mode, with full HTML-v1 compatibility
**Depends on**: Phase 1
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04
**Success Criteria** (what must be TRUE):
  1. Clicking "Export" in server mode downloads a JSON file in the HTML-v1 flat format (`{_version, _exported, [module_id]: {schema_version, data}}`)
  2. An export created by the original HTML-v1 app can be imported in server mode and the data is visible in all modules after reload
  3. Clicking "Export" or "Import" in local mode calls `localApi` — not a hardcoded reference that ignores the active storage mode
  4. The Import button in server mode is disabled with an explanatory note if the backend endpoint is not available
**Plans**: TBD

### Phase 4: Snapshot System
**Goal**: Users can manually create timestamped snapshots of their complete state and compare any two snapshots side by side
**Depends on**: Phase 2, Phase 3
**Requirements**: SNAP-01, SNAP-02, SNAP-03, SNAP-04, SNAP-05, SNAP-06
**Success Criteria** (what must be TRUE):
  1. On the Synthese page the user can create a snapshot with an optional label; the snapshot is persisted in the database
  2. The Synthese page shows a chronological list of all snapshots with date and label
  3. Selecting two snapshots from the list shows a delta view comparing Values wichtig/gelebt ratings, YSQ scores, and PHQ-9/GAD-7 totals
  4. A snapshot created with an older schema version is forward-migrated to current schema versions when retrieved, without error
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Correctness & Build | 4/4 | Complete | 2026-04-21 |
| 2. Content Gaps | 0/8 | Not started | - |
| 3. Data Portability | 0/? | Not started | - |
| 4. Snapshot System | 0/? | Not started | - |

---

*Roadmap created: 2026-04-21*
*Updated: 2026-04-21 — Phase 1 plans created (4 plans, 2 waves)*
*Updated: 2026-04-21 — Phase 2 plans created (8 plans, 5 waves)*
