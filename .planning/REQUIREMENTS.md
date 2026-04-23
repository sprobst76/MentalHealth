# Requirements: Kompass v1.1

**Defined:** 2026-04-23
**Core Value:** Ein verlässlicher privater Raum, in dem Reflexionsarbeit über lange Zeit erhalten bleibt — egal ob offline oder mit Backend betrieben.
**Milestone Goal:** Fragebogen-Ergebnisse (YSQ, Werte) werden auf der Synthese-Seite zu konkreten Hinweisen auf Ziele und Hindernisse verdichtet — regelbasiert, offline-fähig, kein LLM.

## v1.1 Requirements

### Schema-Guided Insights (Schemabasierte Hinweise)

- [ ] **HINT-01**: Für jedes der 18 YSQ-Schemata existiert eine statische Mapping-Tabelle (`constants.ts`) mit typischen Heilungszielen (2–3 Stichpunkte) und häufigen Hindernissen/Schemamodi (1–2 Stichpunkte) — keine generierten Texte, nur kuratierte, fachlich fundierte Hinweise
- [ ] **HINT-02**: Die Synthese-Seite zeigt für die Top-3-Schemata (höchster Score) jeweils einen Insights-Block: Schema-Name + Score, Heilungsrichtung (1–2 Sätze), Zielvorschläge, Hindernis-Hinweise — nur wenn YSQ ausgefüllt
- [ ] **HINT-03**: Werte mit einem "wichtig − gelebt"-Abstand von ≥ 2 Punkten werden auf der Synthese-Seite als unterversorgte Bereiche hervorgehoben, mit einem kurzen Hinweis ("Dieser Wert wird wenig gelebt — ein möglicher Bereich für ein Ziel")
- [ ] **HINT-04**: Ein "Als Ziel erkunden"-Button im Schema-Insights-Block navigiert zum Ziele-Modul und befüllt das neue Ziel mit einem Vorschlagstext (Schema-Name + typisches Ziel); der Nutzer kann den Text vor dem Speichern bearbeiten
- [ ] **HINT-05**: Alle Insights-Texte (Schema-Mappings, Values-Gap-Hinweise) liegen in eigenen `constants.ts`-Dateien — keine Hardcodes im Component-Body; Struktur erlaubt spätere Erweiterung ohne Component-Änderungen

## Future Requirements (v1.2+)

### Erweiterte Hinweise

- **HINT-EXT-01**: PHQ-9/GAD-7-Trend-Analyse — wenn letzte 3 Check-ins Verschlechterung zeigen, Hinweis auf typische depressive/Angst-Hindernisse auf Synthese-Seite
- **HINT-EXT-02**: Hindernis-Vorschlag aus Schema-Mapping direkt erstellen ("Als Hindernis markieren") analog zu HINT-04
- **HINT-EXT-03**: Beliefs-Verknüpfung — Schema-Mapping enthält Verweise auf typische Glaubenssätze, die im Beliefs-Schema-Modul zu finden wären

### Tests

- **TEST-01**: Vitest-Tests für `frontend/src/lib/migrations.ts` — Frontend-Migrations-Chain
- **TEST-02**: Pytest-Integration-Tests für Export→Import-Roundtrip
- **TEST-03**: Vitest-Tests für Schema-Insights-Logik (Gap-Berechnung, Top-3-Auswahl)

### UX-Verbesserungen

- **UX-01**: Delta-Indikator auf PHQ-9/GAD-7 Score-Cards im Checkin-Modul ("+3 zum letzten Check-in")
- **UX-02**: Kompakte Zusammenfassungstabelle im Checkin-Verlauf (letzte 12 Einträge)
- **UX-03**: Vite 7 → 8 Upgrade + Tailwind 3 → 4 Migration

## Out of Scope

| Feature | Grund |
|---------|-------|
| KI-Generierte Ziel- oder Hindernis-Texte | Das Nachdenken ist die Übung — kein AI-Shortcut |
| Automatisches Erstellen von Zielen/Hindernissen ohne Nutzeraktion | Nur Vorschlag + Bestätigung; nie ohne explizite Nutzeraktion |
| Klinische Empfehlungen oder Diagnosen | Kein medizinisches Tool |
| PHQ-9/GAD-7-Trend in v1.1 | Scope-Begrenzung; klarer Mehrwert erst mit mehr Check-in-Daten |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HINT-01 | Phase 5 | Pending |
| HINT-02 | Phase 5 | Pending |
| HINT-03 | Phase 5 | Pending |
| HINT-04 | Phase 5 | Pending |
| HINT-05 | Phase 5 | Pending |

**Coverage:**
- v1.1 Requirements: 5 total
- Mapped to phases: 5 / 5
- Unmapped: 0

---
*Requirements defined: 2026-04-23*
*Milestone: v1.1 — Schema-Guided Insights*
*Traceability updated: 2026-04-23 — all HINT-01..05 mapped to Phase 5*
