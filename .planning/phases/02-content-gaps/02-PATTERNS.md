# Phase 2: Content Gaps — Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 11 (new/modified files across backend and frontend)
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/app/modules/checkin.py` | model/module | CRUD | `backend/app/modules/values.py` | exact |
| `backend/app/modules/ysq.py` | model/module | CRUD | `backend/app/modules/values.py` | exact |
| `backend/app/modules/registry.py` | config | — | self (modify `_build_modules`) | exact |
| `frontend/src/modules/ysq/types.ts` | model | — | `frontend/src/modules/checkin/types.ts` | exact |
| `frontend/src/modules/ysq/constants.ts` | utility | — | `frontend/src/modules/beliefs_schema/constants.ts` | exact |
| `frontend/src/modules/ysq/index.ts` | config | — | `frontend/src/modules/checkin/index.ts` | exact |
| `frontend/src/modules/ysq/YsqModule.tsx` | component | request-response | `frontend/src/modules/checkin/CheckinModule.tsx` | exact |
| `frontend/src/modules/ysq/YsqSummary.tsx` | component | request-response | `frontend/src/modules/checkin/CheckinSummary.tsx` | exact |
| `frontend/src/modules/goals/constants.ts` | utility | — | `frontend/src/modules/goals/constants.ts` (extend) | exact |
| `frontend/src/modules/beliefs_act/constants.ts` | utility | — | `frontend/src/modules/goals/constants.ts` | role-match |
| `frontend/src/modules/obstacles/constants.ts` | utility | — | `frontend/src/modules/goals/constants.ts` | role-match |

---

## Pattern Assignments

### `backend/app/modules/checkin.py` (model/module, CRUD)

**Analog:** `backend/app/modules/values.py`

**File-level docstring + imports pattern** (lines 1-18):
```python
"""Checkin module — weekly PHQ-9 / GAD-7 check-in entries.

Reference pattern: values.py. Mirror the structure exactly:
  - Pydantic model for item shape
  - Pydantic model for module data
  - default_data() producing a fresh empty state
  - migrations dict keyed by target schema_version
  - a single SPEC exported at the bottom
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .registry import ModuleSpec
```

**Core pattern — item model + data model + default_data + migrations + SPEC** (lines 20-60, values.py):
```python
class ValueItem(BaseModel):
    id: str
    label: str
    weight: int = Field(default=0, ge=0, le=5)
    note: str = ""

class ValuesData(BaseModel):
    selected: list[ValueItem] = Field(default_factory=list)
    intentions: list[Intention] = Field(default_factory=list)
    reflection: str = ""

def default_data() -> dict[str, Any]:
    return ValuesData().model_dump(mode="json")

migrations: dict[int, Any] = {
    # 2: lambda d: {**d, "new_field": []},
}

SPEC = ModuleSpec(
    id="values",
    title="Werte",
    phase_num="01",
    order=10,
    schema_version=1,
    data_schema=ValuesData,
    default_data=default_data,
    migrations=migrations,
)
```

**Checkin-specific adaptation** — mirror `frontend/src/modules/checkin/types.ts` exactly:
```python
# CheckinEntry mirrors CheckinData TypeScript interface (types.ts lines 1-11)
class CheckinEntry(BaseModel):
    id: str
    timestamp: str
    phq9: list[int] = Field(default_factory=list)
    gad7: list[int] = Field(default_factory=list)
    note: str = ""

class CheckinData(BaseModel):
    entries: list[CheckinEntry] = Field(default_factory=list)
```

**Key conventions:**
- `Optional` fields use `= Field(default_factory=list)` or `= ""` — never `= None` unless genuinely nullable
- `model_dump(mode="json")` in `default_data()` ensures UUID/datetime serialisation

---

### `backend/app/modules/ysq.py` (model/module, CRUD)

**Analog:** `backend/app/modules/values.py`

**Same file-level structure as checkin.py above.** YSQ-specific Pydantic models:

```python
class YsqData(BaseModel):
    # null = no committed result yet; populated on "Abschließen"
    answers: list[int | None] | None = None
    # null = no in-progress session; populated while questionnaire is open
    draft: list[int | None] | None = None
    # key = schema index string "0"–"17"; value = free-text note
    notes: dict[str, str] = Field(default_factory=dict)

def default_data() -> dict[str, Any]:
    return YsqData().model_dump(mode="json")

migrations: dict[int, Any] = {}

SPEC = ModuleSpec(
    id="ysq",
    title="Schemafragebögen (YSQ)",
    phase_num="02",
    order=20,          # after checkin (5), before beliefs_schema — check existing orders
    schema_version=1,
    data_schema=YsqData,
    default_data=default_data,
    migrations=migrations,
)
```

**Note on order values:** Read all existing SPEC `.order` fields before finalising. `values.SPEC.order = 10` (verified). Assign `checkin.SPEC.order = 5` and `ysq.SPEC.order = 20` or adjust after reading other module orders.

---

### `backend/app/modules/registry.py` — `_build_modules()` modification

**Analog:** self — `backend/app/modules/registry.py` lines 43-55

**Current state** (lines 43-55):
```python
def _build_modules() -> list[ModuleSpec]:
    from . import beliefs_act, beliefs_schema, goals, obstacles, orientation, values

    specs = [
        orientation.SPEC,
        values.SPEC,
        beliefs_schema.SPEC,
        beliefs_act.SPEC,
        goals.SPEC,
        obstacles.SPEC,
    ]
    specs.sort(key=lambda s: s.order)
    return specs
```

**Modified state — add checkin and ysq imports and SPECs:**
```python
def _build_modules() -> list[ModuleSpec]:
    from . import beliefs_act, beliefs_schema, checkin, goals, obstacles, orientation, values, ysq

    specs = [
        orientation.SPEC,
        values.SPEC,
        checkin.SPEC,        # CONT-01
        beliefs_schema.SPEC,
        beliefs_act.SPEC,
        goals.SPEC,
        obstacles.SPEC,
        ysq.SPEC,            # CONT-02
    ]
    specs.sort(key=lambda s: s.order)
    return specs
```

---

### `frontend/src/modules/ysq/types.ts` (model)

**Analog:** `frontend/src/modules/checkin/types.ts` (lines 1-11)

**Checkin types pattern** (lines 1-11):
```typescript
export interface CheckinEntry {
  id: string;
  timestamp: string;
  phq9: number[];
  gad7: number[];
  note: string;
}

export interface CheckinData {
  entries: CheckinEntry[];
}
```

**YSQ-specific types** (copy structure, adapt fields):
```typescript
// null = item skipped or not yet answered
export type YsqAnswer = number | null;

export interface YsqData {
  // Committed result — null until user clicks "Abschließen" for the first time
  // Length 90, indexed [schemaIdx * 5 + itemIdx]
  answers: YsqAnswer[] | null;
  // In-progress draft — null when no questionnaire session is active
  // Same shape as answers; cleared after commit
  draft: YsqAnswer[] | null;
  // Key = schema index string "0"–"17"; value = free-text note
  notes: Record<string, string>;
}
```

---

### `frontend/src/modules/ysq/constants.ts` (utility)

**Analog:** `frontend/src/modules/beliefs_schema/constants.ts` (lines 1-195)

**Pattern** — export a typed interface then an array of structs, plus a lookup Map:
```typescript
// beliefs_schema/constants.ts lines 1-10
export interface SchemaInfo {
  id: string;
  label: string;
  coreBeliefText: string;
  description: string;
  typicalTrigger: string;
  guidedQuestions: string[];
}

export const SCHEMAS: SchemaInfo[] = [ ... ];
export const SCHEMA_MAP = new Map(SCHEMAS.map((s) => [s.id, s]));
```

**YSQ-specific adaptation:**
```typescript
export interface YsqSchema {
  id: string;           // e.g. "abandonment" — reuse ids from beliefs_schema/constants.ts where overlap exists
  label: string;        // German schema name
  items: string[];      // exactly 5 items (texts from reference/kompass.html — BLOCKED until file on disk)
}

// One entry per schema, 18 total, ordered to match answer array indexing (schemaIdx * 5)
export const YSQ_SCHEMAS: YsqSchema[] = [
  // BLOCKED — populate from reference/kompass.html
];

// Max score per schema — derive from items.length * maxItemScore
// Verify exact scale endpoint (1–4 or 1–6) from reference/kompass.html
export const YSQ_MAX_ITEM_SCORE = 4; // ASSUMED — verify from reference/kompass.html
export const YSQ_MAX_SCHEMA_SCORE = 5 * YSQ_MAX_ITEM_SCORE;

export const YSQ_SCHEMA_MAP = new Map(YSQ_SCHEMAS.map((s, i) => [String(i), s]));
```

**Schema id reuse:** The 14 schema IDs in `beliefs_schema/constants.ts` (e.g. `abandonment`, `mistrust`, `defectiveness`) should be reused in `YSQ_SCHEMAS` where they match. The 4 YSQ-exclusive schemas need new IDs — source from `reference/kompass.html`.

---

### `frontend/src/modules/ysq/index.ts` (config)

**Analog:** `frontend/src/modules/checkin/index.ts` (lines 1-18)

**Checkin index pattern** (full file):
```typescript
import type { ModuleDef } from "../registry";
import { CheckinModule } from "./CheckinModule";
import { CheckinSummary } from "./CheckinSummary";
import type { CheckinData } from "./types";

const defaultData = (): CheckinData => ({ entries: [] });

export const checkinModule: ModuleDef<CheckinData> = {
  id: "checkin",
  title: "Wochen-Check-in",
  phaseNum: "W",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: CheckinModule,
  SummaryBlock: CheckinSummary,
};
```

**YSQ adaptation:**
```typescript
import type { ModuleDef } from "../registry";
import { YsqModule } from "./YsqModule";
import { YsqSummary } from "./YsqSummary";
import type { YsqData } from "./types";

const defaultData = (): YsqData => ({
  answers: null,
  draft: null,
  notes: {},
});

export const ysqModule: ModuleDef<YsqData> = {
  id: "ysq",
  title: "Schemafragebögen (YSQ)",
  phaseNum: "02",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: YsqModule,
  SummaryBlock: YsqSummary,
};
```

---

### `frontend/src/modules/ysq/YsqModule.tsx` (component, request-response)

**Analog:** `frontend/src/modules/checkin/CheckinModule.tsx`

**Imports pattern** (lines 1-22, CheckinModule.tsx):
```typescript
import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { PhaseHeader } from "../../components/PhaseHeader";
import type { ModuleProps } from "../registry";
import { ... } from "./constants";
import type { CheckinData, CheckinEntry } from "./types";
```

**Mode state machine — initialization** (lines 65-68, CheckinModule.tsx):
```typescript
// CheckinModule uses: "overview" | "new"
// YsqModule adapts to: "overview" | "questionnaire"
const [mode, setMode] = useState<"overview" | "questionnaire">(() =>
  data.entries.length === 0 ? "new" : "overview",
);
```

**YSQ-specific mode init** (adapts the pattern with draft-resume logic):
```typescript
const [mode, setMode] = useState<"overview" | "questionnaire">(() => {
  if (data.draft != null) return "questionnaire"; // resume in-progress
  if (data.answers != null) return "overview";    // show results
  return "questionnaire";                         // fresh start
});
const [currentSchemaIdx, setCurrentSchemaIdx] = useState<number>(() => {
  if (data.draft == null) return 0;
  // Resume at first schema page with no answers
  for (let i = 0; i < 18; i++) {
    const slice = data.draft.slice(i * 5, i * 5 + 5);
    if (slice.every((v) => v === null)) return i;
  }
  return 17;
});
// Local draft for current questionnaire session
const [localDraft, setLocalDraft] = useState<(number | null)[]>(() =>
  data.draft ?? Array(90).fill(null),
);
```

**ScaleRow component** (lines 28-62, CheckinModule.tsx) — reuse directly for YSQ answer buttons:
```typescript
function ScaleRow({
  question,
  value,
  onChange,
}: {
  question: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-4 border-b border-line-soft last:border-b-0">
      <p className="text-ink text-sm leading-relaxed mb-3">{question}</p>
      <div className="flex flex-wrap gap-2">
        {ANSWER_SCALE.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                active
                  ? "bg-ink text-paper border-ink"
                  : "border-line-soft text-ink-soft hover:border-ink-soft"
              }`}
            >
              <span className="font-mono mr-2 text-xs">{opt.value}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Commit draft on "Abschließen":**
```typescript
function commit() {
  if (localDraft == null) return;
  onChange({ ...data, answers: localDraft, draft: null });
  setMode("overview");
}
```

**Persist on navigation** — call onChange on every schema-page transition:
```typescript
function goNext() {
  const updatedDraft = [...localDraft];
  onChange({ ...data, draft: updatedDraft });   // persist before advancing
  setCurrentSchemaIdx((i) => Math.min(i + 1, 17));
}
function goBack() {
  const updatedDraft = [...localDraft];
  onChange({ ...data, draft: updatedDraft });   // persist before going back
  setCurrentSchemaIdx((i) => Math.max(i - 1, 0));
}
```

**CSS bar chart — results view** (adapted from 02-UI-SPEC.md / TrendChart.tsx color constants):
```tsx
// Color map mirrors TONE_STROKE in TrendChart.tsx (lines 15-18)
function barColor(score: number | null): string {
  if (score === null) return "var(--line)";    // skipped
  if (score >= 16) return "var(--accent)";
  if (score >= 11) return "var(--ocean)";
  return "var(--sage)";
}

// Bar row — horizontal flex, no click handler (D-09)
<li className="border-b border-line-soft last:border-b-0">
  <div className="flex items-center gap-4 py-3">
    <span className="text-sm text-ink min-w-[140px] shrink-0">{schema.label}</span>
    <div className="flex-1 bg-paper-3 rounded-sm h-3 overflow-hidden">
      {score !== null && (
        <div
          className="h-full rounded-sm transition-all"
          style={{
            width: `${(score / YSQ_MAX_SCHEMA_SCORE) * 100}%`,
            backgroundColor: barColor(score),
          }}
        />
      )}
    </div>
    <span className="text-xs font-mono text-ink-faint ml-2 w-8 text-right shrink-0">
      {score ?? "–"}
    </span>
  </div>
  {/* Note field — always visible inline, no accordion (D-10) */}
  <input
    type="text"
    maxLength={200}
    value={data.notes[String(schemaIdx)] ?? ""}
    onChange={(e) =>
      onChange({ ...data, notes: { ...data.notes, [String(schemaIdx)]: e.target.value } })
    }
    placeholder="Notiz zu diesem Schema (optional)"
    className="w-full bg-paper border border-line px-3 py-1.5 rounded-sm text-ink text-sm placeholder:text-ink-faint focus:outline-none focus:border-ink-soft mt-1 mb-3"
  />
</li>
```

**Progress bar** (from 02-UI-SPEC.md):
```tsx
<div className="h-0.5 bg-line-soft rounded-full mt-2 mb-6">
  <div
    className="h-full bg-ink-soft rounded-full"
    style={{ width: `${(currentSchemaIdx / 18) * 100}%` }}
  />
</div>
```

**Module page wrapper** (standard — from CLAUDE.md + CheckinModule.tsx line 127):
```tsx
<div className="max-w-3xl mx-auto px-6 py-12">
  <PhaseHeader phaseNum="02" title="Schemafragebögen (YSQ)" subtitle="..." />
  ...
</div>
```

---

### `frontend/src/modules/ysq/YsqSummary.tsx` (component, request-response)

**Analog:** `frontend/src/modules/checkin/CheckinSummary.tsx`

**Empty state pattern** (lines 16-20, CheckinSummary.tsx):
```tsx
if (data.entries.length === 0) {
  return (
    <p className="text-ink-faint italic">
      Noch kein Check-in erfasst. Starte im Modul „Wochen-Check-in".
    </p>
  );
}
```

**YSQ empty state — no committed answers yet:**
```tsx
if (data.answers == null) {
  return (
    <p className="text-ink-faint italic">
      Noch kein Fragebogen abgeschlossen. Starte im Modul{' '}
      {'„Schemafragebögen (YSQ)"'}.
    </p>
  );
}
```

**Summary content — top 3 schemas by score** (no TrendChart needed, use simple list):
```tsx
// Compute per-schema scores, sort descending, take top 3
const scored = YSQ_SCHEMAS.map((schema, i) => {
  const items = data.answers!.slice(i * 5, i * 5 + 5);
  const allNull = items.every((v) => v === null);
  const score = allNull ? null : items.reduce((sum, v) => sum + (v ?? 0), 0);
  return { schema, score };
}).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

const top3 = scored.filter((s) => s.score !== null).slice(0, 3);
```

**Props interface** — CheckinSummary uses `{ data: CheckinData }` not `SummaryProps<T>`:
```typescript
// CheckinSummary.tsx lines 11-13 — minimal props interface
interface Props {
  data: CheckinData;
}
export function CheckinSummary({ data }: Props) { ... }
```

**YSQ adaptation** — same minimal shape:
```typescript
interface Props {
  data: YsqData;
}
export function YsqSummary({ data }: Props) { ... }
```

---

### `frontend/src/modules/goals/constants.ts` — extend with GOAL_PROMPTS (CONT-06)

**Current file** (`frontend/src/modules/goals/constants.ts`, lines 1-14):
```typescript
import type { Horizon, GoalStatus } from "./types";

export const HORIZON_LABEL: Record<Horizon, string> = {
  "30days": "30 Tage",
  quarter: "3 Monate",
  year: "1 Jahr",
  longer: "länger",
};

export const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Aktiv",
  achieved: "Erreicht",
  paused: "Pausiert",
};
```

**Inline array to extract** (`frontend/src/modules/goals/GoalsModule.tsx`, lines 14-20):
```typescript
const GOAL_PROMPTS = [
  "Was genau willst du erreichen — so konkret, dass du es beschreiben könntest?",
  "Woran wirst du erkennen, dass du es erreicht hast?",
  "Warum ist dieses Ziel wichtig für dich — welchen Wert lebt es?",
  "Was könnte dich aufhalten? (Das ist Vorbereitung, keine Niederlage.)",
  "Was wäre dein allererster Schritt — heute oder diese Woche?",
];
```

**Action:** Append `export const GOAL_PROMPTS: string[] = [...]` to `goals/constants.ts`. Remove inline declaration from `GoalsModule.tsx`. Add import: `import { HORIZON_LABEL, STATUS_LABEL, GOAL_PROMPTS } from "./constants";`.

---

### `frontend/src/modules/beliefs_act/constants.ts` — new file, DEFUSION_EXAMPLES (CONT-06)

**Analog for new file shape:** `frontend/src/modules/goals/constants.ts`

**Inline array to extract** (`frontend/src/modules/beliefs_act/BeliefsActModule.tsx`, lines 10-16):
```typescript
const DEFUSION_EXAMPLES = [
  "Ich bemerke, dass ich den Gedanken habe, dass …",
  "Mein Kopf erzählt mir gerade die Geschichte von …",
  "Danke, Kopf — ich kenne diesen Gedanken. Ich muss ihm aber nicht folgen.",
  "Ich beobachte, wie dieser Gedanke kommt und geht — wie eine Wolke.",
  "Das ist nur ein Gedanke, keine Tatsache.",
];
```

**New file content:**
```typescript
export const DEFUSION_EXAMPLES: string[] = [
  "Ich bemerke, dass ich den Gedanken habe, dass …",
  "Mein Kopf erzählt mir gerade die Geschichte von …",
  "Danke, Kopf — ich kenne diesen Gedanken. Ich muss ihm aber nicht folgen.",
  "Ich beobachte, wie dieser Gedanke kommt und geht — wie eine Wolke.",
  "Das ist nur ein Gedanke, keine Tatsache.",
];
```

**Action:** Create `frontend/src/modules/beliefs_act/constants.ts`. Remove inline declaration from `BeliefsActModule.tsx`. Add import: `import { DEFUSION_EXAMPLES } from "./constants";`.

---

### `frontend/src/modules/obstacles/constants.ts` — new file, EXPLORATION_PROMPTS (CONT-06)

**Analog:** `frontend/src/modules/goals/constants.ts`

**Inline array to extract** (`frontend/src/modules/obstacles/ObstaclesModule.tsx`, lines 12-18):
```typescript
const EXPLORATION_PROMPTS = [
  "Wie alt fühlst du dich in diesem Moment, wenn das Hindernis auftaucht?",
  "Gibt es eine innere Stimme — klingt sie vertraut? Wessen Stimme könnte das sein?",
  "Was hat der Teil von dir, der dieses Muster entwickelt hat, damals gebraucht?",
  "Was wäre ein kleiner Schritt, der dir zeigt, dass du diesem Muster nicht folgen musst?",
  "Wie kannst du dir selbst in diesem Moment Mitgefühl entgegenbringen?",
];
```

**New file content:**
```typescript
export const EXPLORATION_PROMPTS: string[] = [
  "Wie alt fühlst du dich in diesem Moment, wenn das Hindernis auftaucht?",
  "Gibt es eine innere Stimme — klingt sie vertraut? Wessen Stimme könnte das sein?",
  "Was hat der Teil von dir, der dieses Muster entwickelt hat, damals gebraucht?",
  "Was wäre ein kleiner Schritt, der dir zeigt, dass du diesem Muster nicht folgen musst?",
  "Wie kannst du dir selbst in diesem Moment Mitgefühl entgegenbringen?",
];
```

**Action:** Create `frontend/src/modules/obstacles/constants.ts`. Remove inline declaration from `ObstaclesModule.tsx`. Add import: `import { EXPLORATION_PROMPTS } from "./constants";`.

---

### `frontend/src/modules/registry.ts` — add ysqModule (CONT-03)

**Current state** (lines 1-49):
```typescript
import { checkinModule } from "./checkin";
// ...other imports...

export const modules: ModuleDef[] = [
  checkinModule,
  orientationModule,
  valuesModule,
  beliefsSchemaModule,
  beliefsActModule,
  goalsModule,
  obstaclesModule,
  syntheseModule,
];
```

**Modification — add ysqModule import and array entry:**
```typescript
import { ysqModule } from "./ysq";   // add at top with other imports

// Add to modules array after checkinModule (both are structured questionnaires):
export const modules: ModuleDef[] = [
  checkinModule,
  ysqModule,           // CONT-03: insert here
  orientationModule,
  valuesModule,
  beliefsSchemaModule,
  beliefsActModule,
  goalsModule,
  obstaclesModule,
  syntheseModule,
];
```

---

## Shared Patterns

### Module page wrapper
**Source:** `frontend/src/modules/checkin/CheckinModule.tsx` line 127, CLAUDE.md conventions
**Apply to:** `YsqModule.tsx`
```tsx
<div className="max-w-3xl mx-auto px-6 py-12">
  <PhaseHeader phaseNum="..." title="..." subtitle="..." />
  {/* content */}
</div>
```

### Card component for content sections
**Source:** `frontend/src/modules/checkin/CheckinModule.tsx` lines 144, 155, 261, 280, 299
**Apply to:** `YsqModule.tsx` — wrap each schema page and results section in `<Card>`
```tsx
import { Card } from "../../components/Card";
<Card className="mb-6">...</Card>
```

### Button styling conventions
**Source:** `frontend/src/modules/checkin/CheckinModule.tsx` lines 213-219, 319-336
**Apply to:** `YsqModule.tsx` navigation buttons
```tsx
{/* Primary action */}
<button
  type="button"
  className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors"
>
  Abschließen
</button>
{/* Secondary action */}
<button
  type="button"
  className="px-4 py-2 text-ink-soft hover:text-ink transition-colors"
>
  Zurück
</button>
{/* Disabled state */}
className="... disabled:bg-paper-3 disabled:text-ink-faint disabled:cursor-not-allowed"
```

### always `type="button"` on buttons
**Source:** CLAUDE.md conventions — "Always use `type="button"` on `<button>` elements"
**Apply to:** All new component files

### Severity color palette
**Source:** `frontend/src/components/TrendChart.tsx` lines 15-18
**Apply to:** `YsqModule.tsx` bar chart `barColor()` function
```typescript
const TONE_STROKE: Record<string, string> = {
  sage: "#5b6f4a",    // var(--sage) — low severity
  ocean: "#3a5a6e",   // var(--ocean) — medium severity
  accent: "#b94e2b",  // var(--accent) — high severity
};
// Use CSS variables in inline styles for YSQ bars:
// "var(--sage)", "var(--ocean)", "var(--accent)", "var(--line)" (skipped)
```

### Small caps section labels
**Source:** CLAUDE.md styling conventions, used throughout (e.g. CheckinModule.tsx line 145)
**Apply to:** `YsqModule.tsx`, `YsqSummary.tsx`
```tsx
<div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-2">
  Schema-Ergebnisse
</div>
```

### onChange full-replacement contract
**Source:** CLAUDE.md conventions — "`onChange` is always a full replacement (not a patch)"
**Apply to:** All onChange calls in `YsqModule.tsx`
```typescript
onChange({ ...data, draft: updatedDraft });         // correct
onChange({ ...data, answers: localDraft, draft: null }); // correct on commit
// NEVER: onChange({ draft: updatedDraft })          // wrong — partial patch
```

### Backend: `from __future__ import annotations`
**Source:** CLAUDE.md conventions — "at top of every backend file"
**Apply to:** `checkin.py`, `ysq.py`

### Backend: `model_dump(mode="json")` in default_data
**Source:** `backend/app/modules/values.py` line 41
**Apply to:** `checkin.py`, `ysq.py` `default_data()` functions
```python
def default_data() -> dict[str, Any]:
    return CheckinData().model_dump(mode="json")
```

### Tests: AsyncClient + in-memory SQLite fixture
**Source:** `backend/tests/conftest.py` (full file)
**Apply to:** New test cases for checkin and ysq in `backend/tests/test_modules.py`
```python
# Test pattern from conftest.py — use client + auth_headers + test_engine fixtures
@pytest.mark.asyncio
async def test_checkin_roundtrip(client, auth_headers):
    put_resp = await client.put(
        "/api/modules/checkin",
        json={"entries": []},
        headers=auth_headers,
    )
    assert put_resp.status_code == 200
    get_resp = await client.get("/api/modules/checkin", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["entries"] == []
```

---

## No Analog Found

No files in this phase lack an analog. All new files have direct structural matches in the existing codebase.

---

## Blocking Dependencies

| File | Blocked By | Action Required |
|------|-----------|----------------|
| `frontend/src/modules/ysq/constants.ts` — item texts | `reference/kompass.html` not on disk | Planner MUST gate the constants population task on user delivering this file. Backend schema and component skeleton can proceed independently. |
| `YSQ_MAX_ITEM_SCORE` constant | `reference/kompass.html` — scale endpoint (1–4 vs 1–6) unconfirmed | Use placeholder `4` with a TODO comment; update after file delivered. |

---

## Metadata

**Analog search scope:** `backend/app/modules/`, `frontend/src/modules/`, `frontend/src/components/`, `backend/tests/`
**Files scanned:** 14 source files read directly
**Pattern extraction date:** 2026-04-21
