import { useState } from "react";
import { Card } from "../../components/Card";
import { PhaseHeader } from "../../components/PhaseHeader";
import type { ModuleProps } from "../registry";
import {
  YSQ_SCHEMAS,
  YSQ_ANSWER_SCALE,
  YSQ_MAX_SCHEMA_SCORE,
} from "./constants";
import type { YsqData } from "./types";

function barColor(score: number | null): string {
  if (score === null) return "var(--line)";
  if (score >= 16) return "var(--accent)";
  if (score >= 11) return "var(--ocean)";
  return "var(--sage)";
}

export function YsqModule({ data, onChange }: ModuleProps<YsqData>) {
  const [mode, setMode] = useState<"overview" | "questionnaire">(() => {
    if (data.draft != null) return "questionnaire"; // resume in-progress
    if (data.answers != null) return "overview";    // show results
    return "questionnaire";                         // fresh start
  });

  const [currentSchemaIdx, setCurrentSchemaIdx] = useState<number>(() => {
    if (data.draft == null) return 0;
    // Resume at first schema page where all items are null
    for (let i = 0; i < 18; i++) {
      const slice = data.draft.slice(i * 5, i * 5 + 5);
      if (slice.every((v) => v === null)) return i;
    }
    return 17;
  });

  const [localDraft, setLocalDraft] = useState<(number | null)[]>(() =>
    data.draft ?? Array(90).fill(null),
  );

  function setItemAnswer(itemIdx: number, value: number) {
    const updated = [...localDraft];
    updated[currentSchemaIdx * 5 + itemIdx] = value;
    setLocalDraft(updated);
  }

  const currentSchemaAnswers = localDraft.slice(
    currentSchemaIdx * 5,
    currentSchemaIdx * 5 + 5,
  );

  const schemaIsSkipped = currentSchemaAnswers.every((v) => v === null);

  function goNext() {
    onChange({ ...data, draft: [...localDraft] });
    setCurrentSchemaIdx((i) => Math.min(i + 1, 17));
  }

  function goBack() {
    onChange({ ...data, draft: [...localDraft] });
    setCurrentSchemaIdx((i) => Math.max(i - 1, 0));
  }

  function commit() {
    onChange({ ...data, answers: [...localDraft], draft: null });
    setMode("overview");
  }

  const currentSchema = YSQ_SCHEMAS[currentSchemaIdx];

  if (mode === "questionnaire") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <PhaseHeader
          phaseNum="02"
          title="Young Schema Questionnaire"
          subtitle="Der YSQ-S3 erfasst 18 Maladaptive Schemata in 90 Aussagen. Lies jede Aussage und wähle, wie gut sie auf dich zutrifft."
        />

        {data.draft != null && (
          <p className="text-xs text-ink-faint mt-2 mb-6">
            {"Ausfüllung begonnen — du kannst jederzeit fortsetzen."}
          </p>
        )}

        <Card>
          <div className="flex items-baseline justify-between">
            <h2 className="display text-xl text-ink">{currentSchema.label}</h2>
            <span className="text-xs tracking-[0.15em] uppercase text-ink-faint">
              Schema {currentSchemaIdx + 1} von 18
            </span>
          </div>

          <div className="h-0.5 bg-line-soft rounded-full mt-2 mb-6">
            <div
              className="h-full bg-ink-soft rounded-full"
              style={{ width: `${(currentSchemaIdx / 18) * 100}%` }}
            />
          </div>

          <div>
            {currentSchema.items.map((item, itemIdx) => {
              const answer = currentSchemaAnswers[itemIdx];
              return (
                <div
                  key={itemIdx}
                  className="py-4 border-b border-line-soft last:border-b-0"
                >
                  <p className="text-ink text-sm leading-relaxed mb-3">{item}</p>
                  <div className="flex flex-wrap gap-2">
                    {YSQ_ANSWER_SCALE.map((opt) => {
                      const active = answer === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setItemAnswer(itemIdx, opt.value)}
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
            })}
          </div>

          <div className="flex gap-3 mt-6">
            {currentSchemaIdx > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 text-ink-soft hover:text-ink transition-colors"
              >
                {"Zurück"}
              </button>
            )}

            {currentSchemaIdx < 17 ? (
              schemaIsSkipped ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-4 py-2 border border-line text-ink-soft rounded-sm hover:border-ink-soft transition-colors"
                >
                  {"Überspringen"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors"
                >
                  Weiter
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={commit}
                className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors"
              >
                Abschließen
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // overview mode
  const schemaResults = YSQ_SCHEMAS.map((schema, i) => {
    const items = data.answers!.slice(i * 5, i * 5 + 5);
    const allNull = items.every((v) => v === null);
    const score = allNull ? null : items.reduce((sum: number, v) => sum + (v ?? 0), 0);
    return { schema, score, schemaIdx: i };
  });

  const sorted = [...schemaResults].sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1),
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="02"
        title="Young Schema Questionnaire"
        subtitle="Der YSQ-S3 erfasst 18 Maladaptive Schemata in 90 Aussagen. Lies jede Aussage und wähle, wie gut sie auf dich zutrifft."
      />

      {data.answers == null ? (
        <Card>
          <h2 className="display text-xl mb-2">Noch keine Ergebnisse</h2>
          <p className="text-sm text-ink-soft">
            {"Fülle den Fragebogen aus, um deine Schema-Scores zu sehen."}
          </p>
        </Card>
      ) : (
        <Card>
          <h2 className="display text-xl mb-6">Ergebnisse</h2>
          <ul>
            {sorted.map((row) => (
              <li
                key={row.schemaIdx}
                className="border-b border-line-soft last:border-b-0"
              >
                <div className="flex items-center gap-4 py-3">
                  <span className="text-sm text-ink min-w-[140px] shrink-0">
                    {row.schema.label}
                  </span>
                  <div className="flex-1 bg-paper-3 rounded-sm h-3 overflow-hidden">
                    {row.score !== null && (
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{
                          width: `${(row.score / YSQ_MAX_SCHEMA_SCORE) * 100}%`,
                          backgroundColor: barColor(row.score),
                        }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-mono text-ink-faint ml-2 w-8 text-right shrink-0">
                    {row.score ?? "–"}
                  </span>
                  {row.score === null && (
                    <span className="text-xs text-ink-faint italic ml-1">
                      nicht ausgefüllt
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={200}
                  value={data.notes[String(row.schemaIdx)] ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      notes: { ...data.notes, [String(row.schemaIdx)]: e.target.value },
                    })
                  }
                  placeholder={"Notiz zu diesem Schema …"}
                  className="w-full bg-paper border border-line px-3 py-1.5 text-sm rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft mt-1 mb-3"
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <button
        type="button"
        onClick={() => {
          const newDraft = Array(90).fill(null);
          setLocalDraft(newDraft);
          setCurrentSchemaIdx(0);
          onChange({ ...data, draft: newDraft });
          setMode("questionnaire");
        }}
        className="px-4 py-2 border border-line text-ink-soft rounded-sm hover:border-ink-soft transition-colors mt-6"
      >
        Fragebogen neu ausf&#252;llen
      </button>

      <p className="text-xs text-ink-faint leading-relaxed mt-10">
        Der YSQ-S3 ist ein Selbstauskunftsbogen und kein diagnostisches Instrument.
        Die Ergebnisse dienen der Selbstreflexion. Bei klinischen Fragen bitte
        Fachpersonal hinzuziehen.
      </p>
    </div>
  );
}
