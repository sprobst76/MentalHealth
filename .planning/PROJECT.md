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

- [ ] CR-01: `GET /api/snapshots/{id}` filtert nicht nach user_id — vor Multi-User-Aktivierung beheben (IDOR)
- [ ] WR-01: `localApi.createSnapshot` hat kein MAX_SNAPSHOTS-Limit (Server erzwingt 200)
- [ ] WR-02/WR-03: Snapshot-Ladefehler werden still geschluckt; Dropdown-Inkonsistenz bei fehlgeschlagenem getSnapshot

### Validated in Phase 4 (Snapshot System)

- ✓ SNAP-01: POST /api/snapshots — Snapshot erstellen mit optionalem Label, 201-Response (id, label, created_at)
- ✓ SNAP-02: GET /api/snapshots — Metadaten-Liste ohne modules-Blob
- ✓ SNAP-03: GET /api/snapshots/{id} — Vollständiger Snapshot mit forward-migriertem modules-Dict; Migrationsfehler → 200 mit Originaldaten (kein 500)
- ✓ SNAP-04: Synthese-Seite: "Snapshot erstellen"-Formular mit Label-Eingabe und Button
- ✓ SNAP-05: Chronologische Snapshot-Liste mit Datum (deutsches Format) und Label
- ✓ SNAP-06: Delta-Vergleich zweier Snapshots — Values (wichtig/gelebt), YSQ-Scores, PHQ-9/GAD-7

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
*Last updated: 2026-04-22 — Phase 4 complete, milestone v1.0 done*
