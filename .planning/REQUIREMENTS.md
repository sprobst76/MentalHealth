# Requirements: Kompass

**Defined:** 2026-04-21
**Core Value:** Ein verlässlicher privater Raum, in dem Reflexionsarbeit über lange Zeit erhalten bleibt — egal ob offline oder mit Backend betrieben.

## v1 Requirements

### Korrektheit & Stabilität

- [ ] **QUAL-01**: `localApi.getModule` führt Migrationen aus und schreibt das migrierte Ergebnis zurück in localStorage (aktuell: Daten bleiben nach Schema-Upgrade veraltet)
- [ ] **QUAL-02**: Error Boundary umschließt den aktiven Modul-Render-Bereich — ein Modul-Fehler crasht nicht die ganze App; Sidebar bleibt navigierbar
- [ ] **QUAL-03**: `crypto.randomUUID()` ersetzt `Math.random()` für ID-Generierung in allen Modulen (beliefs_act, goals, obstacles, checkin) — mit Browser-Kompatibilitätscheck für `file://`-Kontext
- [ ] **QUAL-04**: Backend-Migration auf GET ist gegen Fehler abgesichert — wirft eine Migration-Function eine Exception, gibt der Endpoint die Originaldaten zurück und loggt den Fehler statt mit 500 abzubrechen
- [ ] **QUAL-05**: Default-Token-Warnung: Backend loggt beim Start einen deutlichen Hinweis wenn `KOMPASS_TOKEN` dem Default-Wert `"change-me-please"` entspricht; leerer Token-Wert wird in Settings abgelehnt

### Abhängigkeiten & Build

- [ ] **DEPS-01**: SQLModel auf `>=0.0.32` gepinnt in `pyproject.toml` (behebt Pydantic 2.12+ Kompatibilitätsproblem mit `Annotated`-Feldern)
- [ ] **DEPS-02**: `vite-plugin-singlefile` auf exakte Version `2.3.2` gepinnt (aktuell `^2.0.2`; Vite 6/7 Compat)
- [ ] **DEPS-03**: Vite von 5 auf 7 aktualisiert und Offline-HTML-Build verifiziert (getestet in Chrome und Safari via `file://`)

### Content-Lücken

- [ ] **CONT-01**: Checkin-Backend-Modul (`backend/app/modules/checkin.py`) implementiert und im Registry registriert — PHQ-9/GAD-7-Daten werden im Server-Modus gespeichert statt 404 zurückzugeben
- [ ] **CONT-02**: YSQ-Backend-Modul implementiert — speichert rohe 90-Integer-Antwortarray, `schema_version` vorbereitet für künftige Anpassungen
- [ ] **CONT-03**: YSQ-Frontend-Modul implementiert — paginierter Fragebogen (5 Items pro Schema-Seite, 18 Seiten), Fortschrittsanzeige, Überspringen möglich
- [ ] **CONT-04**: YSQ-Ergebnisansicht — Balkendiagramm der 18 Schema-Scores, nach Score absteigend sortiert, mit Schema-Namen und freiem Notizfeld je Schema
- [ ] **CONT-05**: YSQ-Summary-Block für Synthese-Seite — zeigt die 3 auffälligsten Schemata mit Score
- [ ] **CONT-06**: Inhaltliche Konstanten aus Komponenten-Files in `constants.ts` ausgelagert — betrifft `GOAL_PROMPTS` (GoalsModule), `EXPLORATION_PROMPTS` (ObstaclesModule), `DEFUSION_EXAMPLES` (BeliefsActModule)

### Datenportabilität

- [ ] **PORT-01**: Backend-Endpoint `GET /api/export` implementiert — gibt JSON im HTML-v1-kompatiblen Flat-Format zurück (`{_version, _exported, [module_id]: {schema_version, data}}`)
- [ ] **PORT-02**: Backend-Endpoint `POST /api/import` implementiert — nimmt Flat-Format-JSON an, speichert rohe Blobs ohne Pydantic-Validierung, migriert lazy on next GET
- [ ] **PORT-03**: `App.tsx` Export/Import verdrahtet mode-aware — `api.exportAll()` und `api.importAll()` lösen lokale oder server-seitige Implementierung auf; hardcodierter `localApi`-Aufruf entfernt
- [ ] **PORT-04**: Import-Button im lokalen Modus funktionsfähig, im Server-Modus ohne implementierten Backend-Endpoint deaktiviert mit erklärendem Hinweis

### Snapshot-System

- [ ] **SNAP-01**: Backend-Endpoint `POST /api/snapshots` implementiert — erstellt Snapshot mit `{modules: {[id]: {schema_version, data}}}` inkl. optionalem Label; speichert `schema_version` pro Modul-Eintrag
- [ ] **SNAP-02**: Backend-Endpoint `GET /api/snapshots` implementiert — gibt Metadaten-Liste zurück (id, label, created_at), kein blob
- [ ] **SNAP-03**: Backend-Endpoint `GET /api/snapshots/{id}` implementiert — gibt vollen Snapshot zurück, nach oben migriert auf aktuelle Schema-Versionen
- [ ] **SNAP-04**: Snapshot erstellen: Nutzer kann auf der Synthese-Seite manuell einen Snapshot mit optionalem Label auslösen
- [ ] **SNAP-05**: Snapshot-Liste: Nutzer sieht eine chronologische Liste aller Snapshots (Datum, Label)
- [ ] **SNAP-06**: Snapshot-Vergleich: Nutzer kann zwei Snapshots auswählen und wichtige Delta-Werte vergleichen (Values wichtig/gelebt, YSQ-Scores, PHQ-9/GAD-7)

## v2 Requirements

### Tests

- **TEST-01**: Pytest-Tests für alle Backend-Migrations-Functions — sichert stille Datenkorruption bei Schema-Upgrades ab
- **TEST-02**: Vitest-Tests für `frontend/src/lib/migrations.ts` — Frontend-Migrations-Chain verifiziert
- **TEST-03**: Pytest-Integration-Tests für Export→Import-Roundtrip — HTML-v1-Kompatibilität automatisch geprüft

### UX-Verbesserungen

- **UX-01**: Delta-Indikator auf PHQ-9/GAD-7 Score-Cards im Checkin-Modul ("+3 zum letzten Check-in")
- **UX-02**: Kompakte Zusammenfassungstabelle im Checkin-Verlauf (letzte 12 Einträge)
- **UX-03**: Vite 7 → 8 Upgrade + Tailwind 3 → 4 Migration (nach Vite-7-Stabilisierung)

### Infrastruktur

- **INFRA-01**: Backend-Logging mit structlog oder ähnlichem (aktuell nur uvicorn-Default)
- **INFRA-02**: TypeScript-Typen aus OpenAPI-Schema generiert (`openapi-typescript`), ersetzt manuelle `types.ts`

## Out of Scope

| Feature | Grund |
|---------|-------|
| KI-Vorschläge für Glaubenssätze / Ziele | Das Nachdenken ist die Übung — kein AI-Shortcut |
| Gamification, Streaks, Badges | Kein spielerisches Element im Reflexionsraum |
| Social Sharing / Multi-User | Privates Tool in v1; Multi-User im Schema vorbereitet |
| Echtzeit-Sync zwischen lokalem und Server-Modus | Hohe Komplexität; klare Modustrennung ist die einfachere Lösung |
| Automatischer Snapshot-Rhythmus | Wertet manuelle Snapshots ab; PHQ-9/GAD-7 ist eigene Zeitreihe |
| Spider/Radar-Chart für YSQ | Visuell irreführend für 18 Achsen; Balkendiagramm ist besser |
| Mobile App | Web-first; responsives Design genügt |

## Traceability

*(Wird während der Roadmap-Erstellung befüllt)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| QUAL-01 | — | Pending |
| QUAL-02 | — | Pending |
| QUAL-03 | — | Pending |
| QUAL-04 | — | Pending |
| QUAL-05 | — | Pending |
| DEPS-01 | — | Pending |
| DEPS-02 | — | Pending |
| DEPS-03 | — | Pending |
| CONT-01 | — | Pending |
| CONT-02 | — | Pending |
| CONT-03 | — | Pending |
| CONT-04 | — | Pending |
| CONT-05 | — | Pending |
| CONT-06 | — | Pending |
| PORT-01 | — | Pending |
| PORT-02 | — | Pending |
| PORT-03 | — | Pending |
| PORT-04 | — | Pending |
| SNAP-01 | — | Pending |
| SNAP-02 | — | Pending |
| SNAP-03 | — | Pending |
| SNAP-04 | — | Pending |
| SNAP-05 | — | Pending |
| SNAP-06 | — | Pending |

**Coverage:**
- v1 Requirements: 24 total
- Mapped to phases: 0 (Roadmap ausstehend)
- Unmapped: 24 ⚠️

---
*Requirements defined: 2026-04-21*
*Last updated: 2026-04-21 after initial definition*
