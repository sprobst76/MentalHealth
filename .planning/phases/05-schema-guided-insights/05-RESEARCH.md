# Phase 5: Schema-Guided Insights — Research

**Researched:** 2026-04-23
**Domain:** Frontend-only React/TypeScript — read-only computation over existing module data, cross-module navigation wiring
**Confidence:** HIGH — all findings verified directly from codebase source files

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HINT-01 | Static mapping table: 18 YSQ schemas → 2-3 Heilungsziele + 1-2 Hindernishinweise in `constants.ts` | All 18 schema IDs and labels verified from `ysq/constants.ts`; full mapping table in HINT-01 section below |
| HINT-02 | Synthese page shows InsightsBlock for top-3 schemas (highest score); only when YSQ is filled | Score calculation pattern verified from `computeYsqDelta`; `answers` shape verified from `YsqData`; guard condition confirmed |
| HINT-03 | Values with `weight − living ≥ 2` highlighted on Synthese page with goal hint | Gap calculation pattern verified from `ValuesSummary.tsx` and `buildTextReport`; `ValueItem` shape confirmed |
| HINT-04 | "Als Ziel erkunden" button navigates to Goals module and pre-fills a new goal | `App.tsx` state/navigation model analyzed; `GoalsModule.tsx` `add()` function analyzed; prefill wiring approach chosen |
| HINT-05 | All insight texts in `constants.ts` files, no inline strings in component body | Existing pattern confirmed: `goals/constants.ts`, `ysq/constants.ts`; new file location decided |
</phase_requirements>

---

## Summary

Phase 5 is a **frontend-only** feature. No backend changes are needed. The phase adds a new `InsightsBlock` component to the Synthese page that derives actionable hints from data already flowing through `allData`. The only non-trivial architectural challenge is HINT-04: wiring a "navigate + prefill" action from `SyntheseModule` (which has no navigation authority) up to `App.tsx` (which owns `setActiveId`) and back down to `GoalsModule`.

The score-calculation and gap-calculation logic is already proven in the codebase (`computeYsqDelta`, `buildTextReport`, `ValuesSummary`). Phase 5 lifts those proven formulas into production-visible UI.

The 18 schema-to-hints mappings (HINT-01) are the largest content authoring task in the phase. They are grounded in schema therapy literature (Young, 2003) and provided in full below. Because no external source verification is possible for curated clinical text, these are tagged `[ASSUMED]` — the user should review them before shipping.

**Primary recommendation:** Extend `ModuleProps` with an optional `onNavigatePrefill` callback. This keeps the data-flow pattern consistent with the existing architecture (props down, callbacks up) without introducing shared mutable state.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| YSQ score computation | Frontend (computation) | — | Pure function over `allData.ysq.answers`; no server round-trip needed |
| Values gap computation | Frontend (computation) | — | Pure function over `allData.values.selected`; already exists in `ValuesSummary.tsx` |
| Schema hints content | Frontend (constants) | — | Static text; lives in `constants.ts`, never in component body (HINT-05) |
| InsightsBlock rendering | Frontend (component) | — | Reads `allData` already passed to `SyntheseModule` |
| Navigate + prefill | Frontend (App.tsx state) | SyntheseModule callback | `App.tsx` owns `setActiveId`; GoalsModule owns `add()`; coordination via optional prop |

---

## Technical Approach (per HINT)

### HINT-01: Schema Hints Constants

**File:** `frontend/src/modules/ysq/hints.ts` (new — keeps YSQ-specific constants in the YSQ module folder, not in synthese/)

**Data shape:**

```typescript
// frontend/src/modules/ysq/hints.ts
export interface SchemaHint {
  schemaId: string;           // matches YsqSchema.id
  healingDirection: string;   // 1-2 sentences shown below schema name
  goalSuggestions: string[];  // 2-3 short items; used for HINT-04 prefill and HINT-02 display
  obstacleHints: string[];    // 1-2 items
}

export const YSQ_HINTS: SchemaHint[] = [ /* ... 18 entries ... */ ];

// Lookup map for O(1) access by schema id
export const YSQ_HINTS_MAP = new Map(YSQ_HINTS.map((h) => [h.schemaId, h]));
```

**Complete mapping table (18 schemas):** [ASSUMED — grounded in schema therapy literature, Young 2003; requires user review]

| Schema ID | Schema Label | Heilungsrichtung | Heilungsziele (2-3) | Hindernishinweise (1-2) |
|-----------|-------------|-----------------|---------------------|------------------------|
| `abandonment` | Verlassenheit / Instabilität | Vertrauen in die Stabilität von Beziehungen aufbauen; lernen, mit Ungewissheit umzugehen ohne sofort in Panik zu verfallen. | "Einen Menschen in meinem Leben benennen, dem ich wirklich vertraue", "Eine Situation üben, in der ich allein bin — ohne zu flüchten", "Meine eigene Kontinuität erleben, unabhängig davon, wer bleibt" | Klammern oder Distanzieren als Selbstschutz, Testen von Beziehungen |
| `mistrust` | Misstrauen / Missbrauch | Unterscheiden lernen zwischen vergangenen Erfahrungen und aktuellen Beziehungen; schrittweise Sicherheit in kleinen Vertrauensschritten erfahren. | "Einen niedrigschwelligen Vertrauensschritt mit einer sicheren Person wagen", "Beobachten, wann mein Misstrauen angemessen ist und wann es überreagiert", "Eigene Grenzen klar formulieren — als Schutz, nicht als Mauer" | Hypervigilanz, Selbsterfüllende Prophezeiungen durch Distanz |
| `emotional_deprivation` | Emotionale Entbehrung | Lernen, eigene emotionale Bedürfnisse wahrzunehmen und sie gegenüber anderen zu artikulieren; aktiv Verbindung suchen statt passiv warten. | "Einem Menschen sagen, was ich mir von ihm wünsche — konkret und direkt", "Regelmäßig prüfen: Was brauche ich gerade emotional?", "Eine Beziehung pflegen, in der ich mich wirklich gehört fühle" | Passives Warten auf Fürsorge, Bedürfnisse kleinreden |
| `defectiveness` | Unzulänglichkeit / Scham | Den inneren Kritiker identifizieren und seine Botschaften hinterfragen; lernen, sich so zu begegnen wie einem guten Freund. | "Drei Eigenschaften aufschreiben, die ich an mir schätze — ohne Einschränkung", "Eine Situation benennen, in der ich Fehler gemacht habe und trotzdem liebenswert war", "Mit einer Vertrauensperson über eine Schwäche sprechen" | Rückzug aus Nähe aus Angst vor Entdeckung, Überleistung als Kompensation |
| `social_isolation` | Soziale Isolation / Entfremdung | Gemeinsame Interessen und Zugehörigkeiten aufspüren; kleine soziale Schritte unternehmen ohne den Druck vollständiger Akzeptanz. | "Einen Ort oder eine Gruppe suchen, wo meine Interessen willkommen sind", "Ein echtes Gespräch führen — ohne Rollenmaske", "Herausfinden, worin ich mich von anderen unterscheide und worin nicht" | Rückzug bei erster Ablehnung, Vergleiche die Differenz betonen |
| `dependence` | Abhängigkeit / Inkompetenz | Eigene Kompetenz in kleinen Schritten erleben; Entscheidungen treffen ohne Bestätigung einzuholen. | "Eine Alltagsentscheidung allein treffen und die Konsequenz tragen", "Eine Aufgabe übernehmen, die ich bisher immer abgegeben habe", "Erfolge und Misserfolge als eigene Erfahrung anerkennen — nicht delegieren" | Rat einholen als Vermeidung, Selbstzweifel nach kleinen Fehlern |
| `vulnerability` | Anfälligkeit für Schaden oder Krankheit | Eigene Resilienz-Erfahrungen sammeln; zwischen realen und phantasierten Gefahren unterscheiden lernen. | "Eine Situation, die ich gefürchtet habe, bewusst auf mich zukommen lassen und beobachten", "Einen Notfallplan erstellen — dann den Plan weglegen", "Realistische Wahrscheinlichkeiten von Katastrophen recherchieren" | Vermeidung als kurzfristige Beruhigung, Katastrophisieren |
| `enmeshment` | Verstrickung / Unterentwickeltes Selbst | Eigene Werte, Vorlieben und Meinungen getrennt von Bezugspersonen entwickeln; Grenzen als Fürsorge statt als Verrat verstehen. | "Drei eigene Meinungen formulieren, die sich von denen meiner Familie unterscheiden", "Eine Entscheidung treffen, die mir wichtig ist — ohne vorherige Abstimmung", "Eigene Zeit und eigenen Raum bewusst einfordern" | Schuldgefühle bei Eigenständigkeit, diffuse Grenzen |
| `failure` | Versagen | Eigene Leistungen nach eigenen Maßstäben bewerten; zwischen Versagen als Ereignis und Versagen als Identität unterscheiden. | "Einen vergangenen Erfolg konkret beschreiben — ohne Relativierung", "Eine neue Aufgabe angehen, ohne das Ergebnis mit anderen zu vergleichen", "Eigene Lernkurve dokumentieren statt Endergebnis zu bewerten" | Prokrastination als Vermeidung von Versagen, vorauseilender Selbstschutz |
| `entitlement` | Anspruchlichkeit / Grandiosität | Empathie und Gegenseitigkeit in Beziehungen stärken; Grenzen als Teil sozialer Verbundenheit akzeptieren. | "Eine Situation identifizieren, in der die Bedürfnisse anderer genauso wichtig waren wie meine", "Einen Wunsch aufgeben — und beobachten, was wirklich passiert", "Feedback von anderen einholen und hören — ohne sofort zu widersprechen" | Ärger bei Einschränkungen, Rechtfertigungsmuster |
| `insufficient_self_control` | Unzureichende Selbstkontrolle | Toleranz für Aufschub und Unbehagen schrittweise trainieren; kleine Verbindlichkeiten einhalten. | "Eine unangenehme Aufgabe in kleinen Schritten beenden — ohne Ablenkung", "Einen Impuls beobachten ohne ihm sofort nachzugeben", "Eine tägliche Routine aufbauen und eine Woche durchhalten" | Unmittelbare Belohnung als Antrieb, Frustrationsvermeidung |
| `subjugation` | Unterwerfung | Eigene Wünsche und Grenzen wahrnehmen und in sicheren Kontexten ausdrücken; Autorität hinterfragen statt automatisch zu gehorchen. | "Einmal Nein sagen — in einer Situation mit geringem Risiko", "Einen eigenen Wunsch formulieren, ohne ihn sofort zu relativieren", "Beobachten, wann ich gehorche aus Pflicht und wann aus eigenem Willen" | Angst vor Strafe bei Ablehnung, passive Aggression |
| `self_sacrifice` | Selbstaufopferung | Eigene Bedürfnisse als gleichwertig anerkennen; Fürsorge aus Stärke statt aus Pflicht geben. | "Einen eigenen Bedarf anmelden — ohne Entschuldigung", "Prüfen: Gebe ich gerade, weil ich will, oder weil ich muss?", "Eine Bitte ablehnen und beobachten, was wirklich passiert" | Erschöpfung als Warnsignal ignorieren, Schuldgefühle bei Ablehnung |
| `approval_seeking` | Streben nach Zustimmung | Innere Wertmaßstäbe entwickeln, die unabhängig von äußerer Bestätigung tragen; Selbstausdruck üben. | "Eine Meinung vertreten, von der ich weiß, dass andere sie nicht teilen werden", "Eine Entscheidung treffen, ohne vorher die Reaktionen anderer vorauszudenken", "Eigene Zufriedenheit als Kriterium nutzen — nicht Applaus" | Anpassungsverhalten als Automatismus, Identitätsverlust |
| `negativity` | Negativität / Pessimismus | Gleichgewicht zwischen realistischer Vorsicht und offener Wahrnehmung herstellen; positive Fakten registrieren ohne sie zu entwerten. | "Täglich drei Dinge notieren, die gut gelaufen sind — sachlich, ohne Bewertung", "Eine Sorge konkret prüfen: Ist sie wahrscheinlich oder nur möglich?", "Einen Plan für ein Worst-Case-Szenario erstellen — und dann loslassen" | Grübelschleifen, Suche nach Bestätigung für Negativerwartungen |
| `emotional_inhibition` | Emotionale Gehemmtheit | Gefühlen Raum geben; sichere Ausdrucksformen finden; Spontaneität in kontrollierten Schritten üben. | "Ein Gefühl benennen — gegenüber mir selbst, schriftlich", "In einer sicheren Situation eine Emotion zeigen — beobachten, was passiert", "Eine spontane Reaktion zulassen statt sie sofort zu korrigieren" | Kontrollverlust als Bedrohung erlebt, Kognitivierung von Emotion |
| `unrelenting_standards` | Hohe Standards / Überkritik | Ausreichend als Kategorie akzeptieren; Ruhe als produktiven Zustand rehabilitieren. | "Eine Aufgabe bewusst auf 80 % abschließen — und gut damit sein", "Pausen planen und einhalten — nicht als Belohnung, sondern als Bedingung", "Den eigenen Maßstab für 'genug' klar definieren und aufschreiben" | Selbstkritik nach Pausen, Perfektion als Identität |
| `punitiveness` | Bestrafen | Mitgefühl für sich selbst und andere kultivieren; Fehler als menschlich und lernbar rahmen. | "Einen Fehler beschreiben, den ich mir vergeben möchte — konkret", "Eine Reaktion auf einen Fehler anderer wählen, die mit Mitgefühl beginnt", "Den Unterschied zwischen Konsequenzen und Bestrafung klären" | Strenge als Gerechtigkeit erlebt, Mitgefühl als Schwäche |

**constants.ts file location rationale:** `frontend/src/modules/ysq/hints.ts` keeps schema therapy content with the YSQ module (not in `synthese/`), consistent with the pattern that module-specific content lives in the module's folder. The `InsightsBlock` component in `synthese/` imports from it — a cross-module read, which is already established (e.g., `SyntheseModule.tsx` imports `YSQ_SCHEMAS` from `ysq/constants`).

---

### HINT-02: InsightsBlock Component

**Score calculation — verified against `computeYsqDelta`:** [VERIFIED: codebase `SyntheseModule.tsx` lines 170-199]

```typescript
// Pattern extracted from computeYsqDelta (lines 180-198 in SyntheseModule.tsx)
// schemaIdx * 5 through schemaIdx * 5 + 4 gives the 5 items for schema i
// If ALL 5 items are null → schema was skipped → score is null
// Otherwise: sum with null items counting as 0

function computeSchemaScores(answers: (number | null)[]): Array<{ schema: YsqSchema; score: number }> {
  return YSQ_SCHEMAS.map((schema, i) => {
    const items = answers.slice(i * 5, i * 5 + 5);
    if (items.every((v) => v === null)) return null;
    const score = items.reduce<number>((s, v) => s + (v ?? 0), 0);
    return { schema, score };
  }).filter((x): x is { schema: YsqSchema; score: number } => x !== null);
}

function getTop3(answers: (number | null)[]): Array<{ schema: YsqSchema; score: number }> {
  return computeSchemaScores(answers)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
```

**Guard condition (HINT-02 requirement: only when YSQ is filled):** [VERIFIED: `YsqData.answers` is `YsqAnswer[] | null` — outer null = questionnaire never completed]

```typescript
// In InsightsBlock:
const ysqData = allData?.ysq as YsqData | undefined;
if (!ysqData?.answers) return null; // questionnaire not yet completed
```

**Score scale reference:** [VERIFIED: `ysq/constants.ts` line 213]
- YSQ-S3 uses 1–6 Likert scale
- Max schema score = 5 items × 6 = 30
- Display score as e.g. "18 / 30"

**Component location:** `frontend/src/modules/synthese/InsightsBlock.tsx` — local to synthese module, not in `components/` (it is not a shared primitive; it is synthese-specific).

**InsightsBlock placement on Synthese page:** After the module summary cards, before the Snapshots section. Rationale: summaries first (context), then insights (interpretation), then snapshot management (archive). This follows the information hierarchy: what you have → what it means → how to track change over time.

**InsightsBlock internal structure per schema:**

```
┌─────────────────────────────────────────────────────┐
│  SCHEMA-NAME                          Score: 22 / 30 │
│  Heilungsrichtung (1-2 Sätze)                        │
│                                                       │
│  Zielvorschläge                                       │
│    · Vorschlag 1                                      │
│    · Vorschlag 2                [Als Ziel erkunden]   │
│    · Vorschlag 3                                      │
│                                                       │
│  Mögliche Hindernisse                                 │
│    · Hindernis 1                                      │
└─────────────────────────────────────────────────────┘
```

**Styling:** Use `Card` component. Accent color (`text-accent`) for schema name. `text-ink-faint` for section labels. `border-l-2 border-line-soft pl-4` for suggestion lists. Button: `text-sm text-ocean hover:text-ink` — ocean tone fits the reflective/forward-looking quality of goal exploration.

---

### HINT-03: Values Gap Component

**Existing gap logic — verified:** [VERIFIED: `ValuesSummary.tsx` lines 29-32 and `buildTextReport` lines 60-75 in `SyntheseModule.tsx`]

`ValuesSummary.tsx` already computes `gap = weight - living` and filters `gap >= 2` for the "Größte Lücken" section. The Synthese page already renders `ValuesSummary` inside a Card (via the `dataModules` loop, line 339-353 in `SyntheseModule.tsx`).

**What HINT-03 requires that doesn't exist yet:** A contextual hint text per gap-value on the Synthese page — "Dieser Wert wird wenig gelebt — ein möglicher Bereich für ein Ziel." This is a new visual treatment, distinct from the existing `ValuesSummary` (which already shows dots but no goal-hint text).

**Two implementation options:**

**Option A:** Add `ValuesGapHints` section directly inside `InsightsBlock.tsx` — collocates all "actionable insights" in one component.

**Option B:** Extend `ValuesSummary.tsx` with an optional `showGoalHints` prop.

**Recommendation: Option A.** The hint text is a Synthese-page concern, not a Values module concern. `ValuesSummary` is used in both the Values module card AND the Synthese page — adding a conditional prop creates coupling. A separate section inside `InsightsBlock` (or as a sibling component `ValuesGapBlock.tsx` within `synthese/`) keeps the Values module clean.

**Gap items source:** `(allData?.values as ValuesData | undefined)?.selected ?? []` — same pattern already used in `buildTextReport`.

**Filter:** `item.weight - item.living >= 2` — consistent with `ValuesSummary.tsx` and `buildTextReport`. [VERIFIED: codebase]

**Hint text constant:** Goes in `frontend/src/modules/synthese/constants.ts` (new file — synthese module gets its own constants file for UI strings, consistent with HINT-05). Content: `"Dieser Wert wird wenig gelebt — ein möglicher Bereich für ein Ziel."` [ASSUMED — exact wording subject to user preference]

---

### HINT-04: Navigate + Prefill Mechanism

**The architectural challenge:** `SyntheseModule` receives `{ data, onChange, allData }` from `App.tsx`. It has no direct access to `setActiveId`. Navigating from Synthese to Goals AND pre-filling a new goal requires coordination between three components.

**Three options analyzed:**

**Option A — Extend `ModuleProps` with `onNavigatePrefill` callback:** [RECOMMENDED]

```typescript
// frontend/src/modules/registry.ts
export interface ModuleProps<T> {
  data: T;
  onChange: (next: T) => void;
  allData: AllData;
  onNavigatePrefill?: (moduleId: string, prefill?: unknown) => void; // NEW optional
}
```

In `App.tsx`:
```typescript
// Add state for pending prefill
const [pendingPrefill, setPendingPrefill] = useState<{ moduleId: string; data: unknown } | null>(null);

function handleNavigatePrefill(moduleId: string, prefill?: unknown) {
  if (prefill !== undefined) {
    setPendingPrefill({ moduleId, data: prefill });
  }
  setActiveId(moduleId);
}

// Pass to active component:
<active.Component
  data={state.data}
  onChange={handleChange(active.id)}
  allData={allData}
  onNavigatePrefill={handleNavigatePrefill}
/>
```

`GoalsModule` checks `allData.__prefill` (or receives it via a prop — see below):

The cleanest delivery mechanism: put `pendingPrefill` data into `allData` under a reserved key (`__prefill`) when rendering GoalsModule, then clear it after one render cycle.

**Alternative delivery:** Pass `pendingPrefill` as a dedicated prop to the component. But this requires changing `ModuleProps<T>` more substantially.

**Simplest clean approach within current architecture:**

```typescript
// App.tsx — pendingPrefill cleared after GoalsModule mounts and reads it
const allDataWithPrefill = activeId === pendingPrefill?.moduleId
  ? { ...allData, __prefill: pendingPrefill.data }
  : allData;

// After GoalsModule reads it, clear via:
// GoalsModule calls onChange (which triggers a save) — App.tsx clears pendingPrefill in handleChange
// OR: GoalsModule calls a provided clearPrefill() callback
```

**Simpler alternative — clear on navigation:** `App.tsx` clears `pendingPrefill` whenever `activeId` changes away from the target module. This avoids double-render complexity.

**Option B — URL hash/query params:** Using `window.location.hash` or `URLSearchParams` would work but introduces browser history side effects and requires parsing logic. Incompatible with the offline single-file HTML mode (no router). Not recommended.

**Option C — Zustand/shared state:** Explicitly ruled out by CLAUDE.md ("Kein State-Management-Framework"). Not an option.

**RECOMMENDED IMPLEMENTATION (Option A, variant):**

```typescript
// App.tsx additions:
const [goalPrefill, setGoalPrefill] = useState<{ title: string; description: string } | null>(null);

function handleNavigateToGoals(prefill: { title: string; description: string }) {
  setGoalPrefill(prefill);
  setActiveId("goals");
}

// Pass goalPrefill into allData when goals is active:
const allData = {
  ...Object.fromEntries(modules.map((m) => [m.id, store[m.id]?.data])),
  ...(activeId === "goals" && goalPrefill ? { __goalPrefill: goalPrefill } : {}),
};

// In SyntheseModule, receive callback via ModuleProps extension:
onNavigateToGoals?: (prefill: { title: string; description: string }) => void;
```

**GoalsModule reads prefill on mount:**

```typescript
// GoalsModule.tsx — add useEffect
useEffect(() => {
  const prefill = (allData as any).__goalPrefill as { title: string; description: string } | undefined;
  if (!prefill) return;
  const fresh: Goal = {
    id: uid(),
    title: prefill.title,
    description: prefill.description,
    value_refs: [],
    horizon: "quarter",
    first_step: "",
    status: "active",
  };
  onChange({ ...data, goals: [...data.goals, fresh] });
  setOpenId(fresh.id);
  // Clear prefill: App.tsx must clear goalPrefill after GoalsModule mounts
  // Simplest: App.tsx clears goalPrefill in the same useEffect that watches activeId
}, []); // empty dep array — runs once on mount only
```

**Clearing prefill:** In `App.tsx`, clear `goalPrefill` when `activeId` changes away from "goals":

```typescript
useEffect(() => {
  if (activeId !== "goals") {
    setGoalPrefill(null);
  }
}, [activeId]);
```

**Prefill content:** The button in the InsightsBlock sends:
```typescript
{
  title: schema.label,                         // e.g., "Verlassenheit / Instabilität"
  description: hint.goalSuggestions[0],        // first goal suggestion as default text
}
```

The user sees a new goal pre-opened in edit mode with schema name as title and first suggestion as description. They can edit both fields freely before saving.

**Type safety note:** `__goalPrefill` is a private protocol key. It should be typed as `unknown` in `AllData` (which is already `Record<string, unknown>`). No type changes needed to `AllData`.

---

### HINT-05: Constants Structure

All insight texts in `constants.ts` files. No inline strings in component body. [VERIFIED pattern: existing modules follow this — `goals/constants.ts` has `HORIZON_LABEL`, `STATUS_LABEL`, `GOAL_PROMPTS`; `ysq/constants.ts` has all schema content]

**New files created in this phase:**

| File | Content |
|------|---------|
| `frontend/src/modules/ysq/hints.ts` | `SchemaHint` interface, `YSQ_HINTS` array, `YSQ_HINTS_MAP` |
| `frontend/src/modules/synthese/constants.ts` | `VALUES_GAP_HINT_TEXT`, any other Synthese UI strings |

**No inline strings rule applies to:**
- Schema healing direction text
- Goal suggestion bullet text
- Obstacle hint text
- Values gap hint text
- Section label strings (use Tailwind + className, or constants for translatable strings)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/modules/ysq/hints.ts` | **CREATE** | 18 schema → hints mappings (HINT-01, HINT-05) |
| `frontend/src/modules/synthese/constants.ts` | **CREATE** | Values gap hint text and other Synthese UI strings (HINT-05) |
| `frontend/src/modules/synthese/InsightsBlock.tsx` | **CREATE** | YSQ top-3 blocks + Values gap section (HINT-02, HINT-03) |
| `frontend/src/modules/synthese/SyntheseModule.tsx` | **MODIFY** | Import and render `InsightsBlock`; accept + pass `onNavigateToGoals` callback (HINT-02, HINT-04) |
| `frontend/src/modules/goals/GoalsModule.tsx` | **MODIFY** | Read `allData.__goalPrefill` on mount; add prefill useEffect (HINT-04) |
| `frontend/src/modules/registry.ts` | **MODIFY** | Add optional `onNavigateToGoals` to `ModuleProps` (HINT-04) |
| `frontend/src/App.tsx` | **MODIFY** | Add `goalPrefill` state; `handleNavigateToGoals`; inject `__goalPrefill` into allData; clear on navigation (HINT-04) |

**No backend files changed.**

---

## Validation Architecture

### Test Framework

No Vitest is currently installed in the frontend. `package.json` has no test script and no vitest dependency. [VERIFIED: `frontend/package.json`]

| Property | Value |
|----------|-------|
| Framework | Vitest (not yet installed — Wave 0 gap) |
| Config file | `frontend/vitest.config.ts` — Wave 0 gap |
| Quick run command | `npx vitest run src/modules/ysq/hints.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HINT-01 | All 18 schema IDs present in `YSQ_HINTS_MAP` | unit | `npx vitest run src/modules/ysq/hints.test.ts` | Wave 0 gap |
| HINT-02 | `getTop3` returns correct schemas for known answers array | unit | `npx vitest run src/lib/insights.test.ts` | Wave 0 gap |
| HINT-02 | InsightsBlock returns null when `answers === null` | unit | `npx vitest run src/lib/insights.test.ts` | Wave 0 gap |
| HINT-03 | Gap filter `weight - living >= 2` returns correct items | unit | `npx vitest run src/lib/insights.test.ts` | Wave 0 gap |
| HINT-04 | `goalPrefill` is set after `handleNavigateToGoals` call | unit | manual / integration | Wave 0 gap |
| HINT-05 | No string literals in `InsightsBlock.tsx` body | lint / code review | manual | — |

### Sampling Rate
- **Per task commit:** `npx vitest run src/modules/ysq/hints.test.ts src/lib/insights.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** All unit tests green + manual browser verification of HINT-04 flow

### Wave 0 Gaps

- [ ] `npm install --save-dev vitest @vitest/ui` — Vitest not in package.json
- [ ] `frontend/vitest.config.ts` — config file for Vitest with jsdom environment
- [ ] `frontend/src/modules/ysq/hints.test.ts` — covers HINT-01 (all 18 IDs present)
- [ ] `frontend/src/lib/insights.test.ts` — covers HINT-02 score calculation, HINT-03 gap filter

**Vitest config pattern** (for React/TypeScript project without existing config):

```typescript
// frontend/vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

**Note on scope:** Per REQUIREMENTS.md, TEST-03 ("Vitest-Tests für Schema-Insights-Logik") is listed as a v1.2+ future requirement. The Vitest infrastructure is a Wave 0 gap for Phase 5 — if the planner opts to defer tests to a later phase (consistent with TEST-03 being v1.2+), HINT-01 through HINT-05 can be verified manually in the browser. The planner should make this tradeoff explicit.

---

## Known Pitfalls

### Pitfall 1: Prefill useEffect fires multiple times

**What goes wrong:** GoalsModule's prefill `useEffect` with `[]` deps fires once on mount. But if GoalsModule is unmounted and remounted (user navigates away and back), the effect fires again — but `__goalPrefill` may still be present in allData if App.tsx hasn't cleared it.
**Why it happens:** The clearing logic in App.tsx triggers on `activeId !== "goals"`, but if the user navigates Synthese → Goals → Values → Goals, goalPrefill might still be set from the first navigation.
**How to avoid:** Clear `goalPrefill` in App.tsx not just when leaving "goals" but also immediately after GoalsModule's `useEffect` signals it has consumed the prefill. One clean pattern: GoalsModule calls `onChange` with the new goal (which is a normal save operation); App.tsx clears goalPrefill in a `useEffect` that watches `store["goals"].data` — if the data has changed after goalPrefill was set, clear it.
**Simpler alternative:** Clear goalPrefill in App.tsx after a single render cycle using `setTimeout(() => setGoalPrefill(null), 0)` in `handleNavigateToGoals`. This works because GoalsModule reads the prefill on the same render tick, then the cleanup fires.

### Pitfall 2: Score calculation edge case — all items null

**What goes wrong:** If a user starts the YSQ questionnaire but skips all items for a schema (answers all null for indices `i*5..i*5+4`), `computeYsqDelta` returns `null` for that schema's score. The top-3 selection must exclude null-score schemas.
**Why it happens:** The filter `items.every((v) => v === null)` is the guard. Without it, a sum of five nulls = 0, which is falsely the lowest valid score.
**How to avoid:** The `getTop3` function must filter out null-score schemas before sorting. The existing `computeYsqDelta` pattern in SyntheseModule.tsx already handles this correctly — copy the exact pattern. [VERIFIED: `SyntheseModule.tsx` lines 180-198]

### Pitfall 3: InsightsBlock visible during SyntheseModule snapshot comparison section

**What goes wrong:** The InsightsBlock is always visible when the user scrolls down, even while they are comparing two snapshots. Cognitively this is fine, but placing it below the snapshot section would bury it.
**How to avoid:** Place InsightsBlock immediately after the module summary cards loop (before the Snapshots `<section>`). This is already the recommended placement. The `print:hidden` class pattern on the snapshot section suggests the page has print/non-print sections — InsightsBlock should NOT have `print:hidden` since insights are valuable in a printed report.

### Pitfall 4: TypeScript strict mode — `allData.__goalPrefill` access

**What goes wrong:** TypeScript strict mode is enabled. Accessing `(allData as any).__goalPrefill` is a casting smell that will generate a warning.
**How to avoid:** Define a local type guard:

```typescript
interface GoalPrefillData {
  title: string;
  description: string;
}

function isGoalPrefill(v: unknown): v is GoalPrefillData {
  return typeof v === "object" && v !== null && "title" in v && "description" in v;
}

// In GoalsModule useEffect:
const raw = (allData as Record<string, unknown>).__goalPrefill;
if (!isGoalPrefill(raw)) return;
```

### Pitfall 5: Hint text display when schema has no entry in YSQ_HINTS_MAP

**What goes wrong:** If `YSQ_HINTS_MAP.get(schema.id)` returns `undefined` (e.g., if a new schema is added to YSQ_SCHEMAS without a corresponding hint), the InsightsBlock will crash or display nothing.
**How to avoid:** Add a guard: `const hint = YSQ_HINTS_MAP.get(schema.id); if (!hint) return null;`. Also: maintain the invariant that `YSQ_HINTS` has exactly 18 entries matching `YSQ_SCHEMAS` IDs — a unit test in `hints.test.ts` should assert this.

---

## Code Examples

### Score Calculation (from verified codebase pattern)

```typescript
// Source: SyntheseModule.tsx computeYsqDelta, lines 180-198 [VERIFIED]
// YSQ_MAX_SCHEMA_SCORE = 30 [VERIFIED: ysq/constants.ts line 213]

function computeSchemaScore(answers: (number | null)[], schemaIdx: number): number | null {
  const items = answers.slice(schemaIdx * 5, schemaIdx * 5 + 5);
  if (items.every((v) => v === null)) return null;
  return items.reduce<number>((s, v) => s + (v ?? 0), 0);
}
```

### Gap Calculation (from verified codebase pattern)

```typescript
// Source: ValuesSummary.tsx lines 29-32 and buildTextReport lines 60-75 [VERIFIED]

function getValueGaps(selected: ValueItem[]): ValueItem[] {
  return selected
    .filter((v) => v.weight - v.living >= 2)
    .sort((a, b) => (b.weight - b.living) - (a.weight - a.living));
}
```

### ModuleProps Extension

```typescript
// Source: frontend/src/modules/registry.ts [VERIFIED - current shape]
// Extension pattern — add optional callback:

export interface ModuleProps<T> {
  data: T;
  onChange: (next: T) => void;
  allData: AllData;
  onNavigateToGoals?: (prefill: { title: string; description: string }) => void; // NEW
}
```

### InsightsBlock skeleton

```typescript
// frontend/src/modules/synthese/InsightsBlock.tsx [NEW]
import { Card } from "../../components/Card";
import { YSQ_SCHEMAS, YSQ_MAX_SCHEMA_SCORE } from "../ysq/constants";
import { YSQ_HINTS_MAP } from "../ysq/hints";
import type { YsqData } from "../ysq/types";
import type { ValuesData, ValueItem } from "../values/types";
import type { AllData } from "../../types";
import { VALUES_GAP_HINT_TEXT } from "./constants";

interface Props {
  allData: AllData;
  onNavigateToGoals?: (prefill: { title: string; description: string }) => void;
}

export function InsightsBlock({ allData, onNavigateToGoals }: Props) {
  const ysqData = allData?.ysq as YsqData | undefined;
  if (!ysqData?.answers) return null;

  // ... compute top3 schemas and value gaps ...
  return (
    <div className="mb-6 space-y-4">
      {/* Top-3 schema blocks */}
      {/* Values gap section */}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All insights in single `buildTextReport()` function (text only) | Visual `InsightsBlock` component with actionable "Als Ziel erkunden" button | Phase 5 | Insights become navigable, not just readable |
| Values gap shown only in `ValuesSummary` inside Values card | Values gap also surfaced in Synthese page with goal-creation hint | Phase 5 | Same data, new interpretation layer |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 18 schema healing directions, goal suggestions, and obstacle hints are clinically appropriate phrasings grounded in schema therapy | HINT-01 mapping table | User should review; wrong phrasing could be unhelpful or misleading |
| A2 | The exact wording "Dieser Wert wird wenig gelebt — ein möglicher Bereich für ein Ziel." is appropriate for the values gap hint | HINT-03 | Minor — user may prefer different phrasing; easy to change in constants.ts |
| A3 | "Als Ziel erkunden" is the right button label (vs. "Zu Zielen", "Ziel anlegen", etc.) | HINT-04 | Minor UX preference — easy to change |
| A4 | InsightsBlock placement after module summaries and before Snapshots is the right UX order | HINT-02 | If user prefers it at top, one-line move in SyntheseModule.tsx |
| A5 | Ocean tone (`text-ocean`) for the "Als Ziel erkunden" button is appropriate (forward-looking/ACT tone) | HINT-02 | Minor styling preference |

---

## Open Questions

1. **Vitest setup scope for Phase 5**
   - What we know: Vitest is not installed; TEST-03 is listed as v1.2+ in REQUIREMENTS.md
   - What's unclear: Should Phase 5 include Vitest Wave 0 setup, or defer testing entirely?
   - Recommendation: Include Vitest install + a single `hints.test.ts` that asserts all 18 IDs are present. This is < 30 minutes of work and catches the most common regression (schema ID drift). Full behavior tests can follow in TEST-03.

2. **`onNavigateToGoals` vs. `onNavigatePrefill` (generic)**
   - What we know: Only Goals needs prefill in v1.1; future HINT-EXT-02 would add Obstacles prefill
   - What's unclear: Should the prop be typed specifically for Goals or generically?
   - Recommendation: Type it specifically for Goals now (`onNavigateToGoals`) with the exact prefill shape. If HINT-EXT-02 ships, refactor to a generic prop at that point. YAGNI.

---

## Environment Availability

Step 2.6: SKIPPED — phase is frontend-only React/TypeScript with no external dependencies beyond what is already installed. Node 20 and npm confirmed available (Docker Compose setup verified in prior phases).

---

## Security Domain

Step 2.6 (security): Phase 5 adds no auth endpoints, no data storage, no user input that reaches the backend. All new code is pure frontend computation over data already loaded in memory. No ASVS categories apply.

---

## Sources

### Primary (HIGH confidence)
- `frontend/src/modules/synthese/SyntheseModule.tsx` — score calculation pattern (lines 170-199), gap pattern (lines 60-75), allData access pattern (line 220+)
- `frontend/src/modules/ysq/constants.ts` — all 18 schema IDs, labels, and YSQ_MAX_SCHEMA_SCORE
- `frontend/src/modules/ysq/types.ts` — `YsqData.answers` shape
- `frontend/src/modules/values/types.ts` — `ValueItem` shape
- `frontend/src/modules/goals/GoalsModule.tsx` — `add()` function, Goal shape construction
- `frontend/src/modules/registry.ts` — `ModuleProps` interface
- `frontend/src/App.tsx` — navigation state (`setActiveId`, `allData` construction, `handleChange`)
- `frontend/src/types.ts` — `AllData` type
- `frontend/package.json` — confirmed no Vitest installed

### Secondary (MEDIUM confidence)
- Schema therapy literature grounding for HINT-01 content (Young, J.E., Klosko, J.S., & Weishaar, M.E. (2003). Schema Therapy: A Practitioner's Guide) — training knowledge, not verified in this session

### Tertiary (LOW confidence — see Assumptions Log)
- A1-A5: UX and content decisions based on project conventions and training knowledge; not externally verified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all technologies already in use; no new dependencies (except optional Vitest)
- Architecture: HIGH — all patterns verified from codebase source files
- Pitfalls: HIGH — derived from code analysis of actual data shapes and existing patterns
- HINT-01 content: LOW — clinical content assumed from training knowledge; requires user review

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (stable codebase; no moving dependencies)
