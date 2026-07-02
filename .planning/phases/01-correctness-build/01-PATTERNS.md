# Phase 1: Correctness & Build — Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 17
**Analogs found:** 14 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/src/lib/uid.ts` | utility | transform | `frontend/src/lib/migrations.ts` | role-match (same lib/ layer, same export shape) |
| `frontend/src/api.local.ts` | service | request-response | `frontend/src/api.local.ts` itself (lines 31–52) | self (surgical addition) |
| `frontend/src/App.tsx` | component (app shell) | request-response | `frontend/src/App.tsx` itself (lines 183–196) | self (surgical addition) |
| `frontend/src/modules/beliefs_act/BeliefsActModule.tsx` | component | CRUD | `frontend/src/modules/values/ValuesModule.tsx` | exact (same uid() inline pattern) |
| `frontend/src/modules/goals/GoalsModule.tsx` | component | CRUD | `frontend/src/modules/values/ValuesModule.tsx` | exact |
| `frontend/src/modules/obstacles/ObstaclesModule.tsx` | component | CRUD | `frontend/src/modules/values/ValuesModule.tsx` | exact |
| `frontend/src/modules/checkin/CheckinModule.tsx` | component | CRUD | `frontend/src/modules/values/ValuesModule.tsx` | exact |
| `backend/app/config.py` | config | — | `backend/app/config.py` itself | self (surgical addition) |
| `backend/app/main.py` | config / entrypoint | — | `backend/app/main.py` itself | self (add lifespan) |
| `backend/app/routers/modules.py` | controller | CRUD | `backend/app/routers/modules.py` itself (lines 58–66) | self (surgical addition inside `_load_or_default`) |
| `backend/pyproject.toml` | config | — | `backend/pyproject.toml` itself | self (version pin) |
| `frontend/package.json` | config | — | `frontend/package.json` itself | self (version pins) |
| `frontend/vite.config.ts` | config | — | `frontend/vite.config.ts` itself | self (verify; possible minor update) |
| `backend/tests/__init__.py` | test | — | none | no analog |
| `backend/tests/conftest.py` | test | request-response | none | no analog — Wave 0 gap |
| `backend/tests/test_config.py` | test | — | none | no analog — Wave 0 gap |
| `backend/tests/test_modules.py` | test | CRUD | none | no analog — Wave 0 gap |

---

## Pattern Assignments

### `frontend/src/lib/uid.ts` (utility, transform)

**Analog:** `frontend/src/lib/migrations.ts`

**Imports / export shape pattern** (`frontend/src/lib/migrations.ts`, lines 1–18):
```typescript
// No imports — pure utility. Single named export function.
export function runMigrations<T>(
  data: unknown,
  fromVersion: number,
  targetVersion: number,
  migrations: Record<number, (d: any) => any>,
): T {
  // ...
}
```

**uid() core pattern** — new file, derived from existing inline definitions across all five module files (`frontend/src/modules/*/ValuesModule.tsx` line 12, `BeliefsActModule.tsx` line 9, etc.):
```typescript
// Existing inline pattern in every module (to be replaced):
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
```

**New centralized pattern** (D-04 — crypto.randomUUID with file:// fallback):
```typescript
// frontend/src/lib/uid.ts — new file
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for file:// contexts where Secure Context is absent
  return Math.random().toString(36).slice(2, 10) +
         Math.random().toString(36).slice(2, 10);
}
```

**Consumer import pattern** — replace every inline `function uid()` in module components with:
```typescript
import { uid } from "../../lib/uid";
// (path depth varies: checkin/goals/obstacles/beliefs_act are all two levels deep)
```

---

### `frontend/src/api.local.ts` (service, QUAL-01)

**Analog:** `frontend/src/api.local.ts` itself — surgical change at lines 31–52.

**Existing imports** (lines 1–11 — unchanged, but `runMigrations` import must be added):
```typescript
import { modules } from "./modules/registry";
import type { ModuleRecord, ModuleSpecWire } from "./types";
// ADD:
import { runMigrations } from "./lib/migrations";
```

**Current broken getModule pattern** (lines 31–52 — missing migration call):
```typescript
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
  return Promise.resolve({                         // <-- BUG: no migration here
    module_id: id,
    schema_version: stored.schema_version,
    data: stored.data,
    updated_at: stored.updated_at,
  });
},
```

**Reference: server path write-back** (`frontend/src/App.tsx`, lines 64–70):
```typescript
const record = await api.getModule<any>(id);
const data =
  record.schema_version < mod.schemaVersion
    ? runMigrations(record.data, record.schema_version, mod.schemaVersion, mod.migrations)
    : record.data;
```

**Fixed pattern** (D-05 — add migration + write-back branch):
```typescript
// After the !raw early-return block, replace the final Promise.resolve with:
if (stored.schema_version < mod.schemaVersion) {
  // D-05: runMigrations throws propagate as rejected Promise (not swallowed)
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
```

---

### `frontend/src/App.tsx` — ErrorBoundary addition (QUAL-02)

**Analog:** `frontend/src/App.tsx` itself — the active module render block (lines 183–196) is the wrap target.

**Existing module render block** (`frontend/src/App.tsx`, lines 183–196):
```typescript
{active?.Component && state?.loaded ? (
  <active.Component
    data={state.data}
    onChange={handleChange(active.id)}
    allData={allData}
  />
) : (
  <div className="p-12 text-ink-faint">Lade…</div>
)}
{state?.error ? (
  <div className="max-w-3xl mx-auto px-6 pb-6 text-accent text-sm">
    {state.error}
  </div>
) : null}
```

**Error fallback styling reference** — existing error display (line 193) uses `text-accent text-sm max-w-3xl mx-auto px-6`; module wrapper convention from CLAUDE.md is `max-w-3xl mx-auto px-6 py-12`. The error boundary fallback should use `text-ink-soft` (not accent) with the module wrapper dimensions.

**ErrorBoundary class component pattern** (new — either inline in App.tsx or as `frontend/src/components/ErrorBoundary.tsx`):
```typescript
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // D-02: log to console only, never show to user
    console.error("[ErrorBoundary] Module render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // D-01: text-only, paper/ink color scheme, no retry button
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

**Usage in App.tsx render** — CRITICAL: `key={activeId}` required for boundary reset on navigation (D-03):
```typescript
// Wrap only the active.Component slot — sidebar continues to work
<ErrorBoundary key={activeId}>
  <active.Component
    data={state.data}
    onChange={handleChange(active.id)}
    allData={allData}
  />
</ErrorBoundary>
```

---

### Module components: uid() replacement (QUAL-03)

**Affected files:** `BeliefsActModule.tsx`, `GoalsModule.tsx`, `ObstaclesModule.tsx`, `CheckinModule.tsx`  
**Also affected (same pattern):** `ValuesModule.tsx` — same inline `uid()` present at line 12.

**Analog:** All five files share the identical inline uid() at the top of the file, immediately before the component function.

**Pattern to remove** (identical in all 5 files):
```typescript
// DELETE this local function in each module:
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
```

**Pattern to add** — add import at top of each file:
```typescript
import { uid } from "../../lib/uid";
// Note: all four QUAL-03 targets live two directory levels deep:
// frontend/src/modules/<name>/<Component>.tsx  →  ../../lib/uid
```

**Import block reference** (`frontend/src/modules/beliefs_act/BeliefsActModule.tsx`, lines 1–7):
```typescript
import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { PhaseHeader } from "../../components/PhaseHeader";
import { RatingDots } from "../../components/RatingDots";
import type { ModuleProps } from "../registry";
import type { ValuesData } from "../values/types";
import type { ActCommitment, BeliefsActData } from "./types";
// ADD: import { uid } from "../../lib/uid";
```

---

### `backend/app/config.py` (QUAL-05 — empty token validator)

**Analog:** `backend/app/config.py` itself — add `@field_validator` to existing `Settings` class.

**Current Settings class** (lines 1–16 — full file):
```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    kompass_token: str = "change-me-please"
    database_url: str = "sqlite:///./kompass.db"
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
```

**Auth.py precedent for settings access** (`backend/app/auth.py`, line 31):
```python
expected = settings.kompass_token
if expected:   # <-- current code treats empty string as "auth disabled"
```

**Pydantic v2 field_validator addition** (D-08 — empty string hard reject):
```python
from __future__ import annotations
import logging
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # ... existing fields ...

    @field_validator("kompass_token", mode="after")
    @classmethod
    def token_must_not_be_empty(cls, v: str) -> str:
        if v == "":
            raise ValueError(
                "KOMPASS_TOKEN must not be empty. "
                "Set a token or use the default 'change-me-please' for local dev."
            )
        return v
```

---

### `backend/app/main.py` (QUAL-05 — startup warning)

**Analog:** `backend/app/main.py` itself — no lifespan handler exists yet (lines 1–18).

**Current app creation** (lines 7 — no lifespan):
```python
app = FastAPI(title="Kompass", version="0.1.0")
```

**Lifespan addition** (D-07 — WARNING log for default token):
```python
from __future__ import annotations
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from .config import settings

logger = logging.getLogger(__name__)
_DEFAULT_TOKEN = "change-me-please"


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    if settings.kompass_token == _DEFAULT_TOKEN:
        logger.warning(
            "KOMPASS_TOKEN is set to the default value '%s'. "
            "Change it before any network-accessible deployment.",
            _DEFAULT_TOKEN,
        )
    yield


app = FastAPI(title="Kompass", version="0.1.0", lifespan=lifespan)
```

---

### `backend/app/routers/modules.py` (QUAL-04 — migration error guard)

**Analog:** `backend/app/routers/modules.py` itself — `_load_or_default` function, lines 58–66.

**Module-level logger pattern** (mirrors what `from __future__ import annotations` already does at line 1):
```python
# Add after existing imports:
import logging
logger = logging.getLogger(__name__)
```

**Current migration block** (lines 58–66 — bare, no error guard):
```python
data = record.data
if record.schema_version < spec.schema_version:
    data = spec.migrate(data, record.schema_version)    # <-- propagates as 500 on throw
    record.schema_version = spec.schema_version
    record.data = data
    record.updated_at = datetime.now(timezone.utc)
    session.add(record)
    session.commit()
    session.refresh(record)
```

**PUT handler try/except reference** (lines 96–99 — same file, existing error handling pattern):
```python
try:
    normalized = spec.validate(payload)
except Exception as exc:
    raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
```

**Fixed pattern** (D-06 — try/except, return last-known-good, log with module_id and exc_info):
```python
data = record.data
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
        # D-06: return last-known-good stored data; never 500 on migration failure
        logger.error(
            "Migration failed for module %r (stored v%d → spec v%d): %s",
            module_id,
            record.schema_version,
            spec.schema_version,
            exc,
            exc_info=True,
        )
        data = record.data  # last-known-good — overrides any partial mutation
```

---

### `backend/pyproject.toml` (DEPS-01 — SQLModel pin)

**Current line** (line 9):
```toml
"sqlmodel>=0.0.22",
```

**Target** (D-11):
```toml
"sqlmodel>=0.0.32",
```

---

### `frontend/package.json` (DEPS-02, DEPS-03 — version pins)

**Current devDependencies** (lines 20–28):
```json
"@vitejs/plugin-react": "^4.3.1",
"vite": "^5.3.5",
"vite-plugin-singlefile": "^2.0.2"
```

**Target** (D-09, D-11):
```json
"@vitejs/plugin-react": "^5.0.0",
"vite": "^7.0.0",
"vite-plugin-singlefile": "2.3.2"
```

Note: `vite-plugin-singlefile` gets no `^` or `~` — exact pin per D-11.

---

### `frontend/vite.config.ts` (DEPS-03 — verify/update)

**Current config** (lines 1–19 — full file):
```typescript
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const isSingleFile = process.env.VITE_STORAGE === "local";

export default defineConfig({
  plugins: [react(), ...(isSingleFile ? [viteSingleFile()] : [])],
  build: isSingleFile
    ? {
        assetsInlineLimit: Infinity,
        cssCodeSplit: false,
      }
    : {},
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

This config uses no deprecated Vite 5-only APIs. `build.rollupOptions` is not present (Vite 7 still uses rollupOptions — `build.rolldownOptions` is Vite 8+). The config should work unchanged after dependency upgrade. Planner should verify after `npm install` that `tsc --noEmit && vite build` passes.

---

### Backend test files — Wave 0 (NEW, no analog in codebase)

**No existing test files in `backend/tests/` — directory does not exist.**

#### `backend/tests/__init__.py`

Empty file — makes `tests/` a Python package for pytest discovery.

#### `backend/tests/conftest.py`

**Pattern from RESEARCH.md** (httpx AsyncClient with FastAPI test app):
```python
from __future__ import annotations
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
```

**Auth pattern** — tests that hit protected endpoints need the Bearer token header, same pattern as `backend/app/auth.py` line 14–18:
```python
# In test helpers or fixtures:
headers = {"Authorization": f"Bearer {settings.kompass_token}"}
```

#### `backend/tests/test_config.py` (QUAL-05)

**Pattern:** pytest + pydantic_settings; import `Settings` directly and instantiate with overrides.

```python
from __future__ import annotations
import pytest
from pydantic import ValidationError


def test_empty_token_rejected():
    from app.config import Settings
    with pytest.raises(ValidationError, match="must not be empty"):
        Settings(kompass_token="")


def test_default_token_warning(caplog):
    import logging
    from app.config import Settings, _DEFAULT_TOKEN  # or import constant
    with caplog.at_level(logging.WARNING, logger="app.main"):
        # Trigger lifespan or call startup code directly
        ...
```

#### `backend/tests/test_modules.py` (QUAL-04)

**Pattern:** integration test using conftest `client` fixture; monkey-patch `spec.migrate` to raise.

```python
from __future__ import annotations
import pytest
from unittest.mock import patch


@pytest.mark.asyncio
async def test_migration_error_returns_last_known_good(client):
    # Store a record with stale schema_version, patch migrate to raise,
    # verify GET returns original data not 500.
    ...
```

---

## Shared Patterns

### Python Module-Level Logger
**Source:** Pattern from `backend/app/auth.py` (uses `from .config import settings` — same import style); logger pattern from RESEARCH.md Pattern 3.  
**Apply to:** `backend/app/config.py`, `backend/app/main.py`, `backend/app/routers/modules.py`
```python
import logging
logger = logging.getLogger(__name__)
```

### `from __future__ import annotations`
**Source:** `backend/app/routers/modules.py` line 1, `backend/app/modules/registry.py` line 1.  
**Apply to:** All new or modified Python files.
```python
from __future__ import annotations
```

### Frontend `uid()` import path convention
**Source:** All five module components (`BeliefsActModule.tsx`, `GoalsModule.tsx`, `ObstaclesModule.tsx`, `CheckinModule.tsx`, `ValuesModule.tsx`) sit at `frontend/src/modules/<name>/`.  
**Apply to:** All five files receiving QUAL-03 uid() replacement.
```typescript
import { uid } from "../../lib/uid";
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `backend/tests/__init__.py` | test | — | No tests directory exists; empty package init has no analog |
| `backend/tests/conftest.py` | test | request-response | No existing pytest fixtures; pattern sourced from RESEARCH.md httpx/ASGITransport pattern |
| `backend/tests/test_config.py` | test | — | No existing tests; pattern sourced from pytest + pydantic_settings documentation |
| `backend/tests/test_modules.py` | test | CRUD | No existing tests; pattern sourced from RESEARCH.md integration test guidance |

---

## Metadata

**Analog search scope:** `frontend/src/`, `backend/app/`  
**Files scanned:** 14 source files read directly  
**Pattern extraction date:** 2026-04-21
