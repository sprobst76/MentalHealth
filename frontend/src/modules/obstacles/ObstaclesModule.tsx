import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { PhaseHeader } from "../../components/PhaseHeader";
import type { BeliefsSchemaData } from "../beliefs_schema/types";
import { SCHEMA_MAP } from "../beliefs_schema/constants";
import type { GoalsData } from "../goals/types";
import type { ModuleProps } from "../registry";
import type { Obstacle, ObstaclesData } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const EXPLORATION_PROMPTS = [
  "Wie alt fühlst du dich in diesem Moment, wenn das Hindernis auftaucht?",
  "Gibt es eine innere Stimme — klingt sie vertraut? Wessen Stimme könnte das sein?",
  "Was hat der Teil von dir, der dieses Muster entwickelt hat, damals gebraucht?",
  "Was wäre ein kleiner Schritt, der dir zeigt, dass du diesem Muster nicht folgen musst?",
  "Wie kannst du dir selbst in diesem Moment Mitgefühl entgegenbringen?",
];

export function ObstaclesModule({ data, onChange, allData }: ModuleProps<ObstaclesData>) {
  const [openId, setOpenId] = useState<string | null>(null);

  const goalOptions = useMemo(() => {
    const gd = allData?.goals as GoalsData | undefined;
    return (gd?.goals ?? []).filter((g) => g.title.trim() && g.status === "active");
  }, [allData]);

  const beliefOptions = useMemo(() => {
    const bd = allData?.beliefs_schema as BeliefsSchemaData | undefined;
    return (bd?.entries ?? []).filter((e) => e.active && e.intensity >= 3);
  }, [allData]);

  function update(id: string, patch: Partial<Obstacle>) {
    onChange({ ...data, obstacles: data.obstacles.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  }

  function add() {
    const fresh: Obstacle = {
      id: uid(),
      title: "",
      description: "",
      goal_refs: [],
      belief_refs: [],
      strategy: "",
    };
    onChange({ ...data, obstacles: [...data.obstacles, fresh] });
    setOpenId(fresh.id);
  }

  function remove(id: string) {
    onChange({ ...data, obstacles: data.obstacles.filter((o) => o.id !== id) });
  }

  function toggleRef(obstacleId: string, field: "goal_refs" | "belief_refs", moduleId: string, refId: string) {
    const o = data.obstacles.find((x) => x.id === obstacleId);
    if (!o) return;
    const current = o[field];
    const has = current.some((r) => r.moduleId === moduleId && r.id === refId);
    const next = has
      ? current.filter((r) => !(r.moduleId === moduleId && r.id === refId))
      : [...current, { moduleId, id: refId }];
    update(obstacleId, { [field]: next } as Partial<Obstacle>);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="05"
        title="Hindernisse"
        subtitle="Was steht zwischen dir und dem, was du willst? Benenne es — und verbinde es mit den Glaubenssätzen, die es nähren."
      />

      <div className="space-y-4 mb-6">
        {data.obstacles.map((o) => {
          const isOpen = openId === o.id;
          const linkedGoals = goalOptions.filter((g) => o.goal_refs.some((r) => r.id === g.id));
          const linkedBeliefs = beliefOptions.filter((b) => o.belief_refs.some((r) => r.id === b.schema_id));
          return (
            <Card key={o.id}>
              <button type="button" onClick={() => setOpenId(isOpen ? null : o.id)} className="w-full text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-ink font-medium mb-2">
                      {o.title || <span className="italic text-ink-faint font-normal">Neues Hindernis</span>}
                    </p>
                    {(linkedGoals.length > 0 || linkedBeliefs.length > 0) && (
                      <div className="flex flex-wrap gap-1 text-xs">
                        {linkedGoals.map((g) => (
                          <span key={g.id} className="text-accent">→ {g.title}</span>
                        ))}
                        {linkedBeliefs.map((b) => (
                          <span key={b.schema_id} className="text-ocean">
                            ← {SCHEMA_MAP.get(b.schema_id)?.label ?? b.schema_id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-ink-faint text-sm">{isOpen ? "Schließen" : "Öffnen"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-5 pt-5 border-t border-line-soft space-y-4">
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">Titel</label>
                    <input
                      value={o.title}
                      onChange={(e) => update(o.id, { title: e.target.value })}
                      placeholder="Ich zögere, mich zu zeigen"
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">Beschreibung</label>
                    <textarea
                      rows={3}
                      value={o.description}
                      onChange={(e) => update(o.id, { description: e.target.value })}
                      placeholder="Wann zeigt es sich? Was passiert dabei in dir?"
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Betroffene Ziele
                    </label>
                    {goalOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {goalOptions.map((g) => (
                          <Chip
                            key={g.id}
                            tone="accent"
                            active={o.goal_refs.some((r) => r.id === g.id)}
                            onClick={() => toggleRef(o.id, "goal_refs", "goals", g.id)}
                          >
                            {g.title}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <p className="text-ink-faint text-sm italic">Keine aktiven Ziele vorhanden.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Gespeist von Glaubenssätzen
                    </label>
                    {beliefOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {beliefOptions.map((b) => (
                          <Chip
                            key={b.schema_id}
                            tone="ocean"
                            active={o.belief_refs.some((r) => r.id === b.schema_id)}
                            onClick={() => toggleRef(o.id, "belief_refs", "beliefs_schema", b.schema_id)}
                          >
                            {SCHEMA_MAP.get(b.schema_id)?.label ?? b.schema_id}
                          </Chip>
                        ))}
                      </div>
                    ) : (
                      <p className="text-ink-faint text-sm italic">Noch keine bearbeiteten Glaubenssätze.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Strategie / Umgangsweise
                    </label>
                    <textarea
                      rows={3}
                      value={o.strategy}
                      onChange={(e) => update(o.id, { strategy: e.target.value })}
                      placeholder="Wie willst du reagieren, wenn das Hindernis auftaucht?"
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                    />
                  </div>

                  <details>
                    <summary className="text-xs tracking-[0.12em] uppercase text-ink-faint cursor-pointer hover:text-ink transition-colors">
                      Erkundungsfragen
                    </summary>
                    <ul className="mt-3 space-y-2 pl-1">
                      {EXPLORATION_PROMPTS.map((q, i) => (
                        <li key={i} className="text-ink-soft text-sm leading-relaxed flex gap-2">
                          <span className="text-ink-faint flex-shrink-0">·</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </details>

                  <button
                    type="button"
                    onClick={() => { remove(o.id); setOpenId(null); }}
                    className="text-ink-faint hover:text-accent text-sm"
                  >
                    Hindernis löschen
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
        Neues Hindernis
      </button>

      <Card>
        <h2 className="display text-xl mb-4">Reflexion</h2>
        <textarea
          rows={5}
          value={data.reflection}
          onChange={(e) => onChange({ ...data, reflection: e.target.value })}
          placeholder="Welche Hindernisse wiederholen sich? Wo liegt die Wurzel?"
          className="w-full bg-paper border border-line px-3 py-3 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-y"
        />
      </Card>
    </div>
  );
}
