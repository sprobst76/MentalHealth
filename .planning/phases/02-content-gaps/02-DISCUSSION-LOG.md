# Phase 2: Content Gaps — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 02-content-gaps
**Areas discussed:** YSQ-Quelldaten, YSQ-Schema-Menge, YSQ-Fragebogen-Navigation, YSQ-Balkendiagramm

---

## YSQ-Quelldaten

| Option | Description | Selected |
|--------|-------------|----------|
| Ich liefere die Datei nach | Nutzer gibt kompass.html-Pfad oder -Inhalt — 1:1 Portierung | ✓ |
| Claude portiert aus Standard-YSQ-S3 | Rekonstruktion aus publiziertem YSQ-S3 | |
| Ich gebe Items direkt vor | Direktes Paste der Items in Chat | |

**User's choice:** Ich liefere die Datei nach
**Notes:** reference/kompass.html wird vor Planungsbeginn auf Disk gelegt.

---

## Timing: kompass.html

| Option | Description | Selected |
|--------|-------------|----------|
| Vor dem Planen | Datei zuerst nachliefern, dann planen | ✓ |
| Planer markiert es als TODO | Planen ohne Datei, TODO für später | |

**User's choice:** Vor dem Planen

---

## YSQ-Schema-Menge (Anzahl)

| Option | Description | Selected |
|--------|-------------|----------|
| Volle 18 (YSQ-S3-Standard) | 90 Items, 18 Schemas nach YSQ Short Form | ✓ |
| Nur 14 (wie beliefs_schema) | 70 Items, Konsistenz mit bestehendem Modul | |
| Richtet sich nach kompass.html | Entscheidung aus Quelldatei ziehen | |

**User's choice:** Volle 18 (YSQ-S3-Standard)

---

## YSQ-Schema-Menge (beliefs_schema-Erweiterung)

| Option | Description | Selected |
|--------|-------------|----------|
| OK für Phase 2, später entscheiden | beliefs_schema bleibt bei 14 in Phase 2 | |
| Direkt beliefs_schema auf 18 erweitern | Phase 2 erweitert auch beliefs_schema | |
| Nein, Backlog | beliefs_schema-Erweiterung kommt später | ✓ |

**User's choice:** Nein, Backlog
**Notes:** Nach Scope-Klärung (nicht im ROADMAP für Phase 2) bewusst zurückgestellt.

---

## YSQ-Fragebogen-Navigation: Session-Persistenz

| Option | Description | Selected |
|--------|-------------|----------|
| Ja — in-progress Antworten persistieren | Separate draft-Feld im State, Fortsetzen möglich | ✓ |
| Nein — Single-Session-Flow | Nur vollständig in einem Zug, kein Resume | |

**User's choice:** Ja — in-progress Antworten persistieren

---

## YSQ-Fragebogen-Navigation: Skip-Mechanismus

| Option | Description | Selected |
|--------|-------------|----------|
| Items bleiben leer (kein Score) | Übersprungenes Schema wird nicht gewertet, grau im Diagramm | ✓ |
| Alle 5 Items auf 0 gesetzt | Skip = Score 0 | |

**User's choice:** Items bleiben leer

---

## YSQ-Fragebogen-Navigation: Back-Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Ja — Vor/Zurück-Buttons pro Schema-Seite | Beide Buttons, Antworten bleiben erhalten | ✓ |
| Nein — nur vorwärts | Nur Weiter + Skip | |

**User's choice:** Ja — Vor/Zurück-Buttons

---

## YSQ-Fragebogen-Navigation: Abschluss-Verhalten

| Option | Description | Selected |
|--------|-------------|----------|
| Werden zu einem gespeicherten Ergebnis committed | Ein Ergebnis, kein Verlauf | ✓ |
| Historisiert — mehrere Durchläufe speichern | Timestamped Entries wie Checkin | |

**User's choice:** Werden zu einem gespeicherten Ergebnis committed

---

## YSQ-Balkendiagramm: Implementierung

| Option | Description | Selected |
|--------|-------------|----------|
| Reine CSS-Implementierung | Horizontale Balken, kein Package | ✓ |
| SVG inline (kein Package) | SVG direkt in React | |
| Recharts (Chart-Bibliothek) | Package mit BarChart-Komponente | |

**User's choice:** Reine CSS-Implementierung

---

## YSQ-Balkendiagramm: Sortierung und Interaktion

| Option | Description | Selected |
|--------|-------------|----------|
| Absteigend sortiert, kein Click | Pure Visualisierung, nach Score sortiert | ✓ |
| Klick öffnet Notizfeld | Click-Interaktion für Notizfeld | |
| Klick navigiert zu beliefs_schema | Cross-Modul-Navigation | |

**User's choice:** Absteigend sortiert, kein Click

---

## YSQ-Balkendiagramm: Notizfelder

| Option | Description | Selected |
|--------|-------------|----------|
| Inline unter jedem Balken | Immer sichtbar, einzeilige Input direkt darunter | ✓ |
| Separater Abschnitt unter dem Diagramm | Zwei Zonen: Diagramm oben, Notizen unten | |

**User's choice:** Inline unter jedem Balken

---

## Claude's Discretion

- Genaue Datenstruktur für YSQ-State (draft vs. answers Koexistenz im JSON-Blob)
- Schema-Version des YSQ-Backend-Moduls (startet bei 1)
- Darstellung übersprungener Schemas im Balkendiagramm (grau + "übersprungen")
- Ob `obstacles/constants.ts` und `beliefs_act/constants.ts` neu erstellt werden (existieren noch nicht)

## Deferred Ideas

- beliefs_schema auf 18 Schemas erweitern — Backlog
- Historisierter YSQ-Verlauf (mehrere Durchläufe) — passt in Phase 4 Snapshot-System
