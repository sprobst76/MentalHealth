# Kompass — Retrospective

---

## Milestone: v1.0 — Kompass MVP

**Shipped:** 2026-04-22
**Phases:** 4 | **Plans:** 20 | **Commits:** 111
**Timeline:** 2026-04-20 → 2026-04-22 (2 days)

### What Was Built

- Phase 1: Correctness & Build — migration write-back, Error Boundary, crypto.randomUUID(), migration guard, token warning, Vite 5→7 upgrade
- Phase 2: Content Gaps — Checkin-Backend, vollständiges YSQ-Modul (YSQ-S3 6-Punkt, 18 Schemata), Balkendiagramm-Ergebnis, Top-3-Summary, Konstanten-Extraktion
- Phase 3: Data Portability — Export/Import Backend mit HTML-v1-Kompatibilität, mode-aware Verdrahtung in App.tsx
- Phase 4: Snapshot System — POST/GET/GET-id Backend, Snapshot-UI (create form, Liste, Delta-Vergleich) auf Synthese-Seite

### What Worked

- **Registry-Pattern zahlte sich aus:** Neues Modul (YSQ, Checkin) hinzufügen = Backend-Spec + Frontend-ModuleDef + Ordner. Kein generierter Boilerplate, kein vergessener Eintrag.
- **TDD-Ansatz für Phase 4:** RED-Gate (failing tests zuerst) gab klares Ziel und verhinderte Implementierungs-Drift. Alle 17 Tests grün nach Plan 04-02.
- **Dual-Mode-Abstraction:** `api.ts` + `api.local.ts` mit identischer Signatur — Änderungen an Export/Import waren in beiden Modi konsistent ohne Code-Duplizierung.
- **Code-Review-Fix-Loop:** Alle kritischen (CR-01) und Warn-Findings (WR-01..04) nach Phase 4 behoben, bevor Milestone Close. Keine Tech-Debt-Anhäufung.
- **Snapshot-Format-Entscheidung:** Klare Trennung Export-Format (HTML-v1 flat) vs. Snapshot-Format (nested mit schema_version) — verhinderte zukünftige Migrations-Ambiguität.

### What Was Inefficient

- **REQUIREMENTS.md-Checkboxen nicht aktualisiert:** Während der Ausführung wurden die `[ ]` Checkboxen nie auf `[x]` gesetzt. Erforderte manuelle Korrektur bei Milestone-Close. Lektion: Checkbox-Updates in Pläne einbauen oder ganz weglassen (STATUS in Traceability-Tabelle reicht).
- **YSQ-Skala-Korrektur mid-execution:** Plan 02-08 musste die Scale von 4-Punkt auf 6-Punkt (YSQ-S3 Standard) korrigieren und barColor-Thresholds nachjustieren. Hätte in Plan 02-05 (type contracts) recherchiert werden sollen.
- **Context-Exhaustion bei Phase 4:** Stopped at 90% context — 20 Pläne in einem einzigen Milestone-Cycle ist am oberen Ende des komfortablen Bereichs. Kleinere Milestones oder mehr /clear-Breaks wären besser.

### Patterns Established

- **RED-Gate vor Implementierung:** Failing test suite als Wave 0 in jeder Phase mit Backend-Endpunkten. Gibt klares DONE-Kriterium.
- **Code-Review nach jeder Phase:** `/gsd-code-review` + `/gsd-code-review-fix` als fester Abschluss-Schritt, nicht optional.
- **Snapshot-Envelope-Trennung:** `{modules: {id: {schema_version, data}}}` für Snapshots vs. `{_version, _exported, module_id: {…}}` für Exports — beide Formate explizit dokumentiert in STATE.md.

### Key Lessons

- Inline Konstanten (YSQ-Items, Prompts) **immer** in `constants.ts` von Anfang an — nie im Component-Body. Nachträgliche Extraktion kostet einen ganzen Plan (02-01).
- `schema_version` in Snapshot-Einträgen ist keine Optimierung — es ist die Grundlage für korrekte Vorwärts-Migration. Ohne sie wäre ein ganzer Migrations-Chain nicht reproduzierbar.
- Values-Vergleich per `label.toLowerCase()` statt ID ist eine pragmatische Entscheidung, die explizit dokumentiert sein muss — IDs ändern sich über Schema-Versionen, Labels sind nutzer-stabil.

### Cost Observations

- 4 Phasen, 20 Pläne, 2 Tage — sehr dichte Iteration
- Sonnet 4.6 für alle Implementierungs-Pläne; Sonnet für Research/Review-Pläne
- Notable: TDD-Approach in Phase 4 reduzierte Debugging-Runden auf null (alle Tests grün beim ersten GREEN-Gate-Commit)

---

## Cross-Milestone Trends

| Dimension | v1.0 |
|-----------|------|
| Phases | 4 |
| Plans | 20 |
| Timeline (days) | 2 |
| Commits | 111 |
| LOC (approx) | 88,500 |
| Code review findings | 1 critical, 4 warnings (all resolved) |
| Deferred verification items | 1 (visual-only) |

---

*Created: 2026-04-22 at v1.0 milestone close*
