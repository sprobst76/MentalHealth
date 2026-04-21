# Phase 2: Content Gaps — Context

**Gathered:** 2026-04-21
**Status:** Ready for planning — BLOCKED until `reference/kompass.html` is on disk

<domain>
## Phase Boundary

Zwei parallele Workstreams:
1. **Backend-Lücken schließen** — `checkin.py` und `ysq.py` implementieren und im Backend-Registry registrieren, sodass beide Module im Server-Modus Daten speichern statt 404 zurückzugeben
2. **YSQ-Modul vollständig portieren** — paginierter Fragebogen (18 Schemas, 5 Items pro Seite) mit persistiertem In-Progress-State, Ergebnisansicht mit CSS-Balkendiagramm und Schema-Notizfeldern, und Summary-Block auf der Synthese-Seite
3. **Konstanten auslagern** — GOAL_PROMPTS, DEFUSION_EXAMPLES, EXPLORATION_PROMPTS aus den Komponenten-Bodies in constants.ts-Dateien verschieben

Keine neuen Features über CONT-01 bis CONT-06 hinaus.

</domain>

<decisions>
## Implementation Decisions

### YSQ-Quelldaten (CONT-02, CONT-03)

- **D-01:** `reference/kompass.html` ist die Pflichtvoraussetzung für alle YSQ-Tasks. Der Nutzer liefert die Datei nach, BEVOR der Planer für YSQ-Aufgaben startet. Planer soll eine explizite Abhängigkeit notieren: "YSQ-Constants aus kompass.html portieren — Datei muss auf Disk liegen". Kein Fallback auf Standard-YSQ-S3.

### YSQ-Schema-Menge (CONT-02, CONT-03, CONT-04, CONT-05)

- **D-02:** Das YSQ-Modul deckt vollständige 18 Schemas (YSQ-S3-Standard) ab, 5 Items je Schema = 90 Items gesamt. Die 4 Schemas, die in `beliefs_schema/constants.ts` noch fehlen (Abhängigkeit/Inkompetenz, Verwobenheit, Berechtigung/Grandiosität, Ungenügende Selbstkontrolle), existieren nur in `ysq/constants.ts` — nicht in `beliefs_schema`.
- **D-03:** `beliefs_schema` bleibt bei 14 Schemas in Phase 2. Erweiterung auf 18 ist Backlog (Entscheidung bewusst getroffen).

### YSQ-Fragebogen-Navigation (CONT-03)

- **D-04:** In-progress Antworten werden persistent gespeichert (im YSQ-Modul-State als separates Feld neben dem finalen Ergebnis). Nutzer kann den Fragebogen unterbrechen und beim nächsten Besuch fortsetzen.
- **D-05:** "Schema überspringen" bedeutet: die 5 Items des Schemas bleiben leer (kein Score). Im Balkendiagramm erscheint das Schema ohne Balken oder mit expliziter Markierung als "nicht ausgefüllt" — nicht als Score 0.
- **D-06:** Vor/Zurück-Navigation: Jede Schema-Seite hat beide Buttons. Antworten der vorherigen Seite bleiben beim Zurückgehen erhalten.
- **D-07:** Nach Abschluss (alle Schemas beantwortet oder übersprungen + "Abschließen" geklickt) werden alle Antworten in den persistenten YSQ-Result-State committed. In-progress State wird geleert. Kein historisierter Verlauf mehrerer Durchläufe — es gibt genau ein gespeichertes Ergebnis pro Nutzer.

### YSQ-Ergebnisansicht (CONT-04)

- **D-08:** Implementierung als reine CSS-Implementierung — horizontale Balken über Flexbox/CSS. Kein neues Chart-Package.
- **D-09:** Schemas absteigend nach Score sortiert. Keine Click-Interaktion auf Balken.
- **D-10:** Notizfeld (einzeilige Text-Input) erscheint inline direkt unter dem Schema-Balken. Immer sichtbar — kein Aufklappen notwendig.

### Checkin-Backend (CONT-01)

- **Claude's Discretion:** Das Backend-Schema soll die Frontend-Datenstruktur (`CheckinData = { entries: CheckinEntry[] }`) direkt widerspiegeln. Pydantic-Modelle nach dem Pattern von `values.py`.

### Konstanten auslagern (CONT-06)

- **Claude's Discretion:** GOAL_PROMPTS → `goals/constants.ts`, DEFUSION_EXAMPLES → `beliefs_act/constants.ts` (neu erstellen), EXPLORATION_PROMPTS → `obstacles/constants.ts` (neu erstellen). Imports in den jeweiligen Modul-Dateien aktualisieren.

### Claude's Discretion

- Genaue Datenstruktur für YSQ-State: wie In-progress-Antworten und finales Ergebnis im gleichen JSON-Blob koexistieren
- Schema-Version für YSQ-Backend: startet bei 1
- Stelle im YSQ-Ergebnis für übersprungene Schemas (null vs. explizites `skipped: true` Flag)
- Ob übersprungene Schemas in der Balkendiagramm-Ansicht sichtbar sind (vorgeschlagen: ja, grau + "übersprungen"-Label)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CONT-01 bis CONT-06 (Content-Gaps-Anforderungen) mit Akzeptanzkriterien

### Roadmap
- `.planning/ROADMAP.md` — Phase 2 "Content Gaps" Abschnitt — Success Criteria die definieren was "fertig" bedeutet

### Quelldaten (Pflicht vor YSQ-Tasks)
- `reference/kompass.html` — **wird vom Nutzer nachgeliefert** — YSQ-Items (90 Items, 18 Schemas, 5 pro Schema) und Schema-Namen auf Deutsch. Muss auf Disk liegen bevor YSQ-Konstanten portiert werden.

### Bestehende Modul-Referenzen
- `backend/app/modules/values.py` — Referenz-Pattern für Backend-Module (Pydantic-Modelle, SPEC-Struktur, migrations dict)
- `frontend/src/modules/checkin/types.ts` — CheckinData-Struktur die das Backend-Schema matchen muss (CONT-01)
- `frontend/src/modules/checkin/CheckinModule.tsx` — vollständig implementiertes Frontend-Referenz für den Checkin-Stil
- `frontend/src/modules/beliefs_schema/constants.ts` — existierende 14 Schema-Definitionen; YSQ-Schemas müssen konsistente IDs verwenden (z.B. `abandonment`, `mistrust` etc.)
- `backend/app/modules/registry.py` — wo neue SPEC-Objekte registriert werden

### Bestehende Frontend-Muster
- `frontend/src/modules/registry.ts` — wo neue ModuleDef-Einträge registriert werden
- `frontend/src/components/TrendChart.tsx` — CSS/SVG-Stilreferenz für Chart-Implementierung
- `frontend/src/modules/goals/GoalsModule.tsx` — enthält GOAL_PROMPTS (Zeile 14) zur Auslagerung
- `frontend/src/modules/beliefs_act/BeliefsActModule.tsx` — enthält DEFUSION_EXAMPLES (Zeile 10) zur Auslagerung
- `frontend/src/modules/obstacles/ObstaclesModule.tsx` — enthält EXPLORATION_PROMPTS (Zeile 12) zur Auslagerung

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` (`frontend/src/components/Card.tsx`) — alle Content-Sections in bestehenden Modulen nutzen Card
- `PhaseHeader` (`frontend/src/components/PhaseHeader.tsx`) — Standard-Modul-Header mit phaseNum, title, subtitle
- `uid()` (`frontend/src/lib/uid.ts`) — UUID-Generierung (Phase 1 erstellt); für YSQ-Entries wenn nötig
- `frontend/src/lib/migrations.ts` — runMigrations() für In-band-Migration

### Established Patterns
- Backend-Modul-Pattern: Pydantic BaseModel für Item und Data, `default_data()`, `migrations` dict, SPEC am Ende — exakt wie `values.py`
- Frontend-Modul-Pattern: `index.ts` exportiert ModuleDef, `<Name>Module.tsx` + `<Name>Summary.tsx` + `types.ts` + `constants.ts`
- State-Management: `useState` + `onChange` (full replacement), kein externe State-Library
- Kein onClick-Handler auf rein visuellen Elementen (Balkendiagramm ist read-only)

### Integration Points
- `backend/app/modules/registry.py` → `MODULES` Liste: checkin-SPEC und ysq-SPEC anhängen
- `frontend/src/modules/registry.ts` → `modules` Array: ysq-ModuleDef eintragen (checkin ist bereits drin)
- YSQ-Summary muss in `syntheseModule` via `SummaryBlock` prop erscheinen — `allData.ysq` muss typisiert sein

</code_context>

<specifics>
## Specific Ideas

- YSQ-Balkendiagramm: horizontale Balken, Schema-Label linksbündig, Score-Zahl am Ende des Balkens. Stil analog zu den Severity-Farben in TrendChart (sage/ocean/accent nach Score-Höhe).
- In-Progress-State: zwei Felder im YSQ-JSON-Blob — `answers` (finales Ergebnis nach Commit) und `draft` (in-progress Array während Fragebogen läuft). Nach Commit wird `draft` auf null/leer gesetzt.
- YSQ-Ergebnisansicht und Fragebogen auf der gleichen Modul-Seite — Tabs oder Mode-State wie im Checkin-Modul (`"overview" | "questionnaire"`).

</specifics>

<deferred>
## Deferred Ideas

- `beliefs_schema` auf 18 Schemas erweitern (die 4 YSQ-exklusiven Schemas aufnehmen) — bewusst aus Phase 2 herausgehalten; Nutzer hat Backlog bestätigt
- Historisierter YSQ-Verlauf (mehrere Durchläufe als timestamped Entries) — Scope-Entscheidung; Phase 2 hat nur ein gespeichertes Ergebnis. Passt besser in Snapshot-System (Phase 4).

</deferred>

---

*Phase: 02-content-gaps*
*Context gathered: 2026-04-21*
