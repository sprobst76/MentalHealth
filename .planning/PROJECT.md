# Kompass

## What This Is

Kompass ist ein persönliches Reflexions-Werkzeug für kontinuierliche innere Arbeit — Werte,
Glaubenssätze, Schematherapie, ACT-Defusion, Ziele, Hindernisse. Es ist aus einer
Single-File-HTML-Version entstanden und wird jetzt als modulare Webapp mit FastAPI-Backend
und React-Frontend fortgeführt. Single-user, für private, langfristige Nutzung.

## Core Value

Ein verlässlicher privater Raum, in dem Reflexionsarbeit über lange Zeit erhalten bleibt —
egal ob offline oder mit Backend betrieben.

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

### Active

- [ ] YSQ-Modul vollständig portieren (Young Schema Questionnaire — Schemamuster erkennen), Backend + Frontend
- [ ] Checkin-Backend-Modul implementieren (aktuell 404 im Server-Modus; Datenverlust beim Modiwechsel)
- [ ] localApi läuft keine Migrationen beim Laden — stille Datenfehler bei Schema-Upgrades im Offline-Modus beheben
- [ ] Export/Import-Endpoints im Backend implementieren (`GET /api/export`, `POST /api/import`)
- [ ] Error Boundary in App.tsx — ein kaputter Modul darf die App nicht crashen
- [ ] Snapshot-System: API-Routen und minimales UI (DB-Tabelle existiert, Routen fehlen) — nach Klärung des Nutzungswerts
- [ ] Inhaltliche Konstanten aus Komponenten in constants.ts auslagern (CLAUDE.md-Konvention)
- [ ] `Math.random()` für IDs durch `crypto.randomUUID()` ersetzen
- [ ] Backend: Warnung bei Default-Token und Empty-Token-Validation

### Out of Scope

- KI-Vorschläge für Glaubenssätze oder Ziele — das Nachdenken ist die Übung
- Gamification, Streaks, Badges — kein spielerisches Element
- Social-Sharing, Multi-User in v1 — privater Reflexionsraum
- Automatische Tests als Pflichtbedingung für jeden Commit — Projekt zu klein für CI-Overhead

## Context

**Brownfield-Projekt:** Codebase existiert bereits mit substanziellem Fortschritt. Die
HTML-Referenzversion (`reference/kompass.html`) dient weiter als inhaltliche Quelle für
YSQ-Items, Werte-Listen usw.

**Nutzungsmodus:** Beide Modi (local + server) sind relevant — der Nutzer wechselt oder
hat sich noch nicht festgelegt. Korrektheit in beiden Modi ist daher Pflicht.

**Architektur-Konstante:** Registry-Pattern bleibt. Kein neues Modul ohne Eintrag im
Backend- und Frontend-Registry. Kein State-Management-Framework in v1.

**Bekannte kritische Lücken (aus Codebase-Analyse):**
- `localApi.getModule` ruft `runMigrations` nicht auf — Daten können nach Schema-Upgrade
  veraltet sein, ohne Fehlermeldung
- `checkin`-Modul hat kein Backend-Pendant → 404 im Server-Modus
- Snapshot-Routen fehlen trotz existierendem DB-Schema
- Import in App.tsx ruft immer `localApi.importAll` auf, ignoriert den aktiven Storage-Modus

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
| Snapshot-System zurückstellen | Nutzer unsicher über Wert; DB-Tabelle vorbereitet | — Pending |

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
*Last updated: 2026-04-21 after initialization*
