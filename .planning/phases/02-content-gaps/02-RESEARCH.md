# Phase 2: Content Gaps — Research

**Researched:** 2026-04-21
**Domain:** FastAPI module porting (backend), React module implementation (frontend), YSQ questionnaire state machine, CSS bar chart
**Confidence:** HIGH (all findings verified directly from codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `reference/kompass.html` is a mandatory prerequisite for all YSQ tasks. User will supply the file before YSQ constants are ported. Planner must note an explicit dependency: "YSQ constants require `reference/kompass.html` on disk." No fallback to generic YSQ-S3 text.
- **D-02:** Full 18 schemas (YSQ-S3 standard), 5 items each = 90 items total. The 4 schemas absent from `beliefs_schema/constants.ts` (dependency/incompetence, enmeshment, entitlement/grandiosity, insufficient self-control) exist only in `ysq/constants.ts` — not carried back to `beliefs_schema`.
- **D-03:** `beliefs_schema` stays at 14 schemas in Phase 2. Extension to 18 is backlog.
- **D-04:** In-progress answers persisted. User can pause and resume the questionnaire.
- **D-05:** "Skip schema" = leave its 5 items empty. Chart shows skipped schemas without a bar (or explicit "nicht ausgefüllt" label), NOT as score 0.
- **D-06:** Forward/back navigation. Answers on previous schema pages survive going back.
- **D-07:** After "Abschließen" click: draft committed to result state, draft cleared. One saved result per user (no history of multiple runs).
- **D-08:** Results chart: CSS/Flexbox horizontal bars only. No chart package.
- **D-09:** Schemas sorted descending by score in results. Skipped schemas at bottom. No click interaction on rows.
- **D-10:** Note field (single-line `<input type="text">`) per schema, always visible inline below bar row.
- **Checkin backend (CONT-01):** Backend schema directly mirrors frontend `CheckinData = { entries: CheckinEntry[] }`. Pattern: `values.py`.
- **Constants (CONT-06):** `GOAL_PROMPTS` → `goals/constants.ts` (file exists, extend it); `DEFUSION_EXAMPLES` → `beliefs_act/constants.ts` (create new file); `EXPLORATION_PROMPTS` → `obstacles/constants.ts` (create new file). Update imports in respective module files.

### Claude's Discretion

- Exact YSQ data structure for the JSON blob: how `draft` (in-progress) and `answers` (committed result) coexist in the same record.
- Schema version for YSQ backend: starts at 1.
- Representation of skipped schemas in data (null vs. explicit `skipped: true` flag).
- Whether skipped schemas appear in the bar chart (proposed: yes, grayed out + "nicht ausgefüllt" label).

### Deferred Ideas (OUT OF SCOPE)

- Extending `beliefs_schema` from 14 to 18 schemas.
- Historized YSQ runs (multiple timestamped results) — deferred to snapshot system (Phase 4).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Implement `backend/app/modules/checkin.py` and register it — Checkin data saved server-side | Values.py pattern is 1:1 applicable; CheckinEntry Pydantic model mirrors TS types |
| CONT-02 | Implement `backend/app/modules/ysq.py` — raw 90-integer array, schema_version prepared | Array storage via `list[int | None]` (None = skipped); single record, no history |
| CONT-03 | YSQ frontend: paginated questionnaire, 18 schema pages × 5 items, progress indicator, skip | Mode state machine + per-schema draft array; CheckinModule ScaleRow pattern reusable |
| CONT-04 | YSQ results: descending bar chart, schema notes, skipped clearly differentiated | CSS/Flexbox bar; severity color map (sage/ocean/accent); note `<input>` always visible |
| CONT-05 | YSQ summary block for Synthese page: top 3 schemas by score | SummaryProps<YsqData> component; allData.ysq typed; empty state if no answers |
| CONT-06 | Extract GOAL_PROMPTS, DEFUSION_EXAMPLES, EXPLORATION_PROMPTS to constants files | Three constant arrays verified in source; two target files must be created |
</phase_requirements>

---

## Summary

Phase 2 closes two kinds of gaps: (1) backend modules that are missing for `checkin` and `ysq`, causing the server-backed mode to return 404; and (2) the YSQ frontend, which is entirely absent and needs to be built from scratch. A third workstream (CONT-06) extracts inline constants from three component bodies into proper `constants.ts` files.

The backend work (CONT-01, CONT-02) is mechanical: both follow the `values.py` frozen-dataclass pattern exactly. The checkin model directly mirrors the TypeScript types. The YSQ model stores a 90-element array with nullable slots for skipped items plus a separate draft array and a per-schema notes dict.

The frontend YSQ work (CONT-03–05) is the most complex task in the phase: an 18-step paginated questionnaire with a two-field state machine (`draft` vs. `answers`), in-progress persistence via the existing `onChange` contract, a CSS bar chart, and a summary block. The CheckinModule provides a close reference for mode switching (`"overview" | "questionnaire"`) and the `ScaleRow` component pattern.

**Primary recommendation:** Implement in dependency order: CONT-06 (pure refactor, no risk) → CONT-01 (backend only, minimal) → CONT-02 (backend only, design the data model) → CONT-03 (frontend questionnaire, needs CONT-02 data model decided) → CONT-04 (results view, needs CONT-03 draft) → CONT-05 (summary, needs CONT-04 data shape). CONT-02 and CONT-01 can be parallelized. CONT-06 can be parallelized with both.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Checkin data persistence | API / Backend | — | Backend module missing; frontend already complete |
| YSQ data persistence | API / Backend | — | Backend module missing; stores raw answers array |
| YSQ questionnaire UI | Frontend | — | State machine lives in React component |
| YSQ draft persistence | Frontend (via onChange → API) | API / Backend | Draft saved on every schema-page advance via the generic PUT endpoint |
| YSQ results display | Frontend | — | CSS bar chart; all computation in component |
| YSQ summary block | Frontend | — | SummaryBlock FC on Synthese page; reads allData.ysq |
| Constants extraction | Frontend | — | Pure move of inline arrays to constants.ts files |

---

## Standard Stack

### Core (all already in use — no new dependencies)

| Library | Version | Purpose | Relevance to Phase 2 |
|---------|---------|---------|----------------------|
| FastAPI | >=0.115 | HTTP API framework | Backend module routers already wired |
| SQLModel + Pydantic v2 | >=0.0.32 / >=2.8 | ORM + validation | Pydantic models for checkin/ysq schemas |
| React 18 | 18.3 | UI framework | YSQ questionnaire component |
| TypeScript | 5.5 | Type safety | YsqData, YsqDraft types |
| Tailwind CSS | 3.4 | Styling | All new UI follows existing Tailwind patterns |

**No new packages needed.** [VERIFIED: codebase scan — frontend/package.json, backend/pyproject.toml]

### Alternatives Considered

None applicable — locked decisions eliminate all library choices.

---

## Architecture Patterns

### System Architecture Diagram

```
User action (answer item / skip / navigate)
          │
          ▼
  YsqModule local state
  ┌─────────────────────────────────────────┐
  │  mode: "overview" | "questionnaire"     │
  │  currentSchemaIdx: 0–17                 │
  │  localDraft: (number|null)[][18]        │
  └──────────────┬──────────────────────────┘
                 │ onChange(newData) — full replacement
                 ▼
          App.tsx Store
                 │ PUT /api/modules/ysq
                 ▼
         FastAPI router
                 │ ysq SPEC.validate()
                 ▼
         ModuleRecord (SQLite)
         { answers: (int|null)[] | null,
           draft: (int|null)[] | null,
           notes: Record<string,string> }
```

On "Abschließen":
- `draft` array → `answers` field
- `draft` → null
- `onChange` called once with committed state

On resume (mount with `data.draft != null`):
- mode = "questionnaire"
- `currentSchemaIdx` = last non-null chunk in draft

### Recommended File Structure (new files only)

```
backend/app/modules/
├── checkin.py          ← CONT-01 (new)
└── ysq.py              ← CONT-02 (new)

frontend/src/modules/
├── ysq/                ← CONT-03/04/05 (new directory)
│   ├── index.ts        ← ModuleDef export
│   ├── YsqModule.tsx   ← questionnaire + results, mode state
│   ├── YsqSummary.tsx  ← top-3 schemas summary block
│   ├── types.ts        ← YsqData, YsqDraft interfaces
│   └── constants.ts    ← YSQ_SCHEMAS array (items populated from reference/kompass.html)
├── beliefs_act/
│   └── constants.ts    ← CONT-06: new file, DEFUSION_EXAMPLES
└── obstacles/
    └── constants.ts    ← CONT-06: new file, EXPLORATION_PROMPTS
```

### Pattern 1: Backend Module (CONT-01, CONT-02)

**What:** Pydantic BaseModel for item shapes + data container + `default_data()` + `migrations` dict + frozen `SPEC` constant registered in `_build_modules()`.

**When to use:** Every new reflection module follows this exactly.

**Example (checkin.py skeleton):**
```python
# Source: verified from backend/app/modules/values.py
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
from .registry import ModuleSpec

class CheckinEntry(BaseModel):
    id: str
    timestamp: str
    phq9: list[int] = Field(default_factory=list)
    gad7: list[int] = Field(default_factory=list)
    note: str = ""

class CheckinData(BaseModel):
    entries: list[CheckinEntry] = Field(default_factory=list)

def default_data() -> dict[str, Any]:
    return CheckinData().model_dump(mode="json")

migrations: dict[int, Any] = {}

SPEC = ModuleSpec(
    id="checkin",
    title="Wochen-Check-in",
    phase_num="W",
    order=5,
    schema_version=1,
    data_schema=CheckinData,
    default_data=default_data,
    migrations=migrations,
)
```

**Registration:** Add `from . import checkin, ysq` and `checkin.SPEC, ysq.SPEC` to `_build_modules()` in `registry.py`. [VERIFIED: codebase — registry.py lines 43–55]

### Pattern 2: YSQ Data Model (CONT-02, CONT-03 type contract)

**What:** Two top-level arrays in the JSON blob. `answers` is the committed result (set on "Abschließen", null before first completion). `draft` is the in-progress array (cleared after commit). Notes keyed by schema index string.

**Proposed TypeScript types:**
```typescript
// frontend/src/modules/ysq/types.ts
export type YsqAnswer = number | null;  // null = item skipped/unanswered

export interface YsqData {
  // Committed result — null until user clicks "Abschließen" for first time
  answers: YsqAnswer[] | null;           // length 90, indexed [schemaIdx*5 + itemIdx]
  notes: Record<string, string>;        // key = schema index string "0"–"17"
  // In-progress draft — null when not in a questionnaire session
  draft: YsqAnswer[] | null;            // same shape as answers; null after commit
}
```

**Corresponding Python Pydantic model:**
```python
class YsqData(BaseModel):
    answers: list[int | None] | None = None    # null = no committed result yet
    draft: list[int | None] | None = None      # null = no in-progress session
    notes: dict[str, str] = Field(default_factory=dict)
```

**Score computation per schema:** Sum items `schemaIdx*5` through `schemaIdx*5+4`. If all 5 are null, schema is "skipped" (no score). Partial completion: sum only non-null items (treat partial as non-skipped for chart). [ASSUMED — partial-completion treatment not specified in CONTEXT.md; recommend summing non-null only]

### Pattern 3: YSQ Mode State Machine (CONT-03)

**What:** Component-local state controlling which view renders — mirrors CheckinModule exactly.

**When to use:** Any module with both a data-entry and a results view.

```typescript
// Source: verified from frontend/src/modules/checkin/CheckinModule.tsx lines 65–68
const [mode, setMode] = useState<"overview" | "questionnaire">(() =>
  data.draft != null ? "questionnaire"       // resume in-progress
  : data.answers != null ? "overview"         // show results
  : "questionnaire"                          // fresh start
);
const [currentSchemaIdx, setCurrentSchemaIdx] = useState<number>(() => {
  // resume at first schema page with no complete answer set
  if (data.draft == null) return 0;
  for (let i = 0; i < 18; i++) {
    const slice = data.draft.slice(i * 5, i * 5 + 5);
    if (slice.every(v => v === null)) return i;
  }
  return 17; // all schemas touched — go to last page
});
```

**Key insight:** `currentSchemaIdx` is component-local state (not persisted). Persistence happens via `onChange` which calls PUT on every forward/back navigation step.

### Pattern 4: CSS Bar Chart (CONT-04)

**What:** Horizontal bar chart using Flexbox. No chart library. Severity color from CSS variables.

**Reference:** TrendChart.tsx uses `--sage`, `--ocean`, `--accent` (TONE_STROKE map). [VERIFIED: frontend/src/components/TrendChart.tsx lines 15–18]

```tsx
// Source: verified from 02-UI-SPEC.md component contract
const barColor = (score: number | null): string => {
  if (score === null) return "var(--line)";          // skipped
  if (score >= 16) return "var(--accent)";
  if (score >= 11) return "var(--ocean)";
  return "var(--sage)";
};

// Each row:
<li className="border-b border-line-soft last:border-b-0">
  <div className="flex items-center gap-4 py-3">
    <span className="text-sm text-ink min-w-[140px] shrink-0">{schemaName}</span>
    <div className="flex-1 bg-paper-3 rounded-sm h-3 overflow-hidden">
      {score !== null && (
        <div
          className="h-full rounded-sm transition-all"
          style={{ width: `${(score / maxScore) * 100}%`, backgroundColor: barColor(score) }}
        />
      )}
    </div>
    <span className="text-xs font-mono text-ink-faint ml-2 w-8 text-right shrink-0">
      {score ?? "–"}
    </span>
  </div>
  <input type="text" maxLength={200} ... className="w-full ... mt-1" />
</li>
```

**Max score per schema:** UI-SPEC says 25 (5 items × 5 pts). YSQ-S3 standard uses 1–6 scale. Source of truth is `reference/kompass.html`. Use max from constants, not hardcoded. [ASSUMED — exact scale endpoint (4-pt vs 6-pt) must be confirmed from reference/kompass.html]

### Pattern 5: ModuleDef Registration (CONT-03)

**What:** Add `ysqModule` to `frontend/src/modules/registry.ts` `modules` array. `checkin` is already registered.

**Reference:** [VERIFIED: frontend/src/modules/registry.ts lines 36–45]

```typescript
// Import at top of registry.ts:
import { ysqModule } from "./ysq";
// Add to modules array (after checkinModule, before orientationModule):
ysqModule,
```

YSQ `phaseNum` should match the backend SPEC. Suggest `"02"` to reflect Phase 2 origin.

### Pattern 6: Constants Extraction (CONT-06)

Three existing inline arrays must move:

| Constant | Current Location (line) | Target File | Action |
|----------|------------------------|-------------|--------|
| `GOAL_PROMPTS` (5 strings) | `goals/GoalsModule.tsx` line 14 | `goals/constants.ts` | Append to existing file |
| `DEFUSION_EXAMPLES` (5 strings) | `beliefs_act/BeliefsActModule.tsx` line 10 | `beliefs_act/constants.ts` | Create new file |
| `EXPLORATION_PROMPTS` (5 strings) | `obstacles/ObstaclesModule.tsx` line 12 | `obstacles/constants.ts` | Create new file |

**goals/constants.ts** already exports `HORIZON_LABEL` and `STATUS_LABEL`. `GOAL_PROMPTS` is appended — no file creation needed. [VERIFIED: frontend/src/modules/goals/constants.ts]

**beliefs_act/constants.ts** and **obstacles/constants.ts** do not exist. Both must be created. [VERIFIED: codebase ls — both files absent]

After extraction: update import statements in the three `.tsx` files.

### Anti-Patterns to Avoid

- **Storing only the index:** YSQ draft must store the full 90-element array (or at minimum the full schema's answers before advancing), not just the current page. Otherwise, back-navigation loses previous pages.
- **Score = 0 for skipped schemas:** D-05 explicitly forbids this. Use `null` to represent skipped.
- **Adding a ysq entry to localApi without aligning the type:** `localApi.ts` stores generic blobs — no change needed there. Only the Pydantic model and TypeScript type need defining.
- **Committing draft on every keystroke:** Draft should be committed via `onChange` on schema-page transitions (forward/back), not on every button click within a page. This avoids excessive PUT calls.
- **Hardcoding `maxScore = 25`:** The actual scale endpoint must come from `reference/kompass.html`. Put the max value in `ysq/constants.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Module registration | Custom module-discovery code | Extend existing `_build_modules()` in `registry.py` | Pattern already in place; any deviation breaks generic router |
| In-band data migration | Custom migration runner | Existing `ModuleSpec.migrate()` / `runMigrations()` | Both backend and frontend already have this; schema_version = 1 means no migrations needed in Phase 2 but the dict must still be present |
| UUID generation | `Math.random()` or custom | Existing `uid()` from `frontend/src/lib/uid.ts` | QUAL-03 requirement (crypto.randomUUID with file:// compat check) |

**Key insight:** Every new module in this phase is a pure application of an existing pattern. No new infrastructure needed.

---

## Common Pitfalls

### Pitfall 1: YSQ draft persistence on back-navigation

**What goes wrong:** If local draft state is only stored in React component state (not persisted via `onChange` on navigation), going back to a previous schema page shows the correct answers visually but they are lost on page reload.

**Why it happens:** Draft feels like transient UI state, so developers use `useState` for it without syncing to `onChange`.

**How to avoid:** Call `onChange({ ...data, draft: updatedDraft90array })` on every forward AND backward navigation click. The generic PUT endpoint handles persistence.

**Warning signs:** "Back" button works but data is gone on reload. Check if `data.draft` in network requests is updated.

### Pitfall 2: Schema order in backend registry

**What goes wrong:** `_build_modules()` calls `.sort(key=lambda s: s.order)`. If `checkin.SPEC` and `ysq.SPEC` have conflicting order values, the list order changes, potentially affecting navigation display.

**Why it happens:** `values.py` uses `order=10` as a reference. New modules need distinct values.

**How to avoid:** Assign `order=5` to checkin (before orientation `order=0`... check existing values) and `order=15` or similar for ysq. Inspect existing order values before assigning. [ASSUMED — exact existing order values not checked for all modules]

**Warning signs:** Module appears in wrong position in sidebar.

### Pitfall 3: `reference/kompass.html` dependency not gated

**What goes wrong:** A task that creates `ysq/constants.ts` with the 90 item texts is executed before the file is on disk, resulting in empty or placeholder constants that are committed.

**Why it happens:** Task sequencing in the plan doesn't make this a hard dependency.

**How to avoid:** The plan must structure the YSQ constants task with an explicit `BLOCKED — requires reference/kompass.html` marker. The backend schema and frontend component skeleton can be built independently; only the constants population task is blocked.

**Warning signs:** `YSQ_SCHEMAS` array has empty or placeholder item strings.

### Pitfall 4: YSQ scale mismatch in bar chart

**What goes wrong:** UI-SPEC says max score 25 (5 × 5pt scale) but YSQ-S3 standard uses a 1–6 scale which gives max 30 (5 × 6pt). Using the wrong denominator makes bars appear longer or shorter than they should.

**Why it happens:** The UI-SPEC notes "verify against reference/kompass.html". If the implementer skips this check, a wrong constant is used.

**How to avoid:** Derive `YSQ_MAX_SCORE_PER_SCHEMA` from constants, not inline. Set it after confirming scale from `reference/kompass.html`.

**Warning signs:** A schema with all "Trifft völlig zu" answers doesn't reach 100% bar width.

### Pitfall 5: `beliefs_act/constants.ts` import path

**What goes wrong:** After extracting `DEFUSION_EXAMPLES` to a new `constants.ts`, the import in `BeliefsActModule.tsx` is forgotten or uses a wrong path, causing a TypeScript compile error.

**Why it happens:** Refactor tasks split into "create file" and "update import" steps, and the second step is missed.

**How to avoid:** Treat CONT-06 as a single atomic task per module: (create constants.ts) + (remove inline array) + (add import) in one change set.

---

## Code Examples

### Backend: Checkin SPEC registration

```python
# Source: verified from backend/app/modules/registry.py lines 43–55
def _build_modules() -> list[ModuleSpec]:
    from . import beliefs_act, beliefs_schema, checkin, goals, obstacles, orientation, values, ysq

    specs = [
        orientation.SPEC,
        values.SPEC,
        checkin.SPEC,    # add
        beliefs_schema.SPEC,
        beliefs_act.SPEC,
        goals.SPEC,
        obstacles.SPEC,
        ysq.SPEC,        # add
    ]
    specs.sort(key=lambda s: s.order)
    return specs
```

### Frontend: YsqData default

```typescript
// frontend/src/modules/ysq/index.ts
const defaultData = (): YsqData => ({
  answers: null,
  draft: null,
  notes: {},
});
```

### Frontend: YsqModule mode initialization

```typescript
// Mirrors CheckinModule pattern — verified from CheckinModule.tsx lines 65–68
const [mode, setMode] = useState<"overview" | "questionnaire">(() => {
  if (data.draft != null) return "questionnaire";    // resume
  if (data.answers != null) return "overview";       // show results
  return "questionnaire";                            // fresh
});
```

### Frontend: Commit draft on "Abschließen"

```typescript
function commit() {
  if (localDraft == null) return;
  onChange({ ...data, answers: localDraft, draft: null });
  setMode("overview");
}
```

### Frontend: Progress bar (thin track)

```tsx
{/* Source: verified from 02-UI-SPEC.md */}
<div className="h-0.5 bg-line-soft rounded-full mt-2 mb-6">
  <div
    className="h-full bg-ink-soft rounded-full"
    style={{ width: `${((currentSchemaIdx) / 18) * 100}%` }}
  />
</div>
```

---

## Runtime State Inventory

> Not applicable — this is a forward-porting phase, not a rename/refactor/migration. No existing runtime state is renamed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline constants in component bodies | Constants exported from `constants.ts` | CONT-06 | Enables reuse, testing, tree-shaking |
| No backend for checkin/ysq | Full backend module with Pydantic + SPEC | CONT-01/02 | Server mode returns 404 → 200 for these modules |
| YSQ absent from frontend | Full module with questionnaire + results | CONT-03/04/05 | Module navigable from sidebar |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Partial YSQ completion (some items answered, some null within a schema) counts as non-skipped — score is sum of non-null items | Architecture Patterns: Pattern 2 | Wrong score computation; may need to treat partial as "unanswered" and require all 5 before advancing |
| A2 | YSQ-S3 scale is 1–6 (max 30 per schema, max 30 total per schema) — not 0–5 or 1–4 | Common Pitfalls: Pitfall 4 | Bar chart denominator wrong; MUST verify from reference/kompass.html |
| A3 | `checkin.SPEC.order` = 5 and `ysq.SPEC.order` = a value after `obstacles` (order > 50) — exact existing order values for orientation/values/beliefs_schema etc. not audited | Common Pitfalls: Pitfall 2 | Wrong sidebar order if order values collide |
| A4 | YSQ `phaseNum` = "02" in the ModuleDef (frontend registry) | Architecture Patterns: Pattern 5 | Display artifact only — no functional impact |

---

## Open Questions

1. **YSQ Likert scale: 1–4 or 1–6?**
   - What we know: UI-SPEC copywriting contract lists 4 answer options ("Trifft gar nicht zu" … "Trifft völlig zu"), suggesting 1–4. UI-SPEC max score = 25 (5 × 5? or 5 × 4 + 1?). YSQ-S3 standard uses 1–6.
   - What's unclear: The exact labels and values in `reference/kompass.html`. UI-SPEC itself says "verify against reference/kompass.html."
   - Recommendation: Use 4 options (values 1–4, max 20 per schema) as per the copywriting contract, but populate `YSQ_MAX_SCORE_PER_SCHEMA` from constants, not inline. Confirm and update after `reference/kompass.html` is on disk.

2. **Existing `order` values for all backend modules**
   - What we know: `values.SPEC.order = 10` [VERIFIED: values.py line 53]. Other modules not read.
   - What's unclear: Order values for orientation, beliefs_schema, beliefs_act, goals, obstacles.
   - Recommendation: Planner should include a step to read all existing SPEC orders before assigning checkin and ysq order values.

3. **YSQ module position in frontend sidebar**
   - What we know: Frontend `modules` array order in `registry.ts` determines sidebar order. Checkin is first. YSQ is not yet in the array.
   - What's unclear: Where YSQ should appear — before or after orientation? The UI-SPEC doesn't specify sidebar position.
   - Recommendation: Insert YSQ after checkin (index 1) given it's also a structured questionnaire, separate from the reflective modules.

---

## Environment Availability

> This phase is pure code changes — no external tools, databases, or services beyond the existing dev stack. No new CLI tools, runtimes, or services required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.12 | Backend modules | To be verified at execution | — | — |
| pytest + httpx | Backend tests | ✓ (pyproject.toml dev deps) | >=8 / >=0.27 | — |
| Node 20 + npm | Frontend | To be verified at execution | — | — |

**Blocking dependency with no fallback:**
- `reference/kompass.html` — required for YSQ constants task (CONT-02/03 item texts). No fallback. Plan must gate the constants task on this file being present.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 8+ with pytest-asyncio |
| Config file | `backend/pyproject.toml` — `[tool.pytest.ini_options] asyncio_mode = "auto"` |
| Quick run command | `cd backend && python -m pytest tests/ -x -q` |
| Full suite command | `cd backend && python -m pytest tests/ -v` |
| Frontend type check | `cd frontend && npx tsc --noEmit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Checkin PUT/GET round-trips correctly | integration | `pytest tests/test_modules.py -k checkin -x` | ❌ Wave 0 |
| CONT-02 | YSQ PUT/GET round-trips; null slots preserved; draft clears after commit | integration | `pytest tests/test_modules.py -k ysq -x` | ❌ Wave 0 |
| CONT-03 | YSQ module renders questionnaire page | manual-only | n/a — UI interaction | — |
| CONT-04 | YSQ results view renders bars | manual-only | n/a — CSS layout | — |
| CONT-05 | YsqSummary renders top 3 schemas | manual-only | n/a — React component | — |
| CONT-06 | Constants imports resolve; no TypeScript errors | automated | `cd frontend && npx tsc --noEmit` | ✅ (tsc already configured) |

### Sampling Rate

- **Per task commit:** `cd backend && python -m pytest tests/ -x -q` (backend tasks) / `cd frontend && npx tsc --noEmit` (frontend tasks)
- **Per wave merge:** Full suite — `cd backend && python -m pytest tests/ -v`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_modules.py` — extend with checkin and ysq test cases (CONT-01, CONT-02). Existing file covers values module; pattern is directly reusable.

*(No new test framework config needed — pytest-asyncio already configured.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth paths — existing Bearer token unchanged |
| V3 Session Management | no | Single-user, stateless API |
| V4 Access Control | no | No new resource types |
| V5 Input Validation | yes | Pydantic validates all PUT payloads for new modules |
| V6 Cryptography | no | No new crypto use |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Oversized payload (90-int array inflated) | Tampering | Pydantic `list[int | None]` with fixed length validation (add `@validator` or `Field(max_length=90)`) |
| Schema injection via notes dict keys | Tampering | Pydantic `dict[str, str]` constrains value type; key validation optional but note field maxLength=200 from UI-SPEC |

---

## Sources

### Primary (HIGH confidence — verified directly from codebase)

- `backend/app/modules/values.py` — reference pattern for backend modules (Pydantic + SPEC)
- `backend/app/modules/registry.py` — `_build_modules()` and registration pattern
- `frontend/src/modules/registry.ts` — `modules` array and `ModuleDef` interface
- `frontend/src/modules/checkin/types.ts` — `CheckinEntry` and `CheckinData` structures
- `frontend/src/modules/checkin/CheckinModule.tsx` — mode state machine and ScaleRow pattern
- `frontend/src/modules/checkin/index.ts` — `ModuleDef` shape reference
- `frontend/src/modules/beliefs_schema/constants.ts` — 14 SCHEMAS with id conventions
- `frontend/src/modules/goals/GoalsModule.tsx` — `GOAL_PROMPTS` location (line 14)
- `frontend/src/modules/beliefs_act/BeliefsActModule.tsx` — `DEFUSION_EXAMPLES` location (line 10)
- `frontend/src/modules/obstacles/ObstaclesModule.tsx` — `EXPLORATION_PROMPTS` location (line 12)
- `frontend/src/modules/goals/constants.ts` — existing constants file (GOAL_PROMPTS target)
- `frontend/src/components/TrendChart.tsx` — severity color pattern
- `backend/tests/conftest.py` — test fixture pattern (AsyncClient + in-memory SQLite)
- `backend/tests/test_modules.py` — existing test pattern to extend
- `.planning/phases/02-content-gaps/02-CONTEXT.md` — locked decisions D-01 through D-10
- `.planning/phases/02-content-gaps/02-UI-SPEC.md` — component contracts, color mapping, copywriting
- `.planning/REQUIREMENTS.md` — CONT-01 through CONT-06 acceptance criteria
- `backend/pyproject.toml` — pytest config, dependency versions

### Secondary (MEDIUM confidence)

None — all claims are directly codebase-verified.

### Tertiary (LOW confidence — assumptions)

- A1–A4 in Assumptions Log: YSQ scale endpoint, partial completion handling, module order values, phaseNum assignment.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already in use, verified from package files
- Architecture patterns: HIGH — directly derived from existing codebase patterns
- YSQ data model: MEDIUM — design recommendation under Claude's Discretion, A1/A2 are assumptions
- Pitfalls: HIGH — derived from codebase inspection and locked decisions
- Test strategy: HIGH — existing conftest and test_modules.py provide direct extension pattern

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable stack; only risk is if kompass.html changes YSQ scale assumptions)
