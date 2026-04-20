# Kompass — Projekt-Leitfaden für Claude Code

Dieses Dokument ist der Architektur-Anker. Lies es zu Beginn jeder Session.
Die Struktur hier ist **bewusst modular** — weiche nicht ohne Grund davon ab.

## Projektkontext

Kompass ist ein persönliches Reflexions-Werkzeug für kontinuierliche innere Arbeit
(Werte, Glaubenssätze, Schematherapie, ACT-Defusion, Ziele, Hindernisse). Es ist
aus einer Single-File-HTML-Version entstanden (`reference/kompass.html`), die als
inhaltliche und konzeptuelle Referenz dient.

**Ziel dieser Codebase**: Kompass-Instrument für langfristige Nutzung mit Zeitverlauf,
Snapshots, mehreren Modulen und sauberen Erweiterungspunkten.

**Nutzer**: Einzelperson (single-user für v1). Multi-user-Unterstützung ist vorbereitet
im Schema, aber nicht aktiviert.

## Architektur in einem Satz

Jedes Modul ist **autonom** — es definiert sein eigenes Schema, seine Komponente und
seinen Summary-Block; ein zentrales **Registry** im Backend wie im Frontend hält sie
zusammen.

## Verzeichnisstruktur

```
kompass/
├── CLAUDE.md                          ← diese Datei
├── README.md
├── docker-compose.yml
├── .env.example
├── reference/
│   └── kompass.html                   ← Inhalts-Referenz (alle Texte, YSQ-Items,
│                                        Werte-Listen etc. beim Portieren von hier ziehen)
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   └── app/
│       ├── main.py                    ← FastAPI-App
│       ├── config.py                  ← Pydantic-Settings
│       ├── db.py                      ← SQLModel-Engine & Session
│       ├── models.py                  ← DB-Modelle (ModuleRecord, User)
│       ├── auth.py                    ← Single-user-Token (env-based)
│       ├── modules/
│       │   ├── registry.py            ← ModuleSpec-Definition
│       │   ├── values.py              ← pro Modul: Schema + Default + Migrationen
│       │   ├── ysq.py
│       │   ├── beliefs_schema.py
│       │   ├── beliefs_act.py
│       │   ├── goals.py
│       │   └── obstacles.py
│       ├── routers/
│       │   ├── modules.py             ← generisches CRUD: /api/modules/{id}
│       │   └── health.py
│       └── schemas/                   ← Pydantic-Response-Modelle
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts                     ← thin API-Client (entspricht Store.* im HTML)
        ├── types.ts                   ← Shared types (Ref, ModuleData, etc.)
        ├── lib/
        │   └── migrations.ts          ← runMigrations equivalent
        ├── modules/
        │   ├── registry.ts            ← Module Registry (Frontend-Seite)
        │   ├── values/
        │   │   ├── index.ts
        │   │   ├── ValuesModule.tsx
        │   │   ├── ValuesSummary.tsx
        │   │   ├── types.ts
        │   │   └── constants.ts
        │   └── ...                    ← pro Modul: gleicher Unterordner
        ├── components/                ← geteilte UI (PhaseHeader, RatingDots, Chip, Card)
        └── styles/
            └── index.css              ← CSS-Variablen + Basis (aus reference/kompass.html)
```

## Die zwei Kern-Abstraktionen

### 1. Module Registry (Backend + Frontend)

**Backend** (`backend/app/modules/registry.py`):
```python
@dataclass(frozen=True)
class ModuleSpec:
    id: str                                         # "values", "ysq", ...
    title: str
    phase_num: str                                  # "01", "02", ...
    order: int
    schema_version: int
    data_schema: type[BaseModel]                    # Pydantic-Schema für Validierung
    default_data: Callable[[], dict]
    migrations: dict[int, Callable[[dict], dict]]   # {2: v1_to_v2, 3: v2_to_v3, ...}
```

Alle Module werden in `MODULES: list[ModuleSpec]` registriert. Der generische
Router `/api/modules/{module_id}` nutzt diese Liste für Validierung und Defaults.

**Frontend** (`frontend/src/modules/registry.ts`):
```typescript
export interface ModuleDef<T = unknown> {
  id: string;
  title: string;
  phaseNum: string;
  kind: "data" | "special";
  schemaVersion: number;
  defaultData: () => T;
  migrations: Record<number, (data: any) => any>;
  Component?: React.FC<ModuleProps<T>>;
  SummaryBlock?: React.FC<{data: T; allData: AllData}>;
  school?: string;
}
```

Navigation, Progress-Bar und Synthese-Seite generieren sich **automatisch** aus dem
Registry. Ein neues Modul hinzufügen heißt: Eintrag im Registry, Ordner unter
`modules/<name>/` anlegen, Backend-Modul in `app/modules/<name>.py`. Sonst nichts.

### 2. Module Records (Datenmodell)

Ein Record pro (User, Modul):

```sql
CREATE TABLE module_records (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL,
  module_id     VARCHAR(50) NOT NULL,
  schema_version INTEGER NOT NULL,
  data          JSON NOT NULL,
  created_at    TIMESTAMP NOT NULL,
  updated_at    TIMESTAMP NOT NULL,
  UNIQUE (user_id, module_id)
);
```

**Warum nicht eine Tabelle pro Modul?** Weil Module schnell hinzukommen und sich
ändern; generisches Schema hält den Migrationsaufwand minimal und spiegelt das
Registry-Pattern 1:1. Für Analytics-Queries kann man später materialisierte Views
auf spezifische Modul-Daten legen — aber das ist eine ferne Optimierung.

## Cross-Module-Referenzen

Wenn ein Hindernis auf einen Glaubenssatz zeigt, ist die Referenz ein **typisiertes
Objekt**:
```typescript
type Ref = { moduleId: string; id: string };
```

Nie einfach eine nackte ID — immer mit `moduleId`. So kann ein Hindernis auf einen
Satz aus `beliefsSchema` ODER `beliefsACT` zeigen, ohne am Code etwas zu ändern,
wenn später ein drittes Belief-Modul dazukommt.

## Migration-Strategie

**Datenbank-Migrationen** (Struktur): Alembic.
**Daten-Migrationen innerhalb eines Moduls** (Schema-Evolution): in-band im Modul
selbst. Jedes Modul hat ein `schema_version`-Feld und ein `migrations`-Dict. Beim
Laden wird automatisch hochmigriert. Kein Alembic-Rev für „Modul X hat jetzt ein
neues optionales Feld" — das ist Daten-Evolution, nicht Struktur-Evolution.

Beispiel:
```python
# backend/app/modules/values.py
migrations = {
    2: lambda d: {**d, "intentions": []},  # v1 → v2: neues Feld
}
```

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLModel (= SQLAlchemy + Pydantic v2), Alembic
- **DB**: SQLite für Dev (`kompass.db`), Postgres für Prod (via `DATABASE_URL`)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Styling**: Warm editorial — Fraunces (Serif) + Inter Tight (Sans), Papier-Tonierung,
  Terrakotta-Akzent. CSS-Variablen in `frontend/src/styles/index.css`.
- **Container**: Docker Compose, Dev-Setup ohne Traefik (Ports direkt exposed)

Kein State-Management-Framework (Redux/Zustand/React Query) für v1 — `useState` +
`api.ts`-Wrapper reichen. Wenn das Frontend komplexer wird, React Query einbauen.

## Setup (Entwickler-Sicht)

```bash
cp .env.example .env
docker compose up -d
# Backend:  http://localhost:8000  (Swagger: /docs)
# Frontend: http://localhost:5173
```

Oder nativ:
```bash
# Backend
cd backend && pip install -e . && alembic upgrade head && uvicorn app.main:app --reload

# Frontend (anderes Terminal)
cd frontend && npm install && npm run dev
```

## API-Vertrag (kurz)

```
GET    /api/modules                          → Liste aller Module (Spezifikationen)
GET    /api/modules/{id}                     → Eigene Daten für ein Modul
PUT    /api/modules/{id}                     → Daten ersetzen
POST   /api/snapshots                        → Snapshot aller Module
GET    /api/snapshots                        → Liste der Snapshots
GET    /api/export                           → Vollexport als JSON
POST   /api/import                           → Vollimport
```

Auth: Bearer-Token aus `KOMPASS_TOKEN` (env). Single-user.

## Fortschritt-Tracker für Agent-Sessions

Beim Start einer Session: Lies diese Datei, dann schau nach, was schon existiert
und was noch fehlt.

### Fertig im Scaffold:
- [x] Verzeichnisstruktur
- [x] Backend-Grundgerüst (main, config, db, models)
- [x] Generischer `/api/modules/{id}`-Router
- [x] Module-Registry-Abstraktion
- [x] **Values-Modul** — vollständig portiert (Backend + Frontend, Referenzmuster)
- [x] Frontend-App-Shell mit Registry-Navigation
- [x] Docker Compose für Dev
- [x] Alembic-Basis-Setup

### TODO — in dieser Reihenfolge empfohlen:
- [ ] **YSQ-Modul** portieren (Backend-Schema + Frontend-Component + Summary)
- [ ] **Beliefs-Schema-Modul** portieren
- [ ] **Beliefs-ACT-Modul** portieren
- [ ] **Goals-Modul** portieren (inkl. Wert-Link über Cross-Module-Ref)
- [ ] **Obstacles-Modul** portieren (Cross-Module-Refs zu Beliefs und Goals)
- [ ] **Synthese-Seite** zusammenbauen (Summary-Block-Kette)
- [ ] **Snapshot-System** (Zeitverlauf — das war der Haupt-Grund für den Port)
- [ ] **Auth-Middleware** aktivieren (aktuell ist der Token-Check kommentiert)
- [ ] **Import/Export** End-to-End testen (Kompatibilität mit HTML-v1-Export)

## Konventionen beim Portieren

Beim Portieren eines Moduls aus `reference/kompass.html`:

1. **Inhaltliche Konstanten zuerst** — Werte-Listen, YSQ-Items, Beispiel-Sätze in
   `frontend/src/modules/<name>/constants.ts`. Niemals im Component-File hardcoden.
2. **Schema** in `backend/app/modules/<name>.py` als Pydantic-Model. Optional-Felder
   mit Defaults, nicht mit `None`.
3. **TypeScript-Types** in `frontend/src/modules/<name>/types.ts`. Beim Vorbereiten
   für Codegen (z. B. via openapi-typescript) später diese Datei ggf. durch
   Generated ersetzen.
4. **UI-Primitives nur aus `components/`** — nicht pro Modul neu bauen. Chip, Card,
   RatingDots, PhaseHeader sind geteilt.
5. **Keine typografischen Anführungszeichen in JSX-Attributen** (Lektion aus der
   HTML-v1). Typografische `„"` entweder in JSX-Text-Children verwenden oder in
   JS-String-Literals via `{'...'}`-Expression einschließen.
6. **Keine Emojis**, außer der Nutzer nutzt sie selbst. Das Tool ist reflektiv,
   nicht verspielt.

## Ästhetik-Konstanten

Aus `reference/kompass.html` — **nicht abweichen** ohne expliziten Grund:

```css
--paper: #f4ede1;          /* Hintergrund */
--paper-2: #ebe2d1;
--paper-3: #e0d4bd;
--ink: #2a2420;            /* Primärtext */
--ink-soft: #5a4f45;       /* Sekundärtext */
--ink-faint: #8a7f73;      /* Hints, Meta */
--accent: #b94e2b;         /* Terrakotta — Hauptakzent */
--accent-soft: #e67752;
--sage: #5b6f4a;           /* Stärkende Glaubenssätze */
--ocean: #3a5a6e;          /* ACT / Defusion */
--line: #c9bda5;
--line-soft: #d8cdb8;
```

Fonts: Fraunces (display, serif), Inter Tight (body, sans). Beide über Google Fonts.

## Was ausdrücklich NICHT in die Codebase gehört

- KI-Auto-Suggestions für Glaubenssätze oder Ziele (das Nachdenken ist die Übung)
- Streak-Counter, Gamification, Badges
- Sharing-Features zu Social-Media
- Analytics oder Tracking über das eigene Verhalten hinaus

Das Tool ist ein privater Reflexionsraum. Punkt.

## Debugging-Hinweise

- Wenn das Frontend leere Daten zeigt, prüfe `localStorage` im Browser-DevTools
  (während API im Dev-Modus aus ist) oder den API-Response im Netzwerk-Tab.
- SQLite-DB lokal: `backend/kompass.db` — mit `sqlite3` oder DB-Browser inspizierbar.
- Alembic-Migrationen: `cd backend && alembic history` / `alembic upgrade head`.
- Logs: `docker compose logs -f backend` / `docker compose logs -f frontend`.
