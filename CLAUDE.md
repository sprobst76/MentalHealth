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

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kompass**

Kompass ist ein persönliches Reflexions-Werkzeug für kontinuierliche innere Arbeit — Werte,
Glaubenssätze, Schematherapie, ACT-Defusion, Ziele, Hindernisse. Es ist aus einer
Single-File-HTML-Version entstanden und wird jetzt als modulare Webapp mit FastAPI-Backend
und React-Frontend fortgeführt. Single-user, für private, langfristige Nutzung.

**Core Value:** Ein verlässlicher privater Raum, in dem Reflexionsarbeit über lange Zeit erhalten bleibt —
egal ob offline oder mit Backend betrieben.

### Constraints

- **Tech Stack**: Python 3.12 / FastAPI / SQLModel / Alembic (Backend), React 18 / TypeScript / Vite / Tailwind (Frontend) — keine Änderungen ohne Diskussion
- **Single-user v1**: User-Konzept im Schema vorbereitet, aber nicht aktiviert
- **Privatsphäre**: Keine externen Dienste, kein Tracking, kein Analytics
- **Kompatibilität**: Import-Format muss mit HTML-v1-Export kompatibel bleiben
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Python 3.12 - Backend API server (`backend/`)
- TypeScript 5.5 - Frontend application (`frontend/src/`)
- CSS - Styling via Tailwind utility classes + custom CSS variables (`frontend/src/styles/index.css`)
## Runtime
- Python 3.12 (enforced via `requires-python = ">=3.12"` in `backend/pyproject.toml`)
- Uvicorn ASGI server (standard extras) — `uvicorn[standard]>=0.30`
- Node 20 (pinned in Docker Compose via `node:20-alpine` image)
- ESM modules (`"type": "module"` in `frontend/package.json`)
- Backend: pip with `pyproject.toml` (PEP 621); lockfile not present
- Frontend: npm; `package-lock.json` expected (standard npm)
## Frameworks
- FastAPI `>=0.115` - HTTP API framework (`backend/app/main.py`)
- SQLModel `>=0.0.22` - ORM combining SQLAlchemy + Pydantic v2 (`backend/app/db.py`, `backend/app/models.py`)
- Pydantic `>=2.8` - Data validation and settings
- pydantic-settings `>=2.4` - Environment-based configuration (`backend/app/config.py`)
- Alembic `>=1.13` - Database migrations (`backend/alembic/`)
- python-multipart `>=0.0.9` - Form data parsing
- React 18.3 - UI framework (`frontend/src/`)
- Vite 5.3 - Dev server and build tool (`frontend/vite.config.ts`)
- Tailwind CSS 3.4 - Utility-first CSS (`frontend/tailwind.config.js`)
- PostCSS 8.4 + Autoprefixer 10.4 - CSS processing
- `@fontsource-variable/fraunces` 5.1 - Display/serif font
- `@fontsource-variable/inter-tight` 5.1 - Body/sans font
- pytest `>=8`
- httpx `>=0.27` - async HTTP client for test requests
- Ruff `>=0.6` - Python linter/formatter (`line-length = 100`, `target-version = "py312"` in `backend/pyproject.toml`)
## Build Tools
- setuptools `>=69` + wheel - Python build backend
- Package discovery: `include = ["app*"]` finds `backend/app/`
- `@vitejs/plugin-react` 4.3 - React/JSX transform for Vite
- `vite-plugin-singlefile` 2.0 - Bundles entire app into one self-contained HTML file when `VITE_STORAGE=local`
- TypeScript compiler (`tsc --noEmit`) runs before every build as type-check step
## TypeScript Configuration
- Target: ES2022
- Lib: ES2022, DOM, DOM.Iterable
- Module: ESNext, bundler resolution
- JSX: react-jsx
- Strict mode enabled: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- `resolveJsonModule`, `isolatedModules`, `esModuleInterop` all enabled
## Database Technologies
- SQLite — file at `/data/kompass.db` (container) or `./kompass.db` (native)
- Connection via `DATABASE_URL=sqlite:////data/kompass.db`
- PostgreSQL via `psycopg[binary]>=3.2` (optional extra `[postgres]` in `backend/pyproject.toml`)
- Example URL: `postgresql+psycopg://user:pass@db:5432/kompass`
- Alembic handles structural migrations (`backend/alembic/versions/`)
- In-band module-level data migrations for schema evolution within module JSON blobs
## Container Setup
| Service | Base Image | Port |
|---------|-----------|------|
| backend | Custom (`backend/Dockerfile` — `python:3.12-slim`) | 8000 |
| frontend | `node:20-alpine` | 5173 |
## Platform Requirements
- Python 3.12+
- Node 20+
- pip + npm
- Docker + Docker Compose (no other requirements)
- Docker Compose deployment (direct port exposure, no Traefik/reverse proxy in current config)
- Or any WSGI/ASGI host that can run Uvicorn with Python 3.12
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase `.tsx` (e.g., `ValuesModule.tsx`, `ValuesSummary.tsx`, `PhaseHeader.tsx`)
- Non-component TypeScript: camelCase `.ts` (e.g., `registry.ts`, `migrations.ts`, `api.ts`)
- Module barrel/entry files: `index.ts` (re-exports the `ModuleDef` object for the module)
- Type files: `types.ts` within each module folder
- Constant files: `constants.ts` within each module folder
- Python modules: `snake_case.py` (e.g., `beliefs_act.py`, `beliefs_schema.py`)
- Frontend modules: `snake_case` matching the module id (e.g., `beliefs_act/`, `goals/`)
- Frontend components: flat under `frontend/src/components/`
- Backend modules: flat under `backend/app/modules/`
- Named functions in components: camelCase, verb-first (e.g., `toggleSuggestion`, `updateItem`, `addCustom`)
- Utility: plain camelCase (e.g., `uid()`, `runMigrations()`, `emptyStore()`)
- Exported module objects: `camelCase` ending in `Module` (e.g., `valuesModule`, `goalsModule`)
- All snake_case (e.g., `default_data`, `get_module`, `current_user_id`)
- Private helpers prefixed with `_` (e.g., `_load_or_default`, `_extract_token`, `_build_modules`)
- TypeScript: camelCase throughout
- Python: snake_case throughout; dataclass fields snake_case with camelCase-named cross-module refs preserved (e.g., `moduleId` in Pydantic models that mirror the TypeScript `Ref` shape)
- PascalCase interfaces (e.g., `ModuleDef`, `ModuleProps`, `ValuesData`, `ValueItem`)
- Generic type parameters: single-letter `T` (e.g., `ModuleDef<T>`, `ModuleProps<T>`)
- PascalCase class names (e.g., `ValuesData`, `ValueItem`, `GoalsData`)
- Exported singleton `SPEC` (uppercase) at the bottom of each module file
## Module File Structure
## React / TypeScript Patterns
- No external state library. Use `useState` + `useCallback` + `useMemo` in `App.tsx`
- Module data flows top-down: `App.tsx` owns a `Store` record, passes `data` + `onChange` to each module component
- `onChange` is always a full replacement (not a patch): `onChange({ ...data, field: newValue })`
- Cross-module reads via `allData: AllData` (a `Record<string, unknown>` passed to all modules)
- Always use `type="button"` on `<button>` elements to prevent form submission
- Inline arrow functions acceptable for simple one-liners; named functions for multi-line logic
- Typographic German quotation marks (`„"`) go in JSX text children or JS string literals via `{'…'}` expression
- Never in JSX attribute values
## Python / FastAPI Patterns
- Each router uses `APIRouter(prefix="...", tags=[...])` and is registered in `main.py` via `app.include_router()`
- One router file per logical resource (`modules.py`, `health.py`)
- Optional fields use `= Field(default_factory=list)` or `= ""` — never `= None` unless the field is genuinely nullable
- `model_dump(mode="json")` used when writing to JSON column (ensures UUID/datetime serialisation)
- `from __future__ import annotations` at top of every backend file for forward-ref support
- All config via `pydantic_settings.BaseSettings` in `backend/app/config.py`; accessed as `settings.field_name`
- No direct `os.environ` reads in application code
## Styling Conventions
- Display headings: add `.display` class (or `h1`/`h2`/`h3`) — applies Fraunces serif font
- Body text: default Inter Tight (applied via `body` rule in `index.css`)
- Small caps labels: `text-xs tracking-[0.15em] uppercase text-ink-faint` — used throughout for section labels
- Module page wrapper: `max-w-3xl mx-auto px-6 py-12`
- Card component (`bg-paper-2 border border-line-soft rounded-sm p-6`) used for all content sections
- `rounded-sm` throughout — no `rounded-lg` or `rounded-xl`
- Dividers: `divide-y divide-line-soft` or `border-t border-line-soft`
## Import Organisation
## Cross-Module References
## Module Registry Registration
## Comments and Documentation
- Module entry files (`values.py`, etc.) have a docstring at top explaining the pattern
- Complex logic uses inline `#` comments (e.g., field constraints, migration rationale)
- No JSDoc/TSDoc on component functions — TypeScript types serve as documentation
- `TODO` / future-use comments left in migration dicts as examples: `# 2: lambda d: {**d, "new_field": []},`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Every reflection module is self-contained: it owns its Pydantic schema, default data factory, and data-migration chain
- A central registry (backend + frontend) assembles modules into navigation, progress, and synthesis — automatically
- The database stores one generic JSON blob per (user, module); no per-module tables
- The frontend runs in two modes: server-backed (API calls to FastAPI) or fully offline (localStorage via `api.local.ts`)
## Layers
- Purpose: Validates, stores, and migrates module data; issues and checks bearer tokens
- Location: `backend/app/`
- Contains: FastAPI app, routers, Pydantic schemas, SQLModel models, auth
- Depends on: Module registry, database session, config
- Used by: Frontend API client (`frontend/src/api.ts`)
- Purpose: Declares every module's identity, schema, defaults, and data-migration chain; no HTTP concerns
- Location: `backend/app/modules/registry.py` and individual module files (`backend/app/modules/*.py`)
- Contains: `ModuleSpec` dataclass, `MODULES` list, `get_module()`, per-module SPEC exports
- Depends on: Pydantic `BaseModel`
- Used by: `backend/app/routers/modules.py`
- Purpose: SQLModel ORM wrappers over SQLite (dev) or Postgres (prod)
- Location: `backend/app/models.py`, `backend/app/db.py`
- Contains: `User`, `ModuleRecord`, `Snapshot` SQLModel tables
- Depends on: SQLAlchemy, database URL from config
- Used by: All routers via `Depends(get_session)`
- Purpose: Layout, sidebar navigation, active-module switching, crisis banner, data loading, import/export
- Location: `frontend/src/App.tsx`
- Contains: `Store` state (one `ModuleState` per module), `loadModule`, `handleChange` callbacks
- Depends on: `modules/registry.ts`, `api.ts`, `lib/migrations.ts`
- Used by: `main.tsx` as root component
- Purpose: Declares all `ModuleDef` objects; drives navigation order, routing, and summary chain
- Location: `frontend/src/modules/registry.ts`
- Contains: `ModuleDef` interface, `modules` array, `getModule()` helper
- Depends on: Each module's `index.ts` export
- Used by: `App.tsx`, `SyntheseModule.tsx`, any cross-module lookup
- Purpose: Thin fetch wrapper; auto-selects server API or localStorage adapter based on `VITE_STORAGE`
- Location: `frontend/src/api.ts` (server mode), `frontend/src/api.local.ts` (offline mode)
- Contains: `serverApi`, `localApi`, unified `api` export
- Depends on: `VITE_API_BASE`, `VITE_KOMPASS_TOKEN`, `VITE_STORAGE` env vars
- Used by: `App.tsx`
- Purpose: One self-contained directory per module with its component, summary block, types, and constants
- Location: `frontend/src/modules/<name>/`
- Contains: `index.ts` (exports `ModuleDef`), `<Name>Module.tsx`, `<Name>Summary.tsx`, `types.ts`, `constants.ts`
- Depends on: Shared components from `frontend/src/components/`
- Used by: Module registry imports each module's `index.ts`
## Data Flow
- Single `Store` object in `App.tsx` (`useState`) — no external state library
- Optimistic local update on every `onChange`; errors surface via `store[id].error`
## Key Abstractions
- Purpose: Describes one module to the generic router — schema, defaults, migration chain
- File: `backend/app/modules/registry.py`
- Pattern: Frozen dataclass with `migrate(data, from_version)` and `validate(data)` methods; each module file exports a single `SPEC` constant
- Purpose: Mirrors `ModuleSpec` on the frontend; adds React component references
- File: `frontend/src/modules/registry.ts`
- Pattern: `ModuleDef<T>` interface with `Component` and `SummaryBlock` FC references; `kind: "data" | "special"` distinguishes API-backed vs. derived modules (e.g., `synthese`)
- Purpose: Typed pointer from one module's item to another module's item
- Definition: `type Ref = { moduleId: string; id: string }` in `frontend/src/types.ts` and as a Pydantic model in `backend/app/modules/obstacles.py`
- Pattern: Always carries `moduleId`; never a bare `id`. Allows obstacles to reference beliefs from `beliefsSchema` or `beliefsACT` interchangeably
- Purpose: Drop-in replacement for the server API using `localStorage`
- File: `frontend/src/api.local.ts`
- Pattern: Same method signatures as `serverApi`; storage key is `kompass:module:<id>`; supports `exportAll()` / `importAll()` for JSON roundtrip
## Entry Points
- Location: `backend/app/main.py`
- Triggers: `uvicorn app.main:app` (Docker or native)
- Responsibilities: Creates FastAPI app, mounts CORS middleware, registers routers
- Location: `frontend/src/main.tsx`
- Triggers: Vite dev server or static build served from browser
- Responsibilities: Mounts React root with `<App />`
- Location: `frontend/src/api.ts` — `USE_LOCAL` flag switches to `localApi` when `VITE_STORAGE=local` or `window.location.protocol === "file:"`
- Triggers: Build with `VITE_STORAGE=local`; distributable as a single HTML file
## API Routes
```
```
- `POST /api/snapshots`
- `GET  /api/snapshots`
- `GET  /api/export`
- `POST /api/import`
## Database Schema
```sql
```
## Migration Strategy
- `schema_version: int` — current target version
- `migrations: dict[int, Callable]` — keyed by target version number (e.g., `{2: lambda d: {**d, "new_field": []}}`)
## Error Handling
- Unknown module ID → `404 Not Found`
- Pydantic validation failure on PUT → `422 Unprocessable Entity`
- Missing/wrong bearer token → `401 Unauthorized`
- Frontend load failure → `store[id].error` string shown below the active module
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
