# Research Summary — Kompass

**Date:** 2026-04-21

## Executive Summary

Kompass ist ein brownfield-Projekt mit solider Registry-Architektur. Die dringendste Arbeit
sind keine neuen Features — sondern drei aktive Datenverlust-Bugs: kein Backend für das
Checkin-Modul (stille 404s), Import hardcoded auf `localApi` (ignoriert Server-Modus),
`localApi.getModule` schreibt migrierte Daten nicht zurück (re-running migrations, Korrektheitsproblem).

Empfohlene Reihenfolge: Korrektheit zuerst → Content-Lücken schließen → Datenportabilität → Snapshot-System.

---

## Key Stack Findings

- **SQLModel: `>=0.0.32` pinnen** — Versionen unter 0.0.32 brechen `Annotated`-Felder mit Pydantic 2.12+
- **vite-plugin-singlefile auf 2.3.2 aktualisieren** — aktuelle 2.0 hat keine Vite 6/7 Kompatibilitätsgarantie; Offline-Build ist load-bearing
- **Vite 5 → 7 jetzt, Vite 8 separat evaluieren** — `vite-plugin-singlefile` bestätigt nur Vite 7 Support; Tailwind 3→4 nach dem Vite-Upgrade
- **React 18 bleibt** — React 19 bietet nichts was Kompass braucht; verschieben
- **Kein State-Management-Framework in v1** — `useState + api.ts` reicht durch das Snapshot-System hindurch

---

## Key Feature Insights

- **Checkin-Backend ist die höchste Priorität** — kein `ModuleSpec` → PUT gibt 404 zurück; Frontend verwirft Einträge lautlos im Server-Modus
- **YSQ: rohe 90-Integer-Antwortarray speichern, nicht vorberechnete Scores** — ermöglicht rückwirkende Neubewertung. Klassisches 18-Schema-Modell, 5 Items pro Seite; Balkendiagramm nach Score sortiert für Ergebnisse (kein Spider-Chart)
- **Snapshot-Rhythmus: manuell, monatlich** — Automatische Snapshots entwerten manuelle und verschwenden Speicher; PHQ-9/GAD-7 sind ihre eigene Zeitreihe
- **Export muss HTML-v1-Flat-Format erhalten** — Top-Level-Modul-Keys (`{_version, module_id: {…}}`), kein Nesting unter `"modules"` — Hard Constraint für Rückwärtskompatibilität
- **Check-in UI braucht nur Delta-Indikatoren** — "+3"/"-2" vs. vorheriger Eintrag; vorhandene TrendChart-Implementierung ist bereits ausreichend

---

## Architecture Decisions

- **Snapshot JSON speichert `schema_version` pro Modul-Eintrag** — nötig für Forward-Migration alter Snapshots; roh schreiben, hochmigrieren beim Lesen
- **Export und Snapshot nutzen verschiedene Envelope-Formate** — Export flach (HTML-v1-Compat), Snapshot nested unter `"modules"`; Import überspringt Pydantic-Validierung, migriert lazy on next GET
- **Error Boundary pro Modul, nicht App-weit** — nur die aktive Modul-Render-Stelle in `App.tsx` wrappen; `key={activeId}` resettet Boundary bei Navigation; Sidebar muss funktionsfähig bleiben
- **`localApi.getModule` muss migrate-and-persist** — `runMigrations` aufrufen, Ergebnis mit `setItem` zurückschreiben (atomar); spiegelt Server-Pfad
- **Mode-aware Export/Import erfordert Backend-Endpoints zuerst** — `api.ts`-Erweiterungen kommen nach `POST /api/import` und `GET /api/export`

---

## Critical Pitfalls to Avoid

- **Migrations nie aus dem Dict löschen** — ein Snapshot von vor 18 Monaten muss ggf. durch v1→v2→v3 migriert werden; Migration-Functions sind permanent
- **`file://`-Kontext für `crypto.randomUUID()` testen** — erfordert Secure Context; `file://`-Verhalten variiert per Browser; vor dem Entfernen des `Math.random()`-Fallbacks testen
- **Import niemals mit Pydantic validieren** — fremde Exports können leicht abweichen; raw blob speichern, lazy migrieren on GET
- **Backend-Migration auf GET hat kein `try/except`** — wenn eine Migration-Function wirft, bekommt der User ein permanentes 500 ohne Recovery; guarded fallback + logging einbauen
- **Snapshot-Vergleichs-UI nicht überentwickeln** — zwei-Snapshot-Diff mit Delta-Werten reicht für v1; komplexe Zeitreihenvisualisierung erst nach validierter Nutzung

---

## Recommended Build Order

1. **Korrektheit & Qualität** — `localApi`-Migrations-Bug, Error Boundary, `crypto.randomUUID()`, Dependency-Bumps (SQLModel, vite-plugin-singlefile, Vite 7)
2. **Content-Lücken** — Checkin-Backend-Modul + YSQ-Modul (Backend + Frontend + Summary)
3. **Datenportabilität** — Export/Import Backend-Endpoints, mode-aware Verdrahtung in `App.tsx`
4. **Snapshot-System** — `routers/snapshots.py`, Snapshot-API, minimales Synthese-UI (Erstellen + Liste + Vergleich)

---

*Research synthesized: 2026-04-21*
