import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { PhaseHeader } from "../../components/PhaseHeader";
import { RatingDots } from "../../components/RatingDots";
import type { ModuleProps } from "../registry";
import type { ValuesData } from "../values/types";
import type { ActCommitment, BeliefsActData } from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFUSION_EXAMPLES = [
  "Ich bemerke, dass ich den Gedanken habe, dass …",
  "Mein Kopf erzählt mir gerade die Geschichte von …",
  "Danke, Kopf — ich kenne diesen Gedanken. Ich muss ihm aber nicht folgen.",
  "Ich beobachte, wie dieser Gedanke kommt und geht — wie eine Wolke.",
  "Das ist nur ein Gedanke, keine Tatsache.",
];

export function BeliefsActModule({ data, onChange, allData }: ModuleProps<BeliefsActData>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const valueOptions = useMemo(() => {
    const vd = allData?.values as ValuesData | undefined;
    return vd?.selected ?? [];
  }, [allData]);

  function update(id: string, patch: Partial<ActCommitment>) {
    onChange({
      ...data,
      commitments: data.commitments.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function add(valueId = "") {
    const fresh: ActCommitment = {
      id: uid(),
      value_id: valueId,
      commitment: "",
      defusion: "",
      first_action: "",
      resonance: 3,
    };
    onChange({ ...data, commitments: [...data.commitments, fresh] });
    setOpenId(fresh.id);
  }

  function remove(id: string) {
    onChange({ ...data, commitments: data.commitments.filter((c) => c.id !== id) });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="03"
        title="Stärkende Glaubenssätze"
        subtitle="Nicht gegen den kritischen Gedanken kämpfen — stattdessen: Was ist mir wichtig, und was bin ich bereit zu tun, auch wenn Angst oder Zweifel da sind?"
      />

      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowTips((v) => !v)}
          className="text-sm text-ink-soft hover:text-ink transition-colors flex items-center gap-2"
        >
          <span className="text-ink-faint tracking-wider">▸</span>
          Was ist ACT-Defusion? — Wie diese Übung funktioniert
        </button>
        {showTips && (
          <div className="mt-4 p-5 bg-paper-2 border border-line-soft rounded-sm space-y-4">
            <div>
              <div className="text-xs tracking-[0.12em] uppercase text-ocean mb-2">Das Prinzip</div>
              <p className="text-ink-soft text-sm leading-relaxed">
                ACT (Acceptance and Commitment Therapy) geht nicht darum, kritische Gedanken zu bekämpfen
                oder zu widerlegen — sondern sie als das zu sehen, was sie sind: Gedanken, keine Wahrheiten.
                Defusion bedeutet, Abstand zum Gedanken zu schaffen, ohne ihn zu verdrängen.
              </p>
            </div>
            <div>
              <div className="text-xs tracking-[0.12em] uppercase text-ocean mb-2">Defusions-Beispiele</div>
              <ul className="space-y-1">
                {DEFUSION_EXAMPLES.map((ex, i) => (
                  <li key={i} className="text-ink-soft text-sm flex gap-2">
                    <span className="text-ink-faint flex-shrink-0">·</span>
                    <span className="italic">{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-[0.12em] uppercase text-ocean mb-2">Verpflichtung formulieren</div>
              <p className="text-ink-soft text-sm leading-relaxed">
                Eine Verpflichtung ist kein Versprechen an ein perfektes Selbst — sie ist eine Aussage
                über deine Richtung. Sie beginnt oft mit: <span className="italic">„Ich bin bereit, … auch wenn …"</span>
                oder <span className="italic">„Ich verpflichte mich zu …, weil mir … wichtig ist."</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {valueOptions.length === 0 && (
        <p className="text-ink-faint italic mb-6">
          Wähle zuerst im Werte-Modul deine Werte — dann kannst du sie hier als Anker nutzen.
        </p>
      )}

      <div className="space-y-4 mb-6">
        {data.commitments.map((c) => {
          const value = valueOptions.find((v) => v.id === c.value_id);
          const isOpen = openId === c.id;
          return (
            <Card key={c.id} className="border-sage">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : c.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-sage uppercase tracking-wider">
                        {value?.label ?? "— Wert wählen —"}
                      </span>
                      <RatingDots value={c.resonance} />
                    </div>
                    <p className="text-ink">
                      {c.commitment || <span className="italic text-ink-faint">Noch keine Formulierung</span>}
                    </p>
                  </div>
                  <span className="text-ink-faint text-sm">{isOpen ? "Schließen" : "Öffnen"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="mt-5 pt-5 border-t border-line-soft space-y-4">
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Wert-Anker
                    </label>
                    <select
                      value={c.value_id}
                      onChange={(e) => update(c.id, { value_id: e.target.value })}
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink focus:outline-none focus:border-ink-soft"
                    >
                      <option value="">— wählen —</option>
                      {valueOptions.map((v) => (
                        <option key={v.id} value={v.id}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Ich verpflichte mich zu…
                    </label>
                    <textarea
                      rows={2}
                      value={c.commitment}
                      onChange={(e) => update(c.id, { commitment: e.target.value })}
                      placeholder="Ich bin bereit, ehrlich zu sagen, was ich denke — auch wenn es unbequem ist."
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Defusion — was mein Kopf vielleicht dagegen sagt
                    </label>
                    <textarea
                      rows={2}
                      value={c.defusion}
                      onChange={(e) => update(c.id, { defusion: e.target.value })}
                      placeholder="Auch wenn mein Kopf sagt: 'Das wird nur Streit geben' — ich erkenne den Gedanken als Gedanken, nicht als Wahrheit."
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Erster konkreter Schritt
                    </label>
                    <input
                      type="text"
                      value={c.first_action}
                      onChange={(e) => update(c.id, { first_action: e.target.value })}
                      placeholder="Beim nächsten Meeting meine Bedenken aussprechen."
                      className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
                      Resonanz
                    </label>
                    <RatingDots
                      value={c.resonance}
                      onChange={(v) => update(c.id, { resonance: v })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { remove(c.id); setOpenId(null); }}
                    className="text-ink-faint hover:text-accent text-sm"
                  >
                    Verpflichtung löschen
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => add()}
          className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors"
        >
          Neue Verpflichtung
        </button>
        {valueOptions.slice(0, 5).map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => add(v.id)}
            className="px-3 py-2 border border-sage text-sage rounded-sm hover:bg-paper-2 transition-colors text-sm"
          >
            + zu {v.label}
          </button>
        ))}
      </div>

      <Card>
        <h2 className="display text-xl mb-4">Reflexion</h2>
        <textarea
          rows={5}
          value={data.reflection}
          onChange={(e) => onChange({ ...data, reflection: e.target.value })}
          placeholder="Wo spürst du Zug zwischen dem, was dein Kopf sagt, und dem, was dir wirklich wichtig ist?"
          className="w-full bg-paper border border-line px-3 py-3 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-y"
        />
      </Card>
    </div>
  );
}
