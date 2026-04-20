import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { PhaseHeader } from "../../components/PhaseHeader";
import type { ModuleProps } from "../registry";
import type { ValuesData } from "../values/types";
import { HORIZON_LABEL, STATUS_LABEL } from "./constants";
import type { Goal, GoalsData, GoalStatus, Horizon } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const HORIZONS: Horizon[] = ["30days", "quarter", "year", "longer"];
const STATUSES: GoalStatus[] = ["active", "achieved", "paused"];

export function GoalsModule({ data, onChange, allData }: ModuleProps<GoalsData>) {
  const [openId, setOpenId] = useState<string | null>(null);

  const valueOptions = useMemo(() => {
    const vd = allData?.values as ValuesData | undefined;
    return vd?.selected ?? [];
  }, [allData]);

  function update(id: string, patch: Partial<Goal>) {
    onChange({ ...data, goals: data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  }

  function add() {
    const fresh: Goal = {
      id: uid(),
      title: "",
      description: "",
      value_refs: [],
      horizon: "quarter",
      first_step: "",
      status: "active",
    };
    onChange({ ...data, goals: [...data.goals, fresh] });
    setOpenId(fresh.id);
  }

  function remove(id: string) {
    onChange({ ...data, goals: data.goals.filter((g) => g.id !== id) });
  }

  function toggleValue(goalId: string, valueId: string) {
    const goal = data.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const has = goal.value_refs.some((r) => r.id === valueId);
    const next = has
      ? goal.value_refs.filter((r) => r.id !== valueId)
      : [...goal.value_refs, { moduleId: "values", id: valueId }];
    update(goalId, { value_refs: next });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="04"
        title="Ziele"
        subtitle="Konkrete nächste Schritte, verankert in deinen Werten. Ein Ziel ohne Wert-Anker ist Beschäftigung; ein Wert ohne Ziel ist Absicht."
      />

      <div className="space-y-4 mb-6">
        {data.goals.map((g) => {
          const isOpen = openId === g.id;
          const linkedValues = valueOptions.filter((v) => g.value_refs.some((r) => r.id === v.id));
          return (
            <Card
              key={g.id}
              className={g.status === "achieved" ? "opacity-60" : g.status === "paused" ? "border-line" : "border-accent"}
            >
              <button type="button" onClick={() => setOpenId(isOpen ? null : g.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-ink-faint uppercase tracking-wider">
                        {HORIZON_LABEL[g.horizon]} · {STATUS_LABEL[g.status]}
                      </span>
                      {linkedValues.map((v) => (
                        <span key={v.id} className="text-xs text-sage">{v.label}</span>
                      ))}
                    </div>
                    <p className="text-ink font-medium">
                      {g.title || <span className="italic text-ink-faint font-normal">Neues Ziel</span>}
                    </p>
                  </div>
                  <span className="text-ink-faint text-sm">{isOpen ? "Schließen" : "Öffnen"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-5 pt-5 border-t border-line-soft space-y-4">
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">Titel</label>
                    <input
                      value={g.title}
                      onChange={(e) => update(g.id, { title: e.target.value })}
                      placeholder="Wöchentlich eine echte, tiefe Unterhaltung führen"
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">Beschreibung</label>
                    <textarea
                      rows={3}
                      value={g.description}
                      onChange={(e) => update(g.id, { description: e.target.value })}
                      placeholder="Was genau willst du verändern? Wie sieht Erfolg aus?"
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Verbunden mit Werten
                    </label>
                    {valueOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {valueOptions.map((v) => (
                          <Chip
                            key={v.id}
                            tone="sage"
                            active={g.value_refs.some((r) => r.id === v.id)}
                            onClick={() => toggleValue(g.id, v.id)}
                          >
                            {v.label}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <p className="text-ink-faint text-sm italic">Wähle zuerst Werte im Werte-Modul.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">Horizont</label>
                      <select
                        value={g.horizon}
                        onChange={(e) => update(g.id, { horizon: e.target.value as Horizon })}
                        className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink focus:outline-none focus:border-ink-soft"
                      >
                        {HORIZONS.map((h) => (
                          <option key={h} value={h}>{HORIZON_LABEL[h]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">Status</label>
                      <select
                        value={g.status}
                        onChange={(e) => update(g.id, { status: e.target.value as GoalStatus })}
                        className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink focus:outline-none focus:border-ink-soft"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">Erster Schritt</label>
                    <input
                      value={g.first_step}
                      onChange={(e) => update(g.id, { first_step: e.target.value })}
                      placeholder="Morgen Vormittag: Maria anrufen und für Freitag ein Treffen vereinbaren."
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { remove(g.id); setOpenId(null); }}
                    className="text-ink-faint hover:text-accent text-sm"
                  >
                    Ziel löschen
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors mb-8"
      >
        Neues Ziel
      </button>

      <Card>
        <h2 className="display text-xl mb-4">Reflexion</h2>
        <textarea
          rows={5}
          value={data.reflection}
          onChange={(e) => onChange({ ...data, reflection: e.target.value })}
          placeholder="Welche Ziele fühlen sich leicht an — welche schwer? Was fehlt noch?"
          className="w-full bg-paper border border-line px-3 py-3 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-y"
        />
      </Card>
    </div>
  );
}
