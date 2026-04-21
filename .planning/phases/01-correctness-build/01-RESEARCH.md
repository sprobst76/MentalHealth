# Phase 1: Correctness & Build — Research

**Researched:** 2026-04-21
**Domain:** Bug fixes (data migrations, error boundaries, UUID safety, backend resilience) + dependency upgrades (SQLModel, Vite 5→7, vite-plugin-singlefile)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Error state is minimal text-only inline note — "Fehler in diesem Modul." and "Seite neu laden um fortzufahren." — rendered in the standard paper/ink color scheme. No Card wrapper, no retry button, no interactive recovery.

**D-02:** No `error.message` shown to the user. Error details are logged to console only.

**D-03:** Error boundary wraps only the active module render area in `App.tsx` — not app-wide. Sidebar and other modules continue to work while one module is broken.

**D-04:** Replace `Math.random()` with `crypto.randomUUID()` everywhere. Keep a `Math.random`-based fallback only for `file://` contexts. Centralize into a shared `uid()` utility — `frontend/src/lib/uid.ts` is the natural home.

**D-05:** `localApi.getModule` must run `runMigrations()` and write the migrated result back to localStorage if the version changed. Silent write-back. If a migration throws, surface it the same way as the server path (error state, not silent swallow).

**D-06:** If a migration function throws during `GET /api/modules/{id}`, the endpoint returns the original stored data (last-known-good), not HTTP 500. Error logged via Python's `logging` module with module ID and exception.

**D-07:** If `KOMPASS_TOKEN` equals `"change-me-please"`: log a WARNING at startup. App still starts.

**D-08:** If `KOMPASS_TOKEN` is empty string: hard reject at startup via a Pydantic `@field_validator` in `Settings`. App refuses to start.

**D-09:** Vite 5 → 7 directly (no Vite 6 waypoint).

**D-10:** "Verified" for offline HTML build = build completes without errors + manual Chrome `file://` check.

**D-11:** SQLModel pinned to `>=0.0.32`. `vite-plugin-singlefile` pinned to exact `2.3.2`.

### Claude's Discretion

- Exact file location for shared `uid()` utility (natural: `frontend/src/lib/uid.ts`)
- Python logging format for migration failures and token warnings (module-level logger is standard)
- Whether to extract the error boundary into a standalone component file or keep it inline in `App.tsx` as a class component

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-01 | `localApi.getModule` runs migrations + writes migrated result back to localStorage | `runMigrations()` already exists in `lib/migrations.ts`; `localApi.getModule` lines 31–52 in `api.local.ts` is the insertion point; server write-back pattern in `App.tsx` lines 65–70 is the reference |
| QUAL-02 | Error boundary wraps active module render area in `App.tsx` | React 18 class component error boundary pattern; render target is line 183 in `App.tsx` (`<active.Component ...>`); decision specifies text-only fallback UI |
| QUAL-03 | Replace `Math.random()` with `crypto.randomUUID()` + `file://` fallback in shared `uid()` | `crypto.randomUUID()` requires Secure Context (HTTPS or localhost); `file://` is not a Secure Context in some browsers; 4 files affected; centralize in `frontend/src/lib/uid.ts` |
| QUAL-04 | Backend GET migration errors return last-known-good data, not 500 | `_load_or_default()` in `routers/modules.py` lines 59–65 is the insertion point; try/except around `spec.migrate()` + write-back block |
| QUAL-05 | Default token warning at startup; empty token rejected at Settings level | `config.py` Settings — add `@field_validator` for empty string; startup warning via FastAPI lifespan or module-level execution; `main.py` has no lifespan yet |
| DEPS-01 | SQLModel pinned to `>=0.0.32` in `pyproject.toml` | Fixes Pydantic 2.12+ `Annotated` fields compatibility; single line change in `backend/pyproject.toml` |
| DEPS-02 | `vite-plugin-singlefile` pinned to exact `2.3.2` | Version `2.3.3` is current but `2.3.2` is the pinned target per D-11; adds Vite 7 compatibility; exact pin prevents auto-upgrade |
| DEPS-03 | Vite 5 → 7 migration + offline HTML build verified | Node 18 on host machine is a blocker for native dev — Docker uses `node:20-alpine` which satisfies Vite 7's Node 20.19+ requirement; `@vitejs/plugin-react` must upgrade to v5.x; `vite.config.ts` may need minor updates |

</phase_requirements>

---

## Summary

Phase 1 is a pure correctness and dependency phase — no new features. All eight requirements target either silent bugs (data loss, crash cascades) or version pins that prevent future breakage. The code changes are small and surgical; the risk surface is low.

The most architecturally interesting fix is QUAL-01: `localApi.getModule` currently returns stale localStorage data without running migrations. The `runMigrations()` function already exists in `lib/migrations.ts` and the server path in `App.tsx` already shows the correct pattern — adding the missing call and write-back to `api.local.ts` is a 10-line change. The data-loss potential is real: any user who has stored data at schema v1 and then updates to v2 will silently receive corrupted data in local mode.

The largest effort item is DEPS-03 (Vite 5 → 7). The project's `vite.config.ts` is minimal — only the `viteSingleFile` plugin and two config flags — so migration should be straightforward. The critical environmental constraint is that the host machine runs Node 18.19.1, which is below Vite 7's 20.19+ requirement. Native development will fail unless Node is upgraded or Docker is used. The Docker compose `frontend` service uses `node:20-alpine`, which satisfies the requirement.

**Primary recommendation:** Execute all eight requirements in a single wave — they are independent of each other with no ordering constraints. Dependency changes (DEPS-01 through DEPS-03) can be verified first since they are lowest risk, then correctness fixes (QUAL-01 through QUAL-05).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| localApi migration (QUAL-01) | Frontend — API Client | — | `api.local.ts` owns the localStorage read path; `runMigrations()` is a frontend utility |
| Error boundary (QUAL-02) | Frontend — App Shell | — | `App.tsx` owns module rendering; boundary wraps the active component slot |
| UUID generation (QUAL-03) | Frontend — Module Layer | — | Four module components generate item IDs; shared utility lives in `src/lib/` |
| Backend migration error guard (QUAL-04) | Backend — API Layer | — | `routers/modules.py` owns the GET handler; migration runs in `_load_or_default()` |
| Token validation (QUAL-05) | Backend — Config | Backend — API Layer | Empty-string rejection is config-time (Pydantic Settings); default-token warning is startup-time (main.py lifespan) |
| SQLModel pin (DEPS-01) | Backend — Config | — | `pyproject.toml` dependency constraint |
| vite-plugin-singlefile pin (DEPS-02) | Frontend — Config | — | `package.json` devDependency |
| Vite upgrade (DEPS-03) | Frontend — Config | — | `package.json` + `vite.config.ts`; Node runtime constraint |

---

## Standard Stack

### Core (unchanged — verified against codebase)
| Library | Current Version | Target Version | Purpose |
|---------|----------------|----------------|---------|
| sqlmodel | `>=0.0.22` | `>=0.0.32` | ORM — pin fixes Pydantic 2.12+ Annotated fields [VERIFIED: sqlmodel.tiangolo.com/release-notes] |
| vite | `^5.3.5` | `^7.0.0` | Build tool and dev server [VERIFIED: npm registry — 7.3.2 is latest] |
| vite-plugin-singlefile | `^2.0.2` | `2.3.2` (exact) | Single-file HTML build [VERIFIED: npm registry — 2.3.3 is latest, 2.3.2 required per D-11] |
| @vitejs/plugin-react | `^4.3.1` | `^5.1.0` | React/JSX transform — v5.x supports Vite 4–7 [VERIFIED: npm peerDependencies] |

### No new libraries required
All Phase 1 changes are bug fixes and version pins. No new dependencies are introduced.

**Version verification:**
```
npm view vite version          → 8.0.9 (latest), 7.3.2 (latest 7.x)
npm view vite-plugin-singlefile version → 2.3.3 (latest), 2.3.2 (target)
npm view @vitejs/plugin-react version   → 6.0.1 (latest), 5.2.0 (latest 5.x)
```
[VERIFIED: npm registry, 2026-04-21]

---

## Architecture Patterns

### System Architecture Diagram

```
localApi.getModule(id)
  ├── localStorage.getItem(KEY(id))
  │     ├── null → return defaultData()              [no migration needed]
  │     └── stored blob { schema_version, data }
  │           ├── version matches spec → return as-is [no migration needed]
  │           └── version stale
  │                 ├── runMigrations(data, from, to, migrations)
  │                 │     └── throws → re-throw (surfaced as error state in App.tsx)
  │                 └── success → localStorage.setItem (write-back) → return migrated data
                                                       ↑
                                              QUAL-01: this path is currently broken
                                              (no runMigrations call, no write-back)

GET /api/modules/{id}
  ├── look up ModuleRecord in DB
  │     └── none → return spec.default_data()
  └── found
        ├── version matches spec → return record.data
        └── version stale
              ├── try: spec.migrate(data, from_version)
              │     ├── success → write-back to DB → return migrated data
              │     └── throws                       ↑
              │           └── log error             QUAL-04: this path currently
              │           └── return original data  propagates 500 instead
              └── (write-back only on success)

App.tsx module render area
  ├── <ErrorBoundary>               ← QUAL-02: class component wrapping this block
  │     ├── active.Component ...    ← throws → boundary catches
  │     └── fallback: text "Fehler in diesem Modul." / "Seite neu laden…"
  └── store[id].error display (existing, below the boundary)
```

### Recommended Project Structure (no changes needed)
The existing structure is correct for all Phase 1 changes. Only these files are modified or created:

```
frontend/src/
├── lib/
│   ├── migrations.ts       (unchanged)
│   └── uid.ts              (NEW — shared uid() utility, QUAL-03)
├── api.local.ts            (QUAL-01 — add runMigrations + write-back)
├── App.tsx                 (QUAL-02 — add ErrorBoundary class component or import)
└── modules/
    ├── beliefs_act/BeliefsActModule.tsx   (QUAL-03 — replace local uid())
    ├── goals/GoalsModule.tsx              (QUAL-03 — replace local uid())
    ├── obstacles/ObstaclesModule.tsx      (QUAL-03 — replace local uid())
    └── checkin/CheckinModule.tsx          (QUAL-03 — replace local uid())

backend/app/
├── config.py               (QUAL-05 — @field_validator for empty token)
├── main.py                 (QUAL-05 — startup warning for default token)
├── routers/modules.py      (QUAL-04 — try/except around migration + write-back)
└── pyproject.toml          (DEPS-01 — sqlmodel version pin)

frontend/
├── package.json            (DEPS-02, DEPS-03 — version pins)
└── vite.config.ts          (DEPS-03 — verify no changes needed; Sass legacy removal may be irrelevant)
```

### Pattern 1: React 18 Class Component Error Boundary

React error boundaries must be class components — functional components cannot catch render errors. This is unchanged in React 18 and 19.

```typescript
// Source: React documentation (react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
// Can be a standalone file (frontend/src/components/ErrorBoundary.tsx)
// or inline in App.tsx as a class component.

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // D-02: log to console, never show to user
    console.error("[ErrorBoundary] Module render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // D-01: text-only, paper/ink colors, no retry button
      // D-03: must reset when activeId changes — see Anti-Patterns below
      return (
        <div className="max-w-3xl mx-auto px-6 py-12 text-ink-soft">
          <p>Fehler in diesem Modul.</p>
          <p>Seite neu laden um fortzufahren.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**CRITICAL — Error boundary reset on navigation:** Class-based error boundaries do not reset their state when the parent re-renders unless given a `key` prop that changes. In `App.tsx`, the `<ErrorBoundary>` must receive `key={activeId}` so that navigating to a different module resets the error state and allows the next module to render normally. Without the `key` prop, one broken module permanently blocks all module rendering until a full page reload.

```typescript
// In App.tsx render:
<ErrorBoundary key={activeId}>
  <active.Component
    data={state.data}
    onChange={handleChange(active.id)}
    allData={allData}
  />
</ErrorBoundary>
```

### Pattern 2: localApi.getModule with Migration + Write-back

```typescript
// Source: mirrors server path in App.tsx lines 65–70
// frontend/src/api.local.ts — getModule method replacement

getModule<T>(id: string): Promise<ModuleRecord<T>> {
  const raw = localStorage.getItem(KEY(id));
  const mod = modules.find((m) => m.id === id);
  if (!mod) return Promise.reject(new Error(`Unknown module: ${id}`));

  if (!raw) {
    return Promise.resolve({
      module_id: id,
      schema_version: mod.schemaVersion,
      data: mod.defaultData() as T,
      updated_at: null,
    });
  }

  const stored = JSON.parse(raw) as { schema_version: number; data: T; updated_at: string };

  if (stored.schema_version < mod.schemaVersion) {
    // D-05: run migrations and write back; throw on error (not silent swallow)
    const migrated = runMigrations<T>(
      stored.data,
      stored.schema_version,
      mod.schemaVersion,
      mod.migrations,
    );
    const updated = { schema_version: mod.schemaVersion, data: migrated, updated_at: now() };
    localStorage.setItem(KEY(id), JSON.stringify(updated));
    return Promise.resolve({ module_id: id, ...updated });
  }

  return Promise.resolve({
    module_id: id,
    schema_version: stored.schema_version,
    data: stored.data,
    updated_at: stored.updated_at,
  });
},
```

Note: `runMigrations` is not wrapped in try/catch here — if it throws, the Promise rejects and `App.tsx`'s existing `catch` block surfaces it as `store[id].error`. This matches the server path behavior (D-05).

### Pattern 3: Backend Migration Error Guard

```python
# Source: backend/app/routers/modules.py — _load_or_default function
# Replaces the bare migration call at lines 59–65

import logging
logger = logging.getLogger(__name__)

# In _load_or_default(), replace the bare migration block:
if record.schema_version < spec.schema_version:
    try:
        data = spec.migrate(record.data, record.schema_version)
        record.schema_version = spec.schema_version
        record.data = data
        record.updated_at = datetime.now(timezone.utc)
        session.add(record)
        session.commit()
        session.refresh(record)
    except Exception as exc:
        # D-06: return last-known-good data, log the error
        logger.error(
            "Migration failed for module %r (stored v%d → spec v%d): %s",
            module_id,
            record.schema_version,
            spec.schema_version,
            exc,
            exc_info=True,
        )
        data = record.data  # last-known-good
```

### Pattern 4: Pydantic Settings — Empty Token Validator + Startup Warning

```python
# Source: backend/app/config.py and backend/app/main.py
# Pydantic v2 @field_validator pattern

from __future__ import annotations
import logging
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)
DEFAULT_TOKEN = "change-me-please"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    kompass_token: str = DEFAULT_TOKEN
    database_url: str = "sqlite:///./kompass.db"
    cors_origins: str = "http://localhost:5173"

    @field_validator("kompass_token", mode="after")
    @classmethod
    def token_must_not_be_empty(cls, v: str) -> str:
        # D-08: empty string is a hard reject — prevents unauthenticated deployments
        if v == "":
            raise ValueError(
                "KOMPASS_TOKEN must not be empty. "
                "Set a token or use the default 'change-me-please' for local dev."
            )
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
```

For the startup warning (D-07), add to `main.py`. The app has no lifespan handler yet — add one:

```python
# backend/app/main.py
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI

logger = logging.getLogger(__name__)
DEFAULT_TOKEN = "change-me-please"


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    if settings.kompass_token == DEFAULT_TOKEN:
        logger.warning(
            "KOMPASS_TOKEN is set to the default value 'change-me-please'. "
            "Change it before any network-accessible deployment."
        )
    yield


app = FastAPI(title="Kompass", version="0.1.0", lifespan=lifespan)
```

### Pattern 5: Shared uid() Utility

```typescript
// Source: based on MDN Web API docs for crypto.randomUUID()
// frontend/src/lib/uid.ts (new file)

/**
 * Generates a unique ID using crypto.randomUUID() where available (Secure Context),
 * falling back to Math.random() for file:// contexts where Secure Context is absent.
 *
 * D-04: crypto.randomUUID() requires Secure Context (HTTPS or localhost).
 * file:// is not a Secure Context in all browsers (Chrome allows it, Firefox/Safari may not).
 */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for file:// contexts
  return Math.random().toString(36).slice(2, 10) +
         Math.random().toString(36).slice(2, 10);
}
```

### Anti-Patterns to Avoid

- **Error boundary without `key` prop:** Without `key={activeId}`, a broken module permanently blocks all module rendering. The boundary never resets on navigation. Always pass `key={activeId}` to `<ErrorBoundary>` in `App.tsx`.
- **Silent migration failure in localApi:** Wrapping `runMigrations` in a try/catch that returns stale data silently (as the current server code does) defeats the purpose of migrations. Per D-05, let it propagate as a rejected Promise.
- **Using `print()` instead of `logging` in backend:** Python `print()` bypasses uvicorn's log system. The `logging.getLogger(__name__)` pattern integrates with uvicorn's formatter and log level configuration.
- **Pydantic `@validator` (v1 API) instead of `@field_validator`:** The project uses Pydantic v2 throughout. Use `@field_validator` with `mode="after"` — the v1 `@validator` decorator is deprecated and will be removed in Pydantic v3.
- **Upgrading `@vitejs/plugin-react` to v6:** v6 requires Vite 8 and introduces `@rolldown/plugin-babel` as a peer dep. The target is Vite 7, so stay on `@vitejs/plugin-react` v5.x.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| React render error isolation | Custom try/catch in render | React class `ErrorBoundary` with `getDerivedStateFromError` | Hooks cannot catch render errors; class `ErrorBoundary` is the official API |
| UUID generation | Custom random string | `crypto.randomUUID()` with `Math.random` fallback | Built into all modern browsers; no library needed |
| Python startup hooks | Module-level code in `main.py` | FastAPI `lifespan` context manager | `lifespan` is the FastAPI-idiomatic way for startup/shutdown logic since FastAPI 0.93 |
| Pydantic Settings validation | Manual check after `settings = Settings()` | `@field_validator` on the Settings class | Validation runs at import time, fails fast, generates clear error messages |

---

## Runtime State Inventory

> Phase 1 is a correctness/dependency phase — no rename, rebrand, or migration. Skipped per criteria.

---

## Common Pitfalls

### Pitfall 1: Error Boundary Doesn't Reset on Module Navigation
**What goes wrong:** User navigates to Module A, it crashes, boundary shows fallback. User clicks Module B in sidebar. Module B also shows the fallback even though it works fine.
**Why it happens:** Class-based error boundaries only reset when their `key` prop changes. Without `key={activeId}`, the boundary carries its error state across all navigation.
**How to avoid:** Bind the boundary's key to `activeId`: `<ErrorBoundary key={activeId}>`.
**Warning signs:** All modules show the error fallback after any single module crash.

### Pitfall 2: Vite 7 Requires Node 20.19+ — Host Machine Has Node 18
**What goes wrong:** `npm install vite@^7` on the host machine either fails or produces a version mismatch warning; `npm run dev` may fail at startup.
**Why it happens:** Vite 7 dropped Node 18 support when it reached EOL (April 2025). `package-lock.json` may resolve to a Vite 7 build that uses ESM-only features unavailable in Node 18.
**How to avoid:** Use Docker for development (`docker compose up frontend`) — the `frontend` service uses `node:20-alpine` which satisfies the requirement. Alternatively, upgrade the host Node to 20.19+.
**Warning signs:** `npm run dev` fails with Node version error; Vite 7 install warnings about engine mismatch.
[VERIFIED: vite.dev/blog/announcing-vite7]

### Pitfall 3: vite-plugin-singlefile Exact Pin vs. Latest
**What goes wrong:** Pinning `2.3.2` exactly while the registry has `2.3.3` is intentional (D-11), but `npm install` with `^` would upgrade to `2.3.3`. The exact version must be specified without `^`.
**Why it happens:** `package.json` currently has `"^2.0.2"` — the caret allows major/minor upgrades. Removing the caret pins exactly.
**How to avoid:** Set `"vite-plugin-singlefile": "2.3.2"` (no `^` or `~`).
**Warning signs:** `package-lock.json` shows version `2.3.3` after install.

### Pitfall 4: SQLModel 0.0.32 Requires Pydantic >=2.12 (Not Pinned in pyproject.toml)
**What goes wrong:** Upgrading SQLModel to `>=0.0.32` without also ensuring `pydantic>=2.8` (already satisfied) and understanding that the 0.0.32 fix specifically addresses Pydantic 2.12+ behavior.
**Why it happens:** The Pydantic 2.12+ `Annotated` fields bug caused SQLModel to fail assembling primary key columns for mapped tables. SQLModel 0.0.32 fixes SQLModel's handling of this Pydantic behavior change.
**How to avoid:** Upgrade `sqlmodel` to `>=0.0.32` — the existing `pydantic>=2.8` constraint already allows 2.12+. No additional Pydantic pin needed.
[VERIFIED: sqlmodel.tiangolo.com/release-notes]

### Pitfall 5: Pydantic `@field_validator` Mode Selection
**What goes wrong:** Using `mode="before"` for the empty-string check causes it to run before Pydantic coerces the value from the environment. An unset env var (not the same as empty string `""`) might behave unexpectedly.
**Why it happens:** `mode="before"` receives the raw string from the environment (or the default); `mode="after"` receives the coerced value. For `str` fields, both modes receive a string — but `mode="after"` is semantically correct for post-coercion invariant checks.
**How to avoid:** Use `@field_validator("kompass_token", mode="after")` for the empty-string check.

### Pitfall 6: localApi Write-back Uses Wrong schema_version
**What goes wrong:** After migrating, the write-back stores `mod.schemaVersion` (the target version) but the initial default-data path also stores `mod.schemaVersion`. If a migration runs, the write-back must store the post-migration version, not the pre-migration stored version.
**Why it happens:** The stored blob has its own `schema_version`; after migration, it must be updated to `mod.schemaVersion` before writing back — not left at the stored version.
**How to avoid:** In the write-back, always write `schema_version: mod.schemaVersion` (the spec's current target), not `stored.schema_version`.

---

## Code Examples

### Verified Patterns

#### React Error Boundary — getDerivedStateFromError Lifecycle
```typescript
// Source: react.dev/reference/react/Component (React 18 docs)
static getDerivedStateFromError(_error: Error): State {
  // Returning new state triggers fallback render. Do NOT call side effects here.
  return { hasError: true };
}

componentDidCatch(error: Error, info: ErrorInfo) {
  // Side effects (logging) go here, not in getDerivedStateFromError.
  console.error("[ErrorBoundary]", error, info.componentStack);
}
```

#### FastAPI Lifespan Pattern (FastAPI >= 0.93)
```python
# Source: fastapi.tiangolo.com/advanced/events/
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup code here
    yield
    # shutdown code here (if needed)

app = FastAPI(lifespan=lifespan)
```

#### Pydantic v2 @field_validator
```python
# Source: docs.pydantic.dev/latest/concepts/validators/#field-validators
from pydantic import BaseModel, field_validator

class MySettings(BaseModel):
    token: str = "default"

    @field_validator("token", mode="after")
    @classmethod
    def token_must_not_be_empty(cls, v: str) -> str:
        if v == "":
            raise ValueError("token must not be empty")
        return v
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FastAPI `@app.on_event("startup")` | `lifespan` async context manager | FastAPI 0.93 (2023) | `on_event` is deprecated; `lifespan` is the current pattern |
| Pydantic v1 `@validator` | Pydantic v2 `@field_validator` | Pydantic 2.0 (2023) | v1 validator is removed in Pydantic v3 |
| `Math.random()` for IDs | `crypto.randomUUID()` | Web Crypto API mainstream ~2022 | Cryptographically safe, no library needed |
| Vite `build.rollupOptions` | `build.rolldownOptions` (Vite 8+) | Vite 8 (not yet) | Not applicable to Phase 1 — Vite 7 still uses rollupOptions |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Used in `SyntheseModule.tsx` as clipboard fallback — deprecated in all browsers but not Phase 1 scope; noted in CONCERNS.md.
- `splitVendorChunkPlugin`: Removed in Vite 6. This project does not use it — no action needed.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `crypto.randomUUID()` is unavailable in `file://` contexts on some browsers (Firefox/Safari) but available in Chrome | QUAL-03, Pattern 5 | If wrong, the fallback path is unnecessarily complex; if correct and omitted, IDs fail silently on offline HTML in Firefox/Safari |
| A2 | `vite-plugin-singlefile` version `2.3.2` is fully compatible with Vite 7 (per CHANGELOG: "Add backward compatibility test for Vite 5, 6, 7") | DEPS-02, DEPS-03 | If wrong, the offline build breaks — test immediately after upgrade |

[ASSUMED: A1] — based on known Secure Context requirements for `crypto.randomUUID()`; file:// is classified as not-secure in Firefox and Safari per MDN but Chrome allows it. [CITED: developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID — "This feature is available only in secure contexts"]

[VERIFIED: A2] — changelog fetched from github.com/richardtallent/vite-plugin-singlefile CHANGELOG.md, version 2.3.2 entry states "Add backward compatibility test for Vite 5, 6, 7".

---

## Open Questions

1. **Node 18 on host machine — is Docker the assumed dev environment?**
   - What we know: Host has Node 18.19.1; Vite 7 requires Node 20.19+; Docker compose frontend service uses `node:20-alpine`.
   - What's unclear: Whether the developer builds natively or via Docker.
   - Recommendation: The plan should note that native `npm run dev` and `npm run build` will fail on this host after Vite 7 upgrade. Add a plan task or note to upgrade host Node OR confirm Docker is the primary workflow. The Vite 7 verification criterion (D-10) can only be satisfied via Docker or an upgraded Node environment.

2. **`@vitejs/plugin-react` version to pin**
   - What we know: Current version is `^4.3.1`; v5.x supports Vite 4–7; v6.x requires Vite 8.
   - What's unclear: Whether to pin to latest 5.x (`5.2.0`) or allow range (`^5.0.0`).
   - Recommendation: Use `^5.0.0` to stay current within v5.x — all v5.x releases support Vite 7.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 7 build (DEPS-03) | Partial | 18.19.1 (host) / 20-alpine (Docker) | Use Docker for build; upgrade host Node to 20.19+ |
| Python 3.12 | Backend (all QUAL/DEPS-01) | Yes | 3.12.3 | — |
| Docker + Docker Compose | Frontend dev (Vite 7) | Not verified on host | — | Upgrade host Node to 20.19+ |
| npm | Frontend dep management | Yes | 9.2.0 | — |

**Missing dependencies with no fallback:**
- Node 20.19+ is required for native Vite 7 development. Currently only Node 18.19.1 is available on the host. Docker resolves this but Docker availability was not verified.

**Missing dependencies with fallback:**
- None beyond the Node version issue.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (backend) — no frontend test framework configured |
| Config file | None — no pytest.ini or vitest.config.* found |
| Quick run command | `cd backend && python -m pytest tests/ -x` (once tests exist) |
| Full suite command | `cd backend && python -m pytest tests/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-01 | localApi.getModule runs migrations and writes back | manual | N/A — no frontend test framework | No test framework |
| QUAL-02 | Error boundary shows fallback on render error | manual | N/A | No test framework |
| QUAL-03 | uid() returns crypto.randomUUID() or fallback string | manual | N/A | No test framework |
| QUAL-04 | GET /api/modules/{id} returns original data when migration throws | integration | `pytest tests/test_modules.py::test_migration_error -x` | No — Wave 0 gap |
| QUAL-05 | Empty KOMPASS_TOKEN rejects at startup | unit | `pytest tests/test_config.py::test_empty_token_rejected -x` | No — Wave 0 gap |
| QUAL-05 | Default token logs WARNING | unit | `pytest tests/test_config.py::test_default_token_warning -x` | No — Wave 0 gap |
| DEPS-01 | SQLModel 0.0.32+ resolves without import errors | smoke | `cd backend && python -c "import sqlmodel; print(sqlmodel.__version__)"` | No test file needed |
| DEPS-02 | vite-plugin-singlefile 2.3.2 installs | smoke | `npm list vite-plugin-singlefile` | No test file needed |
| DEPS-03 | Offline HTML build completes and opens in Chrome | manual | `npm run build:local && open dist-local/index.html` | Manual verification |

### Sampling Rate
- **Per task commit:** Ruff lint (`cd backend && ruff check app/`) + TypeScript typecheck (`cd frontend && npm run typecheck`)
- **Per wave merge:** Backend smoke (`python -m pytest tests/ -x` if test files exist)
- **Phase gate:** Offline HTML build verified in Chrome before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/__init__.py` — package init
- [ ] `backend/tests/test_config.py` — covers QUAL-05 (empty token validator, default token warning)
- [ ] `backend/tests/test_modules.py` — covers QUAL-04 (migration error returns last-known-good)
- [ ] `backend/tests/conftest.py` — shared FastAPI test client fixture (`httpx.AsyncClient`)

Note: Frontend tests (QUAL-01, QUAL-02, QUAL-03) require a test framework (Vitest) that is not installed. These are manual verification items for Phase 1. Installing Vitest is a v2 requirement (TEST-02) — do not add it in Phase 1.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes — QUAL-05 | Pydantic Settings validator (empty token rejection); startup logging |
| V3 Session Management | No | Bearer token is stateless; no session concept |
| V4 Access Control | No | Single-user; no role-based access |
| V5 Input Validation | Yes — QUAL-04 | Pydantic validation on PUT (already exists); migration error guard on GET (QUAL-04) |
| V6 Cryptography | Yes — QUAL-03 | `crypto.randomUUID()` replaces `Math.random()` for ID generation |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated API access (empty token bypass) | Elevation of Privilege | D-08: `@field_validator` rejects empty string at startup |
| Default token in deployed environment | Elevation of Privilege | D-07: startup WARNING log; code-change required to bypass |
| Token baked into frontend bundle | Information Disclosure | Accepted for single-user personal tool (noted in CONCERNS.md); no mitigation in Phase 1 |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — Vite 7.3.2 latest, vite-plugin-singlefile 2.3.3 latest, @vitejs/plugin-react v5.x peer deps
- [VERIFIED: vite.dev/blog/announcing-vite7] — Node 20.19+ requirement, browser target changes
- [VERIFIED: v7.vite.dev/guide/migration] — Breaking changes from Vite 5 to 7
- [VERIFIED: sqlmodel.tiangolo.com/release-notes] — SQLModel 0.0.32 fixes Pydantic 2.12+ Annotated fields
- [VERIFIED: github.com/richardtallent/vite-plugin-singlefile CHANGELOG.md] — 2.3.2 adds Vite 5/6/7 backward compat tests

### Secondary (MEDIUM confidence)
- React error boundary pattern — [react.dev/reference/react/Component] (standard, unchanged since React 16)
- FastAPI lifespan — [fastapi.tiangolo.com/advanced/events] (stable since FastAPI 0.93)
- Pydantic v2 `@field_validator` — [docs.pydantic.dev/latest/concepts/validators] (stable since Pydantic 2.0)

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry and official docs
- Architecture: HIGH — based on direct codebase inspection; all insertion points identified by file and line
- Pitfalls: HIGH — Node 18 / Vite 7 incompatibility verified via official Vite docs; other pitfalls from direct code inspection
- Security: MEDIUM — ASVS mapping is standard for this stack; single-user threat model is straightforward

**Research date:** 2026-04-21
**Valid until:** 2026-07-21 (90 days — stable library ecosystem, no fast-moving components)

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies to Phase 1 |
|-----------|-------------------|
| Tech stack locked: Python 3.12 / FastAPI / SQLModel / Alembic (Backend), React 18 / TypeScript / Vite / Tailwind (Frontend) — no changes without discussion | Vite upgrade is within scope per requirements; React 18 unchanged |
| Single-user v1 | No impact on Phase 1 |
| No external services, no tracking, no analytics | No impact on Phase 1 |
| Import format must stay compatible with HTML-v1 export | Not touched in Phase 1 |
| No Emojis except if user uses them | Enforced — error boundary text uses no emojis |
| No KI suggestions, gamification, sharing features | Not relevant to Phase 1 |
| UI-Primitives only from `components/` — not per-module | ErrorBoundary may live in `components/ErrorBoundary.tsx` (preferred) or inline in App.tsx |
| Typographic German quotes `„"` in JSX text children or JS string literals, never in JSX attribute values | Applied to error boundary fallback text |
| `useState` + `api.ts` wrapper — no state management library | No new state management in Phase 1 |
| `rounded-sm` throughout — no `rounded-lg` | ErrorBoundary fallback renders plain text, no rounded corners needed |
| Module page wrapper: `max-w-3xl mx-auto px-6 py-12` | ErrorBoundary fallback should use this wrapper for visual consistency |
