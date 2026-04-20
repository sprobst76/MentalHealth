import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { PhaseHeader } from "../../components/PhaseHeader";
import { RatingDots } from "../../components/RatingDots";
import type { OrientationData } from "../orientation/types";
import { calcProfile } from "../orientation/scoring";
import type { ModuleProps } from "../registry";
import { SCHEMAS } from "./constants";
import type { BeliefEntry, BeliefsSchemaData } from "./types";

export function BeliefsSchemaModule({ data, onChange, allData }: ModuleProps<BeliefsSchemaData>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const suggestedSchemaIds = useMemo(() => {
    const od = allData?.orientation as OrientationData | undefined;
    if (!od?.responses?.length) return new Set<string>();
    const profile = calcProfile(od.responses);
    return new Set(profile.activeSchemas.map((s) => s.id));
  }, [allData]);

  const entryMap = useMemo(
    () => new Map(data.entries.map((e) => [e.schema_id, e])),
    [data.entries],
  );

  function upsertEntry(patch: Partial<BeliefEntry> & { schema_id: string }) {
    const existing = entryMap.get(patch.schema_id);
    if (existing) {
      onChange({
        ...data,
        entries: data.entries.map((e) =>
          e.schema_id === patch.schema_id ? { ...e, ...patch } : e,
        ),
      });
    } else {
      const fresh: BeliefEntry = {
        active: true,
        intensity: 3,
        personal_text: "",
        counter_evidence: "",
        alternative: "",
        ...patch,
      };
      onChange({ ...data, entries: [...data.entries, fresh] });
    }
  }

  const displaySchemas = useMemo(() => {
    const worked = new Set(data.entries.map((e) => e.schema_id));
    const all = new Set([...suggestedSchemaIds, ...worked]);
    return SCHEMAS.filter((s) => all.has(s.id));
  }, [suggestedSchemaIds, data.entries]);

  const otherSchemas = SCHEMAS.filter((s) => !displaySchemas.find((d) => d.id === s.id));

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="02"
        title="Glaubenssätze"
        subtitle="Welche tief verankerten Überzeugungen prägen dein Erleben? Erkenne sie — und beginne, sie zu befragen."
      />

      {displaySchemas.length === 0 && (
        <p className="text-ink-faint italic mb-8">
          Fülle zuerst den Orientierungs-Fragebogen aus — dann erscheinen hier die für dich
          relevanten Muster.
        </p>
      )}

      {displaySchemas.length > 0 && (
        <div className="space-y-4 mb-10">
          {displaySchemas.map((schema) => {
            const entry = entryMap.get(schema.id);
            const isExpanded = expandedId === schema.id;
            const isSuggested = suggestedSchemaIds.has(schema.id) && !entry;

            return (
              <Card key={schema.id} className={entry ? "border-ink-soft" : ""}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : schema.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-ink">{schema.label}</span>
                        {isSuggested && (
                          <span className="text-xs text-ocean border border-ocean px-2 py-0.5 rounded-full">
                            aus Orientierung
                          </span>
                        )}
                        {entry && (
                          <RatingDots value={entry.intensity} />
                        )}
                      </div>
                      <p className="text-ink-soft text-sm leading-relaxed italic">
                        {'"'}{schema.coreBeliefText}{'"'}
                      </p>
                    </div>
                    <span className="text-ink-faint text-sm flex-shrink-0">
                      {isExpanded ? "Schließen" : "Bearbeiten"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-line-soft space-y-5">
                    <p className="text-ink-faint text-sm">{schema.description}</p>
                    <p className="text-ink-faint text-sm">
                      <span className="text-ink-soft">Typischer Auslöser:</span>{" "}
                      {schema.typicalTrigger}
                    </p>

                    <div className="p-4 bg-paper-2 rounded-sm border border-line-soft">
                      <div className="text-xs tracking-[0.12em] uppercase text-ink-faint mb-3">
                        Erkundungsfragen
                      </div>
                      <ul className="space-y-2">
                        {schema.guidedQuestions.map((q, i) => (
                          <li key={i} className="text-ink-soft text-sm leading-relaxed flex gap-2">
                            <span className="text-ink-faint flex-shrink-0">·</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                        Intensität
                      </label>
                      <RatingDots
                        value={entry?.intensity ?? 3}
                        onChange={(v) => upsertEntry({ schema_id: schema.id, intensity: v })}
                        label="Intensität"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                        Wie klingt dieser Satz in dir — in deinen eigenen Worten?
                      </label>
                      <textarea
                        rows={2}
                        value={entry?.personal_text ?? ""}
                        onChange={(e) =>
                          upsertEntry({ schema_id: schema.id, personal_text: e.target.value })
                        }
                        placeholder="Ich bin …"
                        className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                        Was widerspricht diesem Glaubenssatz? (Gegenbeweise, Erfahrungen)
                      </label>
                      <textarea
                        rows={3}
                        value={entry?.counter_evidence ?? ""}
                        onChange={(e) =>
                          upsertEntry({ schema_id: schema.id, counter_evidence: e.target.value })
                        }
                        placeholder="Es gibt Momente, in denen …"
                        className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                        Ein ausgewogenerer Satz — was wäre realistischer wahr?
                      </label>
                      <textarea
                        rows={2}
                        value={entry?.alternative ?? ""}
                        onChange={(e) =>
                          upsertEntry({ schema_id: schema.id, alternative: e.target.value })
                        }
                        placeholder="Auch wenn … manchmal passiert, bedeutet das nicht, dass …"
                        className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {otherSchemas.length > 0 && (
        <details className="mb-8">
          <summary className="text-ink-faint text-sm cursor-pointer hover:text-ink transition-colors">
            Weitere Schemata hinzufügen ({otherSchemas.length})
          </summary>
          <div className="mt-4 grid gap-2">
            {otherSchemas.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  upsertEntry({ schema_id: s.id });
                  setExpandedId(s.id);
                }}
                className="text-left px-4 py-3 border border-line-soft rounded-sm hover:border-ink-soft transition-colors"
              >
                <span className="font-medium text-ink-soft">{s.label}</span>
                <span className="text-ink-faint text-sm ml-3 italic">
                  {'"'}{s.coreBeliefText.slice(0, 60)}…{'"'}
                </span>
              </button>
            ))}
          </div>
        </details>
      )}

      <Card>
        <h2 className="display text-xl mb-4">Gesamtreflexion</h2>
        <textarea
          rows={5}
          value={data.reflection}
          onChange={(e) => onChange({ ...data, reflection: e.target.value })}
          placeholder="Welche Muster erkennst du übergreifend? Wo spürst du die stärkste Reibung?"
          className="w-full bg-paper border border-line px-3 py-3 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-y"
        />
      </Card>
    </div>
  );
}
