# Kompass — Roadmap

## Milestones

- ✅ **v1.0 Kompass MVP** — Phases 1–4 (shipped 2026-04-22)
- **v1.1 Schema-Guided Insights** — Phase 5 (active)

## Phases

<details>
<summary>✅ v1.0 Kompass MVP (Phases 1–4) — SHIPPED 2026-04-22</summary>

- [x] Phase 1: Correctness & Build (4/4 plans) — completed 2026-04-21
- [x] Phase 2: Content Gaps (8/8 plans) — completed 2026-04-22
- [x] Phase 3: Data Portability (3/3 plans) — completed 2026-04-22
- [x] Phase 4: Snapshot System (5/5 plans) — completed 2026-04-22

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v1.1 Schema-Guided Insights

- [ ] **Phase 5: Schema-Guided Insights** — YSQ-Ergebnisse und Werte-Lücken auf der Synthese-Seite als konkrete Ziel- und Hindernishinweise anzeigen

## Phase Details

### Phase 5: Schema-Guided Insights
**Goal**: Der Nutzer sieht auf der Synthese-Seite aus seinen YSQ- und Werte-Daten abgeleitete, konkrete Hinweise auf Heilungsrichtung, Zielvorschläge und unterversorgte Wertebereiche — regelbasiert, ohne LLM, offline-fähig.
**Depends on**: Phase 4 (Synthese-Seite und allData-Pattern vorhanden)
**Requirements**: HINT-01, HINT-02, HINT-03, HINT-04, HINT-05
**Success Criteria** (what must be TRUE):
  1. Der Nutzer sieht auf der Synthese-Seite für seine Top-3-YSQ-Schemata jeweils einen Insights-Block mit Schema-Name, Score, Heilungsrichtung, Zielvorschlägen und Hindernis-Hinweisen — jedoch nur, wenn YSQ ausgefüllt ist.
  2. Der Nutzer sieht auf der Synthese-Seite Werte mit einem wichtig−gelebt-Abstand von ≥ 2 als hervorgehobene Bereiche, mit dem Hinweis, dass dieser Wert wenig gelebt wird und ein möglicher Bereich für ein Ziel ist.
  3. Ein Klick auf "Als Ziel erkunden" im Schema-Insights-Block öffnet das Ziele-Modul mit vorausgefülltem Schema-Namen und Zieltext, den der Nutzer vor dem Speichern bearbeiten kann.
  4. Alle angezeigten Hinweistexte stammen ausnahmslos aus constants.ts-Dateien — keine Inline-Strings im Component-Body.
  5. Die Synthese-Seite zeigt keinerlei Insights-Blöcke, wenn das YSQ noch nicht ausgefüllt wurde (keine leeren oder fehlerhaften Blöcke).
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Vitest setup + ysq/hints.ts (18 schema mappings) + lib/insights.ts (score/gap functions) + unit tests
- [ ] 05-02-PLAN.md — InsightsBlock component (top-3 schema cards + values gap section) + synthese/constants.ts + wired into SyntheseModule
- [ ] 05-03-PLAN.md — Navigate + prefill wiring (ModuleProps extension, App.tsx goalPrefill state, GoalsModule useEffect)

**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Correctness & Build | v1.0 | 4/4 | Complete | 2026-04-21 |
| 2. Content Gaps | v1.0 | 8/8 | Complete | 2026-04-22 |
| 3. Data Portability | v1.0 | 3/3 | Complete | 2026-04-22 |
| 4. Snapshot System | v1.0 | 5/5 | Complete | 2026-04-22 |
| 5. Schema-Guided Insights | v1.1 | 0/3 | Not started | - |

---

*Roadmap created: 2026-04-21*
*Updated: 2026-04-23 — v1.1 Phase 5 plans created*
