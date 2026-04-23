# Kompass

## What This Is

Kompass ist ein persönliches Reflexions-Werkzeug für kontinuierliche innere Arbeit — Werte,
Glaubenssätze, Schematherapie, ACT-Defusion, Ziele, Hindernisse. Es ist aus einer
Single-File-HTML-Version entstanden und wird jetzt als modulare Webapp mit FastAPI-Backend
und React-Frontend fortgeführt. Single-user, für private, langfristige Nutzung.

## Core Value

Ein verlässlicher privater Raum, in dem Reflexionsarbeit über lange Zeit erhalten bleibt —
egal ob offline oder mit Backend betrieben.

## Current Milestone: v1.1 Schema-Guided Insights

**Goal:** Fragebogen-Ergebnisse (YSQ, Werte) auf der Synthese-Seite zu konkreten Hinweisen auf Ziele und Hindernisse verdichten — regelbasiert, offline-fähig, kein LLM.

**Target features:**
- Statische Mapping-Tabelle: 18 YSQ-Schemata → typische Heilungsziele + häufige Hindernisse
- Insights-Block auf Synthese-Seite für Top-3-Schemata
- Werte-Gap-Analyse: Bereiche mit hohem wichtig/gelebt-Abstand hervorheben
- Quick-Link "Als Ziel erkunden" → Ziele-Modul mit Vorausfüllung

## Requirements

### Validated

- ✓ Values-Modul vollständig portiert (Werte auswählen, Wichtigkeit und Gelebtsein bewerten) — existing
- ✓ Beliefs-Schema-Modul portiert (Glaubenssätze identifizieren, bewerten) — existing
- ✓ Beliefs-ACT-Modul portiert (Defusions-Übungen, Commitments) — existing
- ✓ Goals-Modul portiert (Ziele mit Wert-Verknüpfung, Fortschritt) — existing
- ✓ Obstacles-Modul portiert (Hindernisse mit Cross-Modul-Refs) — existing
- ✓ Synthese-Modul (zusammenfassende Ansicht aller Daten, Text-Export) — existing
- ✓ Orientation-Modul — existing
- ✓ Checkin-Modul (PHQ-9, GAD-7, Krisenband) im Frontend — existing
- ✓ Dual-Mode: localStorage (offline/HTML) und FastAPI-Backend (Docker) — existing
- ✓ Modulares Registry-Pattern (Backend + Frontend), automatische Navigation — existing
- ✓ In-band Datenmigration pro Modul (schema_version + migrations dict) — existing

### Validated in v1.0

- ✓ QUAL-01..05: App-Korrektheit — migration write-back, Error Boundary, crypto.randomUUID(), migration guard, token warning — v1.0
- ✓ DEPS-01..03: Abhängigkeiten — SQLModel pin, vite-plugin-singlefile 2.3.2, Vite 7 + Offline-Build — v1.0
- ✓ CONT-01..06: Content-Lücken — Checkin-Backend, YSQ Backend+Frontend (18 Schemata, 6-Punkt-Skala), Ergebnisansicht, Summary, Konstanten-Extraktion — v1.0
- ✓ PORT-01..04: Datenportabilität — Export/Import Backend, API-Client, mode-aware Verdrahtung, deaktivierter Import-Button — v1.0
- ✓ SNAP-01..06: Snapshot-System — POST/GET/GET-id Backend, create form, Liste, Delta-Vergleich (Values, YSQ, PHQ-9/GAD-7) — v1.0

### Active (v1.1)

- [ ] HINT-01: Statische Mapping-Tabelle — 18 YSQ-Schemata → Heilungsziele + Hindernisse (constants.ts)
- [ ] HINT-02: Insights-Block auf Synthese-Seite für Top-3-Schemata (Heilungsrichtung, Zielvorschläge, Hindernishinweise)
- [ ] HINT-03: Werte-Gap-Hervorhebung (wichtig − gelebt ≥ 2) auf Synthese-Seite
- [ ] HINT-04: "Als Ziel erkunden"-Button → Ziele-Modul mit Vorausfüllung
- [ ] HINT-05: Alle Insight-Texte in constants.ts, keine Hardcodes im Component

### Out of Scope

- KI-Vorschläge für Glaubenssätze oder Ziele — das Nachdenken ist die Übung
- Gamification, Streaks, Badges — kein spielerisches Element
- Social-Sharing, Multi-User in v1 — privater Reflexionsraum
- Automatische Tests als Pflichtbedingung für jeden Commit — Projekt zu klein für CI-Overhead

## Context

**Stand nach v1.0 (shipped 2026-04-22):** Alle 24 v1-Anforderungen implementiert.
~88.500 LOC (Python + TypeScript/TSX), 4 Phasen, 20 Pläne, 111 Commits über 2 Tage.

**Tech Stack:** Python 3.12 / FastAPI / SQLModel / Alembic + React 18 / TypeScript / Vite 7 / Tailwind 3.4.
Vite 7 + vite-plugin-singlefile 2.3.2 produziert Offline-Single-File-HTML.

**Dual-Mode:** localStorage (offline/HTML) und FastAPI-Backend (Docker) — beide Modi produktionsreif.

**Module aktiv:** orientation, checkin (PHQ-9/GAD-7), values, beliefs_schema, beliefs_act, goals,
obstacles, ysq (YSQ-S3, 6-Punkt, 18 Schemata), synthese (Summary + Snapshot-System).

**Architektur-Konstante:** Registry-Pattern bleibt. Kein neues Modul ohne Eintrag im
Backend- und Frontend-Registry. Kein State-Management-Framework in v1.

**Ästhetik-Konstante:** CSS-Variablen und Typografie aus `reference/kompass.html` — keine
Abweichung ohne expliziten Grund. Kein Emoji im UI.

## Constraints

- **Tech Stack**: Python 3.12 / FastAPI / SQLModel / Alembic (Backend), React 18 / TypeScript / Vite / Tailwind (Frontend) — keine Änderungen ohne Diskussion
- **Single-user v1**: User-Konzept im Schema vorbereitet, aber nicht aktiviert
- **Privatsphäre**: Keine externen Dienste, kein Tracking, kein Analytics
- **Kompatibilität**: Import-Format muss mit HTML-v1-Export kompatibel bleiben

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Generisches Modul-Schema (JSON blob, eine Tabelle) | Module kommen schnell hinzu; kein Alembic-Rev für neue Felder | ✓ Good |
| Dual-Mode (local + server) via Build-Flag | Offline-Nutzung ohne Backend als primärer Einstieg | ✓ Good |
| Kein State-Management-Framework | useState + api.ts reichen für v1 | — Pending |
| Cross-Modul-Refs als `{moduleId, id}` | Entkopplung für zukünftige Modul-Varianten | ✓ Good |
| Snapshot-System zurückstellen | Nutzer unsicher über Wert; DB-Tabelle vorbereitet | ✓ Implementiert in Phase 4 |
| GET /api/snapshots/{id} ohne user_id-Filter | Single-user v1: Auth nur auf Token-Ebene; kein IDOR-Risiko in v1 | ⚠ Vor Multi-User beheben |
| Values-Vergleich per label.toLowerCase() | IDs ändern sich über Schema-Versionen hinweg; Label ist stabiler Nutzungsschlüssel | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-23 — v1.1 milestone started*
