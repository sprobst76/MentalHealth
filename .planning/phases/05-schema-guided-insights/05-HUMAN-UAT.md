---
status: partial
phase: 05-schema-guided-insights
source: [05-VERIFICATION.md]
started: 2026-04-23T08:35:00.000Z
updated: 2026-04-23T08:35:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. InsightsBlock mit YSQ-Daten sichtbar

expected: InsightsBlock erscheint auf der Synthese-Seite nach den Modul-Summary-Cards und vor dem Snapshots-Abschnitt. Schema-Namen in Terrakotta (--accent), "Als Ziel erkunden"-Button in Ocean (--ocean). Layout entspricht UI-SPEC.
result: [pending]

### 2. Kein InsightsBlock ohne YSQ-Antworten

expected: Wenn der YSQ-Fragebogen nie ausgefüllt wurde (answers = null), erscheint kein InsightsBlock auf der Synthese-Seite — weder ein leerer Block noch ein Platzhalter.
result: [pending]

### 3. "Als Ziel erkunden"-Button navigiert und befüllt Ziel

expected: Klick auf "Als Ziel erkunden" öffnet das Ziele-Modul sofort. Dort ist ein neues Ziel im Edit-Modus geöffnet. Titel = Schema-Label (z.B. "Verlassenheit / Instabilität"), Beschreibung = erster Zielvorschlagstext. Beide Felder sind editierbar.
result: [pending]

### 4. Prefill-Einmaligkeit (kein Duplikat bei Rückkehr)

expected: Nachdem ein Ziel per Prefill erstellt wurde, navigiert der Nutzer zum Werte-Modul und dann zurück zum Ziele-Modul. Es wird kein zweites leeres/prefilled Ziel erstellt.
result: [pending]

### 5. Unterversorgte Wertebereiche werden angezeigt

expected: Wenn ein Wert wichtig (z.B. 5) aber wenig gelebt (z.B. 2) ist (Lücke ≥ 2), erscheint er im Wertebereiche-Abschnitt des InsightsBlocks mit Gap-Badge ("Lücke 3") und dem Hinweistext aus constants.ts.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
