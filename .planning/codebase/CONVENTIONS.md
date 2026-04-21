# Coding Conventions

**Analysis Date:** 2026-04-21

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` (e.g., `ValuesModule.tsx`, `ValuesSummary.tsx`, `PhaseHeader.tsx`)
- Non-component TypeScript: camelCase `.ts` (e.g., `registry.ts`, `migrations.ts`, `api.ts`)
- Module barrel/entry files: `index.ts` (re-exports the `ModuleDef` object for the module)
- Type files: `types.ts` within each module folder
- Constant files: `constants.ts` within each module folder
- Python modules: `snake_case.py` (e.g., `beliefs_act.py`, `beliefs_schema.py`)

**Directories:**
- Frontend modules: `snake_case` matching the module id (e.g., `beliefs_act/`, `goals/`)
- Frontend components: flat under `frontend/src/components/`
- Backend modules: flat under `backend/app/modules/`

**Functions (TypeScript):**
- Named functions in components: camelCase, verb-first (e.g., `toggleSuggestion`, `updateItem`, `addCustom`)
- Utility: plain camelCase (e.g., `uid()`, `runMigrations()`, `emptyStore()`)
- Exported module objects: `camelCase` ending in `Module` (e.g., `valuesModule`, `goalsModule`)

**Functions (Python):**
- All snake_case (e.g., `default_data`, `get_module`, `current_user_id`)
- Private helpers prefixed with `_` (e.g., `_load_or_default`, `_extract_token`, `_build_modules`)

**Variables:**
- TypeScript: camelCase throughout
- Python: snake_case throughout; dataclass fields snake_case with camelCase-named cross-module refs preserved (e.g., `moduleId` in Pydantic models that mirror the TypeScript `Ref` shape)

**Types/Interfaces (TypeScript):**
- PascalCase interfaces (e.g., `ModuleDef`, `ModuleProps`, `ValuesData`, `ValueItem`)
- Generic type parameters: single-letter `T` (e.g., `ModuleDef<T>`, `ModuleProps<T>`)

**Python Pydantic models:**
- PascalCase class names (e.g., `ValuesData`, `ValueItem`, `GoalsData`)
- Exported singleton `SPEC` (uppercase) at the bottom of each module file

## Module File Structure

Each frontend module folder follows this layout:
```
frontend/src/modules/<name>/
├── index.ts          ← exports the ModuleDef<T> object, defines migrations + defaultData
├── types.ts          ← TypeScript interfaces for module data shape
├── constants.ts      ← string arrays, lookup maps — NEVER hardcoded in component files
├── <Name>Module.tsx  ← main interactive component (ModuleProps<T>)
└── <Name>Summary.tsx ← read-only summary block (used in Synthese)
```

Each backend module file:
```
backend/app/modules/<name>.py
├── Item model(s)     ← Pydantic BaseModel for each item type
├── Data model        ← top-level Pydantic BaseModel for the module blob
├── default_data()    ← returns model_dump(mode="json") of empty instance
├── migrations dict   ← {target_version: lambda d: {...d, new_field: default}}
└── SPEC              ← ModuleSpec(...) singleton, exported at module level
```

## React / TypeScript Patterns

**Component signatures:**
```typescript
// Module components — always destructure from ModuleProps<T>
export function ValuesModule({ data, onChange, allData }: ModuleProps<ValuesData>) { ... }

// Shared UI components — Props interface defined inline in same file
interface Props { children: ReactNode; className?: string; }
export function Card({ children, className = "" }: Props) { ... }
```

**State management:**
- No external state library. Use `useState` + `useCallback` + `useMemo` in `App.tsx`
- Module data flows top-down: `App.tsx` owns a `Store` record, passes `data` + `onChange` to each module component
- `onChange` is always a full replacement (not a patch): `onChange({ ...data, field: newValue })`
- Cross-module reads via `allData: AllData` (a `Record<string, unknown>` passed to all modules)

**useMemo usage:**
```typescript
// Used for derived values and filtered lists — always list dependencies explicitly
const selectedIds = useMemo(
  () => new Set(data.selected.map((v) => v.id)),
  [data.selected],
);
```

**Async operations:**
```typescript
// Fire-and-forget saves with .catch() for error capture
void api.putModule(id, next).catch((err) => {
  setStore((s) => ({ ...s, [id]: { ...s[id], error: (err as Error).message } }));
});

// In useEffect, wrap async calls with void
useEffect(() => {
  if (activeId) void loadModule(activeId);
}, [activeId, loadModule, importKey]);
```

**Event handlers in JSX:**
- Always use `type="button"` on `<button>` elements to prevent form submission
- Inline arrow functions acceptable for simple one-liners; named functions for multi-line logic

**JSX text:**
- Typographic German quotation marks (`„"`) go in JSX text children or JS string literals via `{'…'}` expression
- Never in JSX attribute values

**No emojis** in JSX or UI strings (per project convention), except in isolated crisis UI (`CrisisBanner.tsx` uses one warning character).

## Python / FastAPI Patterns

**Dependency injection:**
```python
# Session and user_id injected via Depends — never constructed inline
@router.get("/{module_id}", response_model=ModuleDataResponse)
def get_module_data(
    module_id: str,
    session: Session = Depends(get_session),
    user_id: UUID = Depends(current_user_id),
) -> ModuleDataResponse:
```

**Router organisation:**
- Each router uses `APIRouter(prefix="...", tags=[...])` and is registered in `main.py` via `app.include_router()`
- One router file per logical resource (`modules.py`, `health.py`)

**Error handling:**
```python
# Raise HTTPException immediately on validation failure or missing resource
spec = get_module(module_id)
if spec is None:
    raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown module '{module_id}'.")

try:
    normalized = spec.validate(payload)
except Exception as exc:
    raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
```

**Pydantic models:**
- Optional fields use `= Field(default_factory=list)` or `= ""` — never `= None` unless the field is genuinely nullable
- `model_dump(mode="json")` used when writing to JSON column (ensures UUID/datetime serialisation)
- `from __future__ import annotations` at top of every backend file for forward-ref support

**Settings:**
- All config via `pydantic_settings.BaseSettings` in `backend/app/config.py`; accessed as `settings.field_name`
- No direct `os.environ` reads in application code

## Styling Conventions

**Approach:** Tailwind CSS utility classes only. No custom CSS classes beyond the base reset in `frontend/src/styles/index.css`.

**Design tokens** — always use semantic Tailwind aliases mapped to CSS variables, never raw hex values:
```
bg-paper        bg-paper-2      bg-paper-3      ← backgrounds
text-ink        text-ink-soft   text-ink-faint  ← text
text-accent     text-sage       text-ocean      ← semantic colours
border-line     border-line-soft               ← borders
bg-accent       bg-sage         bg-ocean        ← filled colours
```

**Typography:**
- Display headings: add `.display` class (or `h1`/`h2`/`h3`) — applies Fraunces serif font
- Body text: default Inter Tight (applied via `body` rule in `index.css`)
- Small caps labels: `text-xs tracking-[0.15em] uppercase text-ink-faint` — used throughout for section labels

**Spacing and layout:**
- Module page wrapper: `max-w-3xl mx-auto px-6 py-12`
- Card component (`bg-paper-2 border border-line-soft rounded-sm p-6`) used for all content sections
- `rounded-sm` throughout — no `rounded-lg` or `rounded-xl`
- Dividers: `divide-y divide-line-soft` or `border-t border-line-soft`

**Chip tones:** `"default" | "accent" | "sage" | "ocean"` — select by semantic meaning, not colour preference

**Transitions:** `transition-colors` on all interactive elements

**Print styles:** defined in `index.css` — hide `aside`, `button`; set backgrounds to white

## Import Organisation

**TypeScript import order (observed pattern):**
1. React hooks (`import { useMemo, useState } from "react"`)
2. Shared components (`import { Card } from "../../components/Card"`)
3. Cross-module type imports (`import type { OrientationData } from "../orientation/types"`)
4. Registry types (`import type { ModuleProps } from "../registry"`)
5. Module-local imports (`import { VALUE_PROMPTS } from "./constants"`, `import type { ValuesData } from "./types"`)

**Python import order (observed pattern):**
1. `from __future__ import annotations`
2. Standard library
3. Third-party (pydantic, fastapi, sqlmodel)
4. Local relative imports (`from .registry import ModuleSpec`, `from ..auth import current_user_id`)

**Path aliases:** None configured. All imports use relative paths (`../../components/`, `../registry`).

## Cross-Module References

When one module references data from another, use the typed `Ref` object — never a bare string ID:
```typescript
// frontend/src/types.ts
export type Ref = { moduleId: string; id: string };

// Example usage in goals module
{ moduleId: "values", id: valueId }
```

The same shape is mirrored in Python:
```python
class ValueRef(BaseModel):
    moduleId: str = "values"
    id: str
```

## Module Registry Registration

**Frontend** — add to `frontend/src/modules/registry.ts`:
```typescript
import { myModule } from "./my_module";
export const modules: ModuleDef[] = [..., myModule];
```

**Backend** — add to the `_build_modules()` list in `backend/app/modules/registry.py`:
```python
from . import my_module
specs = [..., my_module.SPEC]
```

No other wiring required — navigation, progress, and synthese derive from the registry automatically.

## Comments and Documentation

- Module entry files (`values.py`, etc.) have a docstring at top explaining the pattern
- Complex logic uses inline `#` comments (e.g., field constraints, migration rationale)
- No JSDoc/TSDoc on component functions — TypeScript types serve as documentation
- `TODO` / future-use comments left in migration dicts as examples: `# 2: lambda d: {**d, "new_field": []},`
