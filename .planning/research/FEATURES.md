# Features Research: Kompass — Reflection Tool, Milestone 2

**Domain:** Personal psychological reflection tool (ACT, schema therapy, mood tracking)
**Brownfield context:** Core modules complete. Adding YSQ, checkin backend, snapshots, export/import.
**Researched:** 2026-04-21
**Overall confidence:** HIGH for PHQ-9/GAD-7 clinical standards; HIGH for YSQ schema taxonomy; MEDIUM for snapshot/time-series UX patterns

---

## YSQ Module — Digital Implementation Patterns

### The 18 Early Maladaptive Schemas (canonical YSQ-L3 / YSQ-S3)

Organized across five schema domains. These abbreviations match the scoring keys used in YSQ-S3 short form (the standard instrument for self-help contexts — 90 items, 5 per schema):

**Domain I: Disconnection and Rejection**
| Code | Schema Name |
|------|-------------|
| AB | Abandonment/Instability |
| MA | Mistrust/Abuse |
| ED | Emotional Deprivation |
| DS | Defectiveness/Shame |
| SI | Social Isolation/Alienation |

**Domain II: Impaired Autonomy and Performance**
| Code | Schema Name |
|------|-------------|
| DI | Dependence/Incompetence |
| VH | Vulnerability to Harm or Illness |
| EM | Enmeshment/Undeveloped Self |
| FA | Failure to Achieve |

**Domain III: Impaired Limits**
| Code | Schema Name |
|------|-------------|
| ET | Entitlement/Grandiosity |
| IS | Insufficient Self-Control/Self-Discipline |

**Domain IV: Other-Directedness**
| Code | Schema Name |
|------|-------------|
| SB | Subjugation |
| SS | Self-Sacrifice |
| AS | Approval-Seeking/Recognition-Seeking |

**Domain V: Over-vigilance and Inhibition**
| Code | Schema Name |
|------|-------------|
| NP | Negativity/Pessimism |
| EI | Emotional Inhibition |
| US | Unrelenting Standards/Hypercriticalness |
| PU | Punitiveness |

Note: A revised 20-schema version (YSQ-R, 2022) exists, replacing Emotional Inhibition and Punitiveness with two new constructs. For this project, the classic 18-schema model is the right choice — it is the version the reference HTML was built around, has the most extensive clinical validation, and is what users who have encountered schema therapy will recognize.

### Digital presentation: how it is done well

**Item presentation pattern (HIGH confidence — standard clinical practice):**

The YSQ-S3 presents 90 statements. Each is rated on a 1–6 Likert scale:
- 1 = Completely untrue of me
- 2 = Mostly untrue of me
- 3 = Slightly more true than untrue
- 4 = Moderately true of me
- 5 = Mostly true of me
- 6 = Describes me perfectly

Each schema has exactly 5 items. Score per schema = sum of its 5 items (range 5–30). Mean per schema = sum / 5 (range 1.0–6.0). Use mean for comparability across instruments.

**Paging strategy:** Present one schema at a time (5 items per page/section), not all 90 at once. This reduces cognitive load and creates natural save-points. Users can return and complete sections in multiple sessions. Progress indicator ("Schema 4 von 18") is important for completion motivation.

**Scoring display after completion:**

The most effective visualization for YSQ results in self-help tools is a **bar chart sorted by score descending**, not a radar/spider chart. The reason: radar charts require ordering all 18 axes meaningfully, and the overall shape is misleading (adjacent schemas appear related when they may not be). A simple ranked bar chart — each bar colored by domain — lets users immediately see their top 3–5 elevated schemas, which is clinically the most actionable information.

Domain grouping as a secondary visual: after the ranked bars, group schema scores by domain with a header per domain. This preserves the clinical structure without forcing it into a spider shape.

**Threshold annotation:** Draw a horizontal reference line at score 3.5 (mean scale midpoint). Schemas above this line warrant attention. Some clinical frameworks use 4.0 as the threshold for "elevated." Show the reference line but do not alarm-color it — this is self-reflection, not diagnosis.

**Recommendations for Kompass YSQ implementation:**

1. Item storage: store raw answers (array of 90 integers, 1–6), not pre-summed scores. This allows retroactive re-scoring if the schema taxonomy changes and preserves the full assessment record.
2. Completion state: track which schemas have been answered (allow partial saves, resume later).
3. Schema notes: after seeing results, allow a short free-text reflection per elevated schema ("What I recognize in this schema for myself"). This connects the quantitative result to the qualitative reflection work in the beliefs modules.
4. Re-assessment over time: the YSQ is typically administered once initially, then optionally repeated after significant life events or therapy phases (not weekly like PHQ-9/GAD-7). Do not prompt re-assessment on a fixed schedule.
5. Cross-module link: schema results should be surfaceable in the BeliefSchema module as context. A user working on a core belief about failure can see their FA schema score as supporting evidence. This is a display-only link initially — no data duplication needed.

---

## Snapshot / Time-Series Patterns

### What a snapshot is in this context

A snapshot captures the full state of all modules at a point in time as an immutable record. The primary use case is: "How have my values, beliefs, and goals shifted over 6 months? What progress have I made?" Secondary use: backup / restore point before major edits.

### Granularity recommendation

**Monthly snapshots, manually triggered** — not automatic, not weekly. The reasoning:

- This is reflective work, not daily mood logging. Meaningful change in values, beliefs, and schema patterns takes weeks or months. Weekly snapshots produce noise, not signal.
- Manual triggering creates a ritual: the user consciously decides "I want to mark this moment." This aligns with ACT practice (intentional action, not automaticity).
- Monthly cadence matches the rhythm of most psychotherapy. A user can take a snapshot after a significant session or period.
- Automatic snapshots (e.g., nightly) fill storage with redundant data and dilute the meaning of "I took a snapshot."

Exception: PHQ-9/GAD-7 check-in entries are already time-series data at weekly granularity — they do not need a separate snapshot mechanism. They are their own longitudinal record.

### What to compare across snapshots

**High value — show these:**

| What | How to display | Why meaningful |
|------|---------------|----------------|
| Values: top 5 wichtig vs. gelebt delta | Side-by-side bar or dot plot showing change in ratings | Core use case — did lived values shift toward stated values? |
| Schema scores (YSQ): score per schema, two snapshots overlaid | Dual bar chart, sorted by latest score | Shows therapeutic progress on specific schemas |
| Beliefs: count of active ("lebendig") beliefs by valence | Number change with delta indicator | Rough proxy for shifting belief landscape |
| Goals: count completed vs. active | Simple count table with trend | Motivational; easy to scan |
| PHQ-9/GAD-7 summary at snapshot time | Pull last check-in before snapshot date | Contextualizes emotional state at each snapshot moment |

**Low value — do not show these:**

- Word-for-word diff of free-text fields (too noisy, too private to display)
- Exact obstacle counts (too granular, too variable)
- Percentages of "completion" across all modules (meaningless aggregate)

### Snapshot UI pattern recommendation

**Snapshot list view:** Chronological list, newest first. Each row: date, optional label ("after therapy phase 1"), and a "Compare" button that opens a side-by-side view with the previous snapshot.

**Comparison view:** Two columns — "then" and "now." Each module block shows the delta visually. Keep it scannable, not exhaustive. The user should be able to read the comparison in 2–3 minutes.

**Snapshot taking:** A single "Snapshot nehmen" button in the Synthese module. Prompt for an optional label. Confirm action. Do not make it more complex than this.

**Storage concern:** Snapshots are full data copies. With 10 snapshots and moderate module data, this is still under 100KB total — not a meaningful storage concern for SQLite or localStorage.

---

## PHQ-9/GAD-7 Historical Display

### What already exists in Kompass

The existing CheckinModule already implements the core pattern correctly:
- TrendChart component with last 12 entries, threshold lines at 5/10/15
- Score + severity label on latest entry
- Chronological entry list with delete
- CrisisBanner on PHQ-9 item 9 > 0

**This implementation is already at or above standard practice for self-help apps.** The main gap is that it only works in local-storage mode (no backend persistence).

### Clinical standards for display (HIGH confidence)

**PHQ-9 thresholds (0–27 scale):**
- 0–4: minimal (no action needed)
- 5–9: mild (monitor)
- 10–14: moderate (clinically significant, structured follow-up warranted)
- 15–19: moderately severe (active treatment indicated)
- 20–27: severe (urgent evaluation)

A 5-point change between administrations is the validated minimum for a clinically meaningful shift. Show delta from previous check-in as a secondary indicator.

**GAD-7 thresholds (0–21 scale):**
- 0–4: minimal
- 5–9: mild
- 10–14: moderate
- 15–21: severe

**Display interval:** Every 2 weeks is the validated clinical administration interval. Kompass currently recommends weekly, which is acceptable for self-monitoring (more frequent is fine for self-use). The label "Wochen-Check-in" is appropriate.

### What to add to the existing display (incremental improvements only)

1. **Delta indicator on latest entry cards:** Show "+3" or "-2" relative to previous check-in with an up/down indicator. Currently the cards show only the current score. The delta tells the user immediately whether things are improving. Keep it simple — colored number with direction.

2. **"Letzte 5 Einträge" summary table** below the chart: date, PHQ-9 score + severity label, GAD-7 score + severity label. The current list shows this but as a flat list without a summary scan. A compact table makes the trend scannable without reading each row.

3. **Backend persistence (critical gap):** The checkin module must have a backend counterpart. This is the highest-priority gap, not a UX enhancement. In server mode, check-in data is currently lost entirely on mode switches.

### What NOT to add to check-in display

- Predictive trend lines ("based on your trajectory...") — unvalidated, potentially alarming
- Comparison against norms or population averages — inappropriate for self-help, potentially harmful
- Automatic push notifications or reminders — out of scope for this tool's privacy model
- Streak tracking ("you've checked in 8 weeks in a row!") — gamification, explicitly out of scope

---

## Table Stakes vs. Differentiators

### Table Stakes (users expect these, absence feels broken)

| Feature | Why expected | Status in Kompass |
|---------|--------------|-------------------|
| All data persists reliably across sessions | Fundamental for a journaling tool | Mostly done; check-in backend gap |
| Export all data as portable format | Privacy and ownership expectation | Local mode only; backend gap |
| Import / restore from export file | Data portability pair to export | Local mode only; backend gap |
| Works offline or with minimal setup | Single-user personal tool expectation | Local mode works; Docker mode requires setup |
| Free-text notes on entries | Users always want to add context | Done in check-in (1-line note); could expand |
| Consistent save behavior (no silent data loss) | Trust foundation | Critical bug: mode-switch loses check-in data |

### Differentiators (set Kompass apart from generic journaling)

| Feature | Value proposition |
|---------|------------------|
| Cross-module references (obstacles → beliefs → values) | Rare in self-help tools; mirrors actual therapy structure |
| Schema domain visualization from YSQ results | Not available in generic mood trackers |
| ACT-informed module structure (values → defusion → commitment) | Therapeutic coherence; not just a feature list |
| Synthese view connecting all modules | Meta-reflection across the whole inner landscape |
| Snapshot system for longitudinal comparison | The primary reason this port from HTML exists |
| Warm editorial aesthetic (non-clinical, non-app-like) | Intentional differentiation from cold clinical tools |
| Dual-mode (offline HTML vs. server) | Unusually good for privacy-conscious users |

### Priority ranking for this milestone

Given the brownfield context and active gaps, priority order is:

1. Checkin backend module — stops data loss, highest-impact fix
2. YSQ module (backend + frontend) — last major missing content module
3. Export/Import backend endpoints — completes data portability
4. Snapshot system (API routes + minimal UI) — delivers the core longitudinal value proposition
5. localApi migration bug fix — silent data corruption risk
6. Error boundary in App.tsx — stability safety net

---

## Anti-Features (What NOT to Build)

### Do not build: AI-generated insights or pattern detection

"Based on your entries, it looks like you might be experiencing..." — this crosses from tool into advisor. The project explicitly excludes this (CLAUDE.md, PROJECT.md). Even well-intentioned AI suggestions undermine the core value: the thinking is the exercise.

### Do not build: Streak counters or completion percentages

"You've completed 7 of 9 modules" as a progress bar treats inner work like a productivity checklist. Schema therapy and ACT are not linear completion tasks. A user might return to the Values module 20 times — that's good, not a sign of incompleteness.

### Do not build: Social sharing or comparison against others

Not even anonymous aggregate stats ("most users in your score range feel..."). Reflection requires privacy. The moment data is compared externally, the tool changes its nature.

### Do not build: Automatic snapshots on a timer

Automatic snapshotting without user intent creates junk data and devalues manual snapshots. Let the user mark meaningful moments.

### Do not build: Multi-axis radar/spider chart for YSQ results

Despite being visually appealing, spider charts for 18 YSQ schemas mislead users into reading overall shape as diagnostic. The sorted bar chart (by domain) communicates the same information more honestly and actionably.

### Do not build: Push notifications or reminders

Not appropriate for a private reflection tool. Notifications shift the tool from "when I'm ready" to "when the app wants me." This is precisely the gamification dynamic the project is designed to avoid.

### Do not build: Separate "journal" or free-text entry module

Generic journaling is well served by other tools. Kompass's free-text affordances (notes on check-ins, reflection fields on beliefs) are sufficient and purposeful. Adding a blank journal module dilutes the structured-reflection identity.

### Do not build: Inline crisis intervention content beyond the crisis banner

The existing CrisisBanner with crisis line contact is the appropriate and sufficient response to PHQ-9 item 9 > 0. Do not expand this into a crisis intervention flow, self-assessment risk scoring, or anything that implies clinical capability. The tool is not a clinical instrument.

---

## Sources

- [18 Early Maladaptive Schemas — Schema Therapy Institute](https://www.schematherapy.com/id73.htm) — HIGH confidence, official source
- [YSQ scoring key and long form](https://www.bewellct.com/docs/YSQ-L3.pdf) — HIGH confidence, clinical instrument
- [Five schema domains taxonomy](https://cognitivebehaviortherapycenter.com/schema-therapy-california/schema-domains/) — HIGH confidence, aligns with Young's original framework
- [PHQ-9 validity — Kroenke & Spitzer, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC1495268/) — HIGH confidence, original validation paper
- [PHQ-9 scoring guide — MDCalc](https://www.mdcalc.com/calc/1725/phq9-patient-health-questionnaire9) — HIGH confidence, clinical reference
- [GAD-7 scoring and thresholds](https://www.osmind.org/blog/gad-7-score-calculator) — HIGH confidence, matches original Spitzer validation
- [PHQ-9 and GAD-7 tracking — Empirical Health](https://www.empirical.health/blog/anxiety-depression-tracking/) — MEDIUM confidence, product blog
- [ACTaide co-design study 2024–2025, JMIR](https://formative.jmir.org/2025/1/e69532) — MEDIUM confidence, peer-reviewed UX research on ACT app design
- [NovoPsych MSS-YSQ adaptive implementation](https://novopsych.com/assessments/formulation/mss-ysq-young-schema-questionnaire/) — MEDIUM confidence, commercial implementation reference
