# Phase 5: Schema-Guided Insights — Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 11 (7 primary + 4 test/config)
**Analogs found:** 10 / 11 (vitest.config.ts has no analog — first Vitest config in project)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `frontend/src/modules/ysq/hints.ts` | constants | transform | `frontend/src/modules/beliefs_schema/constants.ts` | exact |
| `frontend/src/modules/synthese/constants.ts` | constants | transform | `frontend/src/modules/goals/constants.ts` | exact |
| `frontend/src/modules/synthese/InsightsBlock.tsx` | component | request-response | `frontend/src/modules/values/ValuesSummary.tsx` | role-match |
| `frontend/src/modules/synthese/SyntheseModule.tsx` | component | request-response | itself (modify) | exact |
| `frontend/src/modules/registry.ts` | config | — | itself (modify) | exact |
| `frontend/src/App.tsx` | provider/orchestrator | event-driven | itself (modify) | exact |
| `frontend/src/modules/goals/GoalsModule.tsx` | component | CRUD | itself (modify) | exact |
| `frontend/package.json` | config | — | itself (modify) | exact |
| `frontend/vitest.config.ts` | config | — | `frontend/vite.config.ts` | partial |
| `frontend/src/modules/ysq/hints.test.ts` | test | transform | `frontend/src/modules/checkin/scoring.ts` (pattern only) | partial |
| `frontend/src/lib/insights.test.ts` | test + utility | transform | `frontend/src/modules/checkin/scoring.ts` | role-match |

---

## Pattern Assignments

### `frontend/src/modules/ysq/hints.ts` (constants, transform)

**Analog:** `frontend/src/modules/beliefs_schema/constants.ts`

**Imports pattern** (lines 1–0 — no imports needed, pure constants):
```typescript
// No imports — pure TypeScript interface + const export
// Pattern: interface first, then array, then Map lookup
```

**Interface + array + map pattern** (analog: `beliefs_schema/constants.ts` lines 1–8 + 195):
```typescript
// beliefs_schema/constants.ts — exact pattern to copy:
export interface SchemaInfo {
  id: string;
  label: string;
  coreBeliefText: string;
  // ... fields
}

export const SCHEMAS: SchemaInfo[] = [ /* ... entries ... */ ];

export const SCHEMA_MAP = new Map(SCHEMAS.map((s) => [s.id, s]));
```

**New file uses same shape — different interface name and fields:**
```typescript
// frontend/src/modules/ysq/hints.ts — shape to implement:
export interface SchemaHint {
  schemaId: string;           // matches YsqSchema.id from ysq/constants.ts
  healingDirection: string;
  goalSuggestions: string[];
  obstacleHints: string[];
}

export const YSQ_HINTS: SchemaHint[] = [ /* 18 entries */ ];

export const YSQ_HINTS_MAP = new Map(YSQ_HINTS.map((h) => [h.schemaId, h]));
```

**The 18 schema IDs to cover** (from `ysq/constants.ts` lines 9–207, in order):
`abandonment`, `mistrust`, `emotional_deprivation`, `defectiveness`, `social_isolation`,
`dependence`, `vulnerability`, `enmeshment`, `failure`, `entitlement`,
`insufficient_self_control`, `subjugation`, `self_sacrifice`, `approval_seeking`,
`negativity`, `emotional_inhibition`, `unrelenting_standards`, `punitiveness`

**YSQ_HINTS array must be in the same order as `YSQ_SCHEMAS`** (same order = same array index alignment). The Map is for O(1) access by ID.

---

### `frontend/src/modules/synthese/constants.ts` (constants, transform)

**Analog:** `frontend/src/modules/goals/constants.ts`

**Full analog file** (goals/constants.ts lines 1–23):
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

export const GOAL_PROMPTS: string[] = [ /* ... */ ];
```

**New file pattern — no imports needed (only string constants):**
```typescript
// frontend/src/modules/synthese/constants.ts — shape to implement:
export const INSIGHTS_SECTION_HEADING = "Hinweise";

export const VALUES_GAP_HINT_TEXT =
  "Dieser Wert wird wenig gelebt — ein möglicher Bereich für ein Ziel.";

export const SCHEMA_INSIGHTS_GOAL_SUGGESTIONS_LABEL = "Zielvorschläge";
export const SCHEMA_INSIGHTS_OBSTACLES_LABEL = "Mögliche Hindernisse";
export const VALUES_GAP_SECTION_LABEL = "Unterversorgte Wertebereiche";
```

---

### `frontend/src/modules/synthese/InsightsBlock.tsx` (component, request-response)

**Analog:** `frontend/src/modules/values/ValuesSummary.tsx` (read-only display component over allData)

**Imports pattern** (analog: `ValuesSummary.tsx` line 1; `SyntheseModule.tsx` lines 1–25):

`ValuesSummary.tsx` imports (lines 1–2):
```typescript
import type { ValuesData } from "./types";
```

`SyntheseModule.tsx` cross-module imports (lines 1–25) — pattern for InsightsBlock:
```typescript
import { Card } from "../../components/Card";
import { YSQ_SCHEMAS, YSQ_MAX_SCHEMA_SCORE } from "../ysq/constants";
import type { YsqData } from "../ysq/types";
import type { ValuesData, ValueItem } from "../values/types";
import type { AllData } from "../../types";
import { YSQ_HINTS_MAP } from "../ysq/hints";
import {
  VALUES_GAP_HINT_TEXT,
  INSIGHTS_SECTION_HEADING,
  SCHEMA_INSIGHTS_GOAL_SUGGESTIONS_LABEL,
  SCHEMA_INSIGHTS_OBSTACLES_LABEL,
  VALUES_GAP_SECTION_LABEL,
} from "./constants";
```

**Props interface pattern** (analog: `ValuesSummary.tsx` lines 4–6):
```typescript
// ValuesSummary uses a local Props interface:
interface Props {
  data: ValuesData;
}
// InsightsBlock uses allData + optional callback:
interface Props {
  allData: AllData;
  onNavigateToGoals?: (prefill: { title: string; description: string }) => void;
}
```

**Guard pattern** (analog: `ValuesSummary.tsx` lines 24–26):
```typescript
// ValuesSummary guard:
export function ValuesSummary({ data }: Props) {
  if (data.selected.length === 0) {
    return <p className="text-ink-faint italic">Noch keine Werte gewählt.</p>;
  }
// InsightsBlock guard — returns null (no placeholder):
export function InsightsBlock({ allData, onNavigateToGoals }: Props) {
  const ysqData = allData?.ysq as YsqData | undefined;
  if (!ysqData?.answers) return null;
```

**Score computation pattern** — extract from `SyntheseModule.tsx` lines 170–199 (`computeYsqDelta`):
```typescript
// Source: SyntheseModule.tsx lines 180–198
// Pattern for per-schema score from flat answers array:
YSQ_SCHEMAS.map((schema, i) => {
  const items = answersA.slice(i * 5, i * 5 + 5);
  return items.every((v) => v === null)
    ? null
    : items.reduce<number>((s, v) => s + (v ?? 0), 0);
});
// Copy this exact guard: items.every((v) => v === null) → skip schema
// Copy this exact reduce: s + (v ?? 0) → null items count as 0
```

**Top-3 selection pattern** — derive from `computeYsqDelta` and `ValuesSummary.tsx`:
```typescript
// Pattern (new — no exact analog exists, but components of it exist):
function computeSchemaScores(
  answers: (number | null)[],
): Array<{ schema: YsqSchema; score: number }> {
  return YSQ_SCHEMAS.map((schema, i) => {
    const items = answers.slice(i * 5, i * 5 + 5);
    if (items.every((v) => v === null)) return null;
    const score = items.reduce<number>((s, v) => s + (v ?? 0), 0);
    return { schema, score };
  }).filter((x): x is { schema: YsqSchema; score: number } => x !== null);
}
// Then sort + slice: .sort((a, b) => b.score - a.score).slice(0, 3)
```

**Values gap pattern** (analog: `ValuesSummary.tsx` lines 29–33 and `SyntheseModule.tsx` lines 60–74):
```typescript
// ValuesSummary.tsx lines 29–33 — exact gap computation:
const byGap = [...data.selected]
  .map((v) => ({ ...v, gap: v.weight - v.living }))
  .sort((a, b) => b.gap - a.gap || b.weight - a.weight);
const topGaps = byGap.filter((v) => v.gap >= 2).slice(0, 5);

// buildTextReport SyntheseModule.tsx line 70 — gap badge label:
v.gap >= 2 ? `  (Lücke ${v.gap})` : ""
// → badge text: `Lücke ${gap}` (no units — existing convention)
```

**Card component usage** (analog: `SyntheseModule.tsx` lines 343–353):
```typescript
// SyntheseModule.tsx — Card wraps each summary block:
<Card key={m.id} className="mb-6">
  <div className="flex items-baseline gap-3 mb-4">
    <span className="text-ink-faint text-xs tracking-[0.2em] uppercase">
      Phase {m.phaseNum}
    </span>
    <h2 className="display text-2xl text-ink">{m.title}</h2>
  </div>
  <Summary data={data} allData={allData} />
</Card>
// InsightsBlock uses Card with no className (default bg-paper-2 border border-line-soft rounded-sm p-6):
<Card>
  {/* schema name: display text-2xl text-accent (accent, not text-ink) */}
</Card>
```

**Section label pattern** (analog: `ValuesSummary.tsx` lines 39–41, `SyntheseModule.tsx` line 411):
```typescript
// ValuesSummary.tsx lines 39–41:
<div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-3">
  Größte Lücken — Ansatzpunkte
</div>
// SyntheseModule.tsx line 411 (snapshot section label):
<p className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-4">
  Neuen Snapshot erstellen
</p>
// Use: text-xs tracking-[0.15em] uppercase text-ink-faint mb-2 (or mb-4)
```

**Button pattern** (analog: `GoalsModule.tsx` line 64–71):
```typescript
// GoalsModule.tsx — text-style inline button:
<button
  type="button"
  onClick={() => setShowGoalGuide((v) => !v)}
  className="text-sm text-ink-soft hover:text-ink transition-colors flex items-center gap-2"
>
// InsightsBlock "Als Ziel erkunden" — ocean tone instead of ink-soft:
<button
  type="button"
  onClick={() => onNavigateToGoals?.({ title: schema.label, description: hint.goalSuggestions[0] })}
  className="text-sm text-ocean hover:text-ink transition-colors text-left"
>
  Als Ziel erkunden
</button>
```

**Left-border list pattern** (analog: `GoalsModule.tsx` lines 73–80):
```typescript
// GoalsModule.tsx lines 73–80 — left-border list:
<div className="mt-4 pl-4 border-l-2 border-line-soft space-y-2">
  {GOAL_PROMPTS.map((q, i) => (
    <p key={i} className="text-ink-soft text-sm leading-relaxed flex gap-2">
```
// InsightsBlock suggestion list:
// <ul className="space-y-1 border-l-2 border-line-soft pl-4 mb-4">
//   <li className="text-sm text-ink">...</li>

**Named export pattern** (analog: `ValuesSummary.tsx` line 24, `GoalsModule.tsx` line 14):
```typescript
// Both use named function exports (not default exports):
export function ValuesSummary({ data }: Props) { ... }
export function GoalsModule({ data, onChange, allData }: ModuleProps<GoalsData>) { ... }
// InsightsBlock:
export function InsightsBlock({ allData, onNavigateToGoals }: Props) { ... }
```

---

### `frontend/src/modules/synthese/SyntheseModule.tsx` (modify — component, request-response)

**Analog:** itself

**Current signature** (line 220):
```typescript
export function SyntheseModule({ allData }: ModuleProps<unknown>) {
```

**Modified signature** — accept extended ModuleProps with new optional prop:
```typescript
export function SyntheseModule({ allData, onNavigateToGoals }: ModuleProps<unknown>) {
```

**InsightsBlock import to add** (follow existing import block lines 1–25):
```typescript
import { InsightsBlock } from "./InsightsBlock";
```

**Placement** — after `dataModules.map(...)` loop (lines 339–353), before `<section className="mt-8 print:hidden">` (line 355):
```typescript
{/* existing: */}
{dataModules.map((m) => { ... })}

{/* NEW — Phase 5: */}
<InsightsBlock allData={allData} onNavigateToGoals={onNavigateToGoals} />

{/* existing: */}
<section className="mt-8 print:hidden">
```

---

### `frontend/src/modules/registry.ts` (modify — config)

**Analog:** itself

**Current `ModuleProps` interface** (lines 13–17):
```typescript
export interface ModuleProps<T> {
  data: T;
  onChange: (next: T) => void;
  allData: AllData;
}
```

**Modified — add one optional field:**
```typescript
export interface ModuleProps<T> {
  data: T;
  onChange: (next: T) => void;
  allData: AllData;
  onNavigateToGoals?: (prefill: { title: string; description: string }) => void;
}
```

No other changes to registry.ts.

---

### `frontend/src/App.tsx` (modify — orchestrator, event-driven)

**Analog:** itself

**Current state declarations** (lines 61–64):
```typescript
const [activeId, setActiveId] = useState(modules[0]?.id ?? "");
const [store, setStore] = useState<Store>(() => emptyStore());
const [importKey, setImportKey] = useState(0);
const fileRef = useRef<HTMLInputElement>(null);
```

**Add goalPrefill state** (after existing state declarations):
```typescript
const [goalPrefill, setGoalPrefill] = useState<{ title: string; description: string } | null>(null);
```

**Add handler function** (after existing `handleChange`, before `helpOpen` state, around line 102):
```typescript
function handleNavigateToGoals(prefill: { title: string; description: string }) {
  setGoalPrefill(prefill);
  setActiveId("goals");
  setTimeout(() => setGoalPrefill(null), 0);
}
```

**Current allData construction** (line 106):
```typescript
const allData = Object.fromEntries(modules.map((m) => [m.id, store[m.id]?.data]));
```

**Modified — inject prefill when goals is active:**
```typescript
const allData = {
  ...Object.fromEntries(modules.map((m) => [m.id, store[m.id]?.data])),
  ...(activeId === "goals" && goalPrefill ? { __goalPrefill: goalPrefill } : {}),
};
```

**Current component render** (lines 190–196):
```typescript
<active.Component
  data={state.data}
  onChange={handleChange(active.id)}
  allData={allData}
/>
```

**Modified — thread callback:**
```typescript
<active.Component
  data={state.data}
  onChange={handleChange(active.id)}
  allData={allData}
  onNavigateToGoals={handleNavigateToGoals}
/>
```

---

### `frontend/src/modules/goals/GoalsModule.tsx` (modify — component, CRUD)

**Analog:** itself

**Current imports** (lines 1–9):
```typescript
import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { PhaseHeader } from "../../components/PhaseHeader";
import { uid } from "../../lib/uid";
import type { ModuleProps } from "../registry";
import type { ValuesData } from "../values/types";
import { HORIZON_LABEL, STATUS_LABEL, GOAL_PROMPTS } from "./constants";
import type { Goal, GoalsData, GoalStatus, Horizon } from "./types";
```

**Modified imports — add useEffect:**
```typescript
import { useEffect, useMemo, useState } from "react";
```

**Current function signature** (line 14):
```typescript
export function GoalsModule({ data, onChange, allData }: ModuleProps<GoalsData>) {
```

**Add prefill useEffect** after existing state declarations (`openId`, `showGoalGuide`), before `valueOptions` useMemo. Type guard follows the Pitfall 4 pattern from RESEARCH.md:

```typescript
// Type guard for allData.__goalPrefill (avoids (as any) cast — Pitfall 4 in RESEARCH.md)
interface GoalPrefillData {
  title: string;
  description: string;
}

function isGoalPrefill(v: unknown): v is GoalPrefillData {
  return typeof v === "object" && v !== null && "title" in v && "description" in v;
}
```

Place the type guard + function **outside** the component function (file-level, after imports).

**useEffect inside GoalsModule** (after `const [showGoalGuide, setShowGoalGuide] = useState(false);`):
```typescript
useEffect(() => {
  const raw = (allData as Record<string, unknown>).__goalPrefill;
  if (!isGoalPrefill(raw)) return;
  const fresh: Goal = {
    id: uid(),
    title: raw.title,
    description: raw.description,
    value_refs: [],
    horizon: "quarter",
    first_step: "",
    status: "active",
  };
  onChange({ ...data, goals: [...data.goals, fresh] });
  setOpenId(fresh.id);
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

**Dependency array is intentionally empty** — runs once on mount. The `data` and `onChange` in the closure are the initial values; this is safe because prefill is a one-shot operation when GoalsModule first mounts after navigation.

---

### `frontend/package.json` (modify — config)

**Analog:** itself

**Current scripts** (lines 4–11):
```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "build:local": "tsc --noEmit && VITE_STORAGE=local vite build --outDir dist-local",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit"
},
```

**Add test script:**
```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "build:local": "tsc --noEmit && VITE_STORAGE=local vite build --outDir dist-local",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
},
```

**Current devDependencies** (lines 19–29):
```json
"devDependencies": {
  "@types/react": "^18.3.3",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^5.0.0",
  "autoprefixer": "^10.4.19",
  "postcss": "^8.4.40",
  "tailwindcss": "^3.4.7",
  "typescript": "^5.5.4",
  "vite": "^7.0.0",
  "vite-plugin-singlefile": "2.3.2"
}
```

**Add vitest:**
```json
"devDependencies": {
  ...existing...,
  "@vitest/ui": "^1.0.0",
  "jsdom": "^24.0.0",
  "vitest": "^1.0.0"
}
```

---

### `frontend/vitest.config.ts` (new — config)

**Analog:** `frontend/vite.config.ts` (closest config file — but different tool)

Read the existing vite.config.ts to understand the project's config file style:
```typescript
// Note: vite.config.ts not read in this session — but the pattern from RESEARCH.md is verified:
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

No imports of React plugin needed (no JSX in test files for Wave 0 unit tests).

---

### `frontend/src/modules/ysq/hints.test.ts` (new — test, transform)

**Analog:** `frontend/src/modules/checkin/scoring.ts` (utility pattern — closest to pure-function test target)

**Test file pattern** — no existing test files in project; follow Vitest conventions:
```typescript
import { describe, expect, it } from "vitest";
import { YSQ_HINTS, YSQ_HINTS_MAP } from "./hints";
import { YSQ_SCHEMAS } from "./constants";

describe("YSQ_HINTS", () => {
  it("contains exactly 18 entries", () => {
    expect(YSQ_HINTS).toHaveLength(18);
  });

  it("all YSQ_SCHEMAS IDs are present in YSQ_HINTS_MAP", () => {
    for (const schema of YSQ_SCHEMAS) {
      expect(YSQ_HINTS_MAP.has(schema.id), `Missing hint for schema: ${schema.id}`).toBe(true);
    }
  });

  it("every hint has non-empty healingDirection", () => {
    for (const hint of YSQ_HINTS) {
      expect(hint.healingDirection.trim().length).toBeGreaterThan(0);
    }
  });

  it("every hint has at least 1 goalSuggestion", () => {
    for (const hint of YSQ_HINTS) {
      expect(hint.goalSuggestions.length).toBeGreaterThanOrEqual(1);
    }
  });
});
```

---

### `frontend/src/lib/insights.test.ts` (new — test + utility, transform)

**Analog:** `frontend/src/modules/checkin/scoring.ts` (pure-function utility module)

The RESEARCH.md recommends collocating `getTop3Schemas` and `getValueGaps` as pure functions in `frontend/src/lib/insights.ts` (new utility file alongside `migrations.ts` and `uid.ts`).

**Utility file pattern** (analog: `frontend/src/lib/uid.ts` + `scoring.ts` for pure-function shape):

`uid.ts` is 1-3 lines. `scoring.ts` exports named pure functions with types. The new `insights.ts` follows `scoring.ts`'s pattern exactly:

```typescript
// frontend/src/lib/insights.ts — new utility (analog: scoring.ts)
import { YSQ_SCHEMAS } from "../modules/ysq/constants";
import type { YsqSchema } from "../modules/ysq/constants";
import type { ValueItem } from "../modules/values/types";

export function computeSchemaScore(answers: (number | null)[], schemaIdx: number): number | null {
  const items = answers.slice(schemaIdx * 5, schemaIdx * 5 + 5);
  if (items.every((v) => v === null)) return null;
  return items.reduce<number>((s, v) => s + (v ?? 0), 0);
}

export function getTop3Schemas(
  answers: (number | null)[],
): Array<{ schema: YsqSchema; score: number }> {
  return YSQ_SCHEMAS.map((schema, i) => {
    const score = computeSchemaScore(answers, i);
    if (score === null) return null;
    return { schema, score };
  })
    .filter((x): x is { schema: YsqSchema; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function getValueGaps(selected: ValueItem[]): ValueItem[] {
  return [...selected]
    .filter((v) => v.weight - v.living >= 2)
    .sort((a, b) => (b.weight - b.living) - (a.weight - a.living));
}
```

**Test file:**
```typescript
// frontend/src/lib/insights.test.ts
import { describe, expect, it } from "vitest";
import { computeSchemaScore, getTop3Schemas, getValueGaps } from "./insights";

describe("computeSchemaScore", () => {
  it("returns null when all 5 items are null", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    expect(computeSchemaScore(answers, 0)).toBeNull();
  });

  it("sums non-null items, treating null as 0", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    answers[0] = 6; answers[1] = 5; // schemaIdx 0, items 0+1
    // items 2,3,4 are null → count as 0
    expect(computeSchemaScore(answers, 0)).toBe(11);
  });
});

describe("getTop3Schemas", () => {
  it("returns at most 3 schemas", () => {
    const answers = Array(90).fill(3) as (number | null)[];
    expect(getTop3Schemas(answers)).toHaveLength(3);
  });

  it("returns empty array when all answers are null", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    expect(getTop3Schemas(answers)).toHaveLength(0);
  });

  it("top result has highest score", () => {
    const answers = Array(90).fill(1) as (number | null)[];
    // schema 0 (abandonment) gets all 6s — highest
    answers[0] = 6; answers[1] = 6; answers[2] = 6; answers[3] = 6; answers[4] = 6;
    const top3 = getTop3Schemas(answers);
    expect(top3[0].schema.id).toBe("abandonment");
    expect(top3[0].score).toBe(30);
  });
});

describe("getValueGaps", () => {
  it("filters items where weight - living >= 2", () => {
    const items = [
      { id: "a", label: "A", weight: 5, living: 2, note: "" }, // gap 3 ✓
      { id: "b", label: "B", weight: 3, living: 2, note: "" }, // gap 1 ✗
      { id: "c", label: "C", weight: 4, living: 1, note: "" }, // gap 3 ✓
    ];
    expect(getValueGaps(items)).toHaveLength(2);
  });

  it("sorts descending by gap size", () => {
    const items = [
      { id: "a", label: "A", weight: 5, living: 2, note: "" }, // gap 3
      { id: "b", label: "B", weight: 5, living: 1, note: "" }, // gap 4
    ];
    const result = getValueGaps(items);
    expect(result[0].id).toBe("b"); // larger gap first
  });
});
```

---

## Shared Patterns

### Named function exports (not default exports)
**Source:** `frontend/src/modules/values/ValuesSummary.tsx` line 24, `frontend/src/modules/goals/GoalsModule.tsx` line 14
**Apply to:** `InsightsBlock.tsx`, all modified components
```typescript
// All components use named exports:
export function InsightsBlock(...) { ... }
// NOT: export default function InsightsBlock(...) { ... }
```

### Section label typography
**Source:** `frontend/src/modules/values/ValuesSummary.tsx` lines 39–41, `frontend/src/modules/synthese/SyntheseModule.tsx` line 345
**Apply to:** `InsightsBlock.tsx` — all section labels
```typescript
// Consistent pattern throughout codebase:
className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-3"
// or mb-2, mb-4 depending on context — mb-3 is most common
```

### Card component usage
**Source:** `frontend/src/components/Card.tsx` lines 1–18
**Apply to:** `InsightsBlock.tsx`
```typescript
// Card.tsx signature:
export function Card({ children, className = "", as = "section" }: Props) {
  const Tag = as;
  return (
    <Tag className={`bg-paper-2 border border-line-soft rounded-sm p-6 ${className}`}>
      {children}
    </Tag>
  );
}
// Usage: <Card> or <Card className="mb-6"> — never add bg/border/rounded manually
```

### allData access pattern
**Source:** `frontend/src/modules/synthese/SyntheseModule.tsx` lines 244–248, `frontend/src/modules/goals/GoalsModule.tsx` lines 18–21
**Apply to:** `InsightsBlock.tsx`, `GoalsModule.tsx` (prefill read)
```typescript
// SyntheseModule.tsx lines 244–248 — cast with undefined fallback:
const checkin = allData?.checkin as CheckinData | undefined;
// GoalsModule.tsx lines 18–21 — useMemo with cast:
const vd = allData?.values as ValuesData | undefined;
return vd?.selected ?? [];
// InsightsBlock pattern:
const ysqData = allData?.ysq as YsqData | undefined;
if (!ysqData?.answers) return null;
const valuesData = allData?.values as ValuesData | undefined;
const selected = valuesData?.selected ?? [];
```

### type="button" on all buttons
**Source:** `frontend/src/modules/goals/GoalsModule.tsx` line 64, `frontend/src/modules/synthese/SyntheseModule.tsx` line 318
**Apply to:** `InsightsBlock.tsx` "Als Ziel erkunden" button
```typescript
// Every button in the codebase uses type="button":
<button type="button" onClick={...}>
```

### Cross-module imports
**Source:** `frontend/src/modules/synthese/SyntheseModule.tsx` lines 17–25
**Apply to:** `InsightsBlock.tsx`
```typescript
// SyntheseModule.tsx imports from multiple module folders:
import { SCHEMA_MAP } from "../beliefs_schema/constants";
import type { BeliefsSchemaData } from "../beliefs_schema/types";
import { YSQ_SCHEMAS } from "../ysq/constants";
import type { YsqData } from "../ysq/types";
// InsightsBlock imports from ysq/ and values/ — same relative path pattern
```

### Pure utility functions in lib/
**Source:** `frontend/src/lib/migrations.ts`, `frontend/src/lib/uid.ts`, `frontend/src/modules/checkin/scoring.ts`
**Apply to:** `frontend/src/lib/insights.ts` (new utility)
```typescript
// scoring.ts pattern — named exports, pure functions, typed params:
export function sumAnswers(answers: number[]): number { ... }
export function phq9Severity(score: number): { label: string; tone: ... } { ... }
// insights.ts follows exact same pattern
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `frontend/vitest.config.ts` | config | — | No existing Vitest config in project — first test infrastructure file; use pattern from RESEARCH.md directly |

---

## Metadata

**Analog search scope:** `frontend/src/` — all modules, components, lib, App.tsx, types.ts
**Files scanned:** 11 analog files read in full
**Key source files:**
- `/home/spro/development/MentalHealth/frontend/src/modules/beliefs_schema/constants.ts` — interface + array + Map pattern for hints.ts
- `/home/spro/development/MentalHealth/frontend/src/modules/goals/constants.ts` — string constants pattern for synthese/constants.ts
- `/home/spro/development/MentalHealth/frontend/src/modules/values/ValuesSummary.tsx` — guard + read-only display pattern for InsightsBlock
- `/home/spro/development/MentalHealth/frontend/src/modules/synthese/SyntheseModule.tsx` — score computation lines 180–198, gap computation lines 60–74, Card+section-label pattern lines 339–353, placement point line 355
- `/home/spro/development/MentalHealth/frontend/src/modules/goals/GoalsModule.tsx` — add() function lines 27–39, left-border list lines 73–80, type guard integration
- `/home/spro/development/MentalHealth/frontend/src/App.tsx` — state model lines 61–64, allData construction line 106, component render lines 190–196
- `/home/spro/development/MentalHealth/frontend/src/modules/registry.ts` — ModuleProps interface lines 13–17
- `/home/spro/development/MentalHealth/frontend/src/modules/ysq/constants.ts` — 18 schema IDs + YSQ_MAX_SCHEMA_SCORE line 213
- `/home/spro/development/MentalHealth/frontend/src/modules/ysq/types.ts` — YsqData.answers shape
- `/home/spro/development/MentalHealth/frontend/src/modules/values/types.ts` — ValueItem shape
- `/home/spro/development/MentalHealth/frontend/src/modules/checkin/scoring.ts` — pure function utility pattern for lib/insights.ts

**Pattern extraction date:** 2026-04-23
