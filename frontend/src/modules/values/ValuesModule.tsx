import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { PhaseHeader } from "../../components/PhaseHeader";
import { RatingDots } from "../../components/RatingDots";
import type { OrientationData } from "../orientation/types";
import { calcProfile } from "../orientation/scoring";
import type { ModuleProps } from "../registry";
import { VALUE_PROMPTS, VALUE_SUGGESTIONS } from "./constants";
import type { ValueItem, ValuesData } from "./types";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function ValuesModule({ data, onChange, allData }: ModuleProps<ValuesData>) {
  const [draft, setDraft] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);

  const orientationSuggestions = useMemo(() => {
    const od = allData?.orientation as OrientationData | undefined;
    if (!od?.responses?.length) return [];
    const profile = calcProfile(od.responses);
    const existing = new Set(data.selected.map((v) => v.id));
    return profile.topValues
      .filter((v) => !existing.has(v.id))
      .map((v) => ({ id: v.id, label: v.label, weight: Math.round(v.score * 5) }));
  }, [allData, data.selected]);

  const selectedIds = useMemo(
    () => new Set(data.selected.map((v) => v.id)),
    [data.selected],
  );

  function toggleSuggestion(id: string, label: string) {
    if (selectedIds.has(id)) {
      onChange({
        ...data,
        selected: data.selected.filter((v) => v.id !== id),
        intentions: data.intentions.filter((i) => i.value_id !== id),
      });
    } else {
      const item: ValueItem = { id, label, weight: 0, living: 0, note: "" };
      onChange({ ...data, selected: [...data.selected, item] });
    }
  }

  function addCustom() {
    const label = draft.trim();
    if (!label) return;
    const item: ValueItem = { id: `custom-${uid()}`, label, weight: 0, living: 0, note: "" };
    onChange({ ...data, selected: [...data.selected, item] });
    setDraft("");
  }

  function updateItem(id: string, patch: Partial<ValueItem>) {
    onChange({
      ...data,
      selected: data.selected.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="01"
        title="Werte"
        subtitle="Was ist dir in deinem Leben wichtig? Wähle aus — oder ergänze, was fehlt. Gewichte später."
      />

      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowPrompts((v) => !v)}
          className="text-sm text-ink-soft hover:text-ink transition-colors flex items-center gap-2"
        >
          <span className="text-ink-faint tracking-wider">▸</span>
          Klärungsimpulse — Fragen, die helfen, Werte zu spüren
        </button>
        {showPrompts && (
          <div className="mt-4 space-y-3 pl-4 border-l-2 border-line-soft">
            {VALUE_PROMPTS.map((q, i) => (
              <p key={i} className="text-ink-soft text-sm leading-relaxed">{q}</p>
            ))}
            <p className="text-ink-faint text-xs mt-2">
              Notiere deine Gedanken im Reflexionsfeld unten.
            </p>
          </div>
        )}
      </div>

      {orientationSuggestions.length > 0 && (
        <div className="mb-6 p-5 border border-sage rounded-sm bg-paper-2">
          <div className="text-xs tracking-[0.15em] uppercase text-sage mb-3">
            Aus deiner Orientierung abgeleitet
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {orientationSuggestions.map((s) => (
              <Chip key={s.id} tone="sage" onClick={() => {
                const item: ValueItem = { id: s.id, label: s.label, weight: s.weight, living: 0, note: "" };
                onChange({ ...data, selected: [...data.selected, item] });
              }}>
                {s.label}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const toAdd: ValueItem[] = orientationSuggestions.map((s) => ({
                id: s.id, label: s.label, weight: s.weight, living: 0, note: "",
              }));
              onChange({ ...data, selected: [...data.selected, ...toAdd] });
            }}
            className="text-sm text-sage hover:text-ink transition-colors"
          >
            Alle übernehmen
          </button>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="display text-xl mb-4">Vorschläge</h2>
        <div className="flex flex-wrap gap-2">
          {VALUE_SUGGESTIONS.map((s) => (
            <Chip
              key={s.id}
              active={selectedIds.has(s.id)}
              onClick={() => toggleSuggestion(s.id, s.label)}
            >
              {s.label}
            </Chip>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustom();
            }}
            placeholder="Eigener Wert…"
            className="flex-1 bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft"
          />
          <button
            type="button"
            onClick={addCustom}
            className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors"
          >
            Hinzufügen
          </button>
        </div>
      </Card>

      {data.selected.length > 0 ? (
        <Card className="mb-6">
          <h2 className="display text-xl mb-2">Wichtig vs. Gelebt</h2>
          <p className="text-ink-soft text-sm mb-4 leading-relaxed">
            Für jeden Wert: <span className="text-accent">wichtig</span> (wie bedeutsam ist er dir?)
            und <span className="text-sage">gelebt</span> (wie stark lebst du ihn aktuell?). Große
            Lücken zeigen, wo du ansetzen kannst.
          </p>
          <ul className="divide-y divide-line-soft">
            {data.selected.map((v) => {
              const gap = v.weight - v.living;
              return (
                <li key={v.id} className="py-4">
                  <div className="flex items-center justify-between mb-3 gap-4">
                    <span className="font-medium text-ink flex-1">{v.label}</span>
                    {gap >= 2 && (
                      <span className="text-xs text-accent border border-accent px-2 py-0.5 rounded-full flex-shrink-0">
                        Lücke {gap}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSuggestion(v.id, v.label)}
                      className="text-ink-faint hover:text-accent text-xs flex-shrink-0"
                      aria-label={`${v.label} entfernen`}
                    >
                      Entfernen
                    </button>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-3 items-center mb-2">
                    <span className="text-xs text-accent tracking-wider uppercase">wichtig</span>
                    <RatingDots
                      value={v.weight}
                      onChange={(w) => updateItem(v.id, { weight: w })}
                      label={`${v.label} Wichtigkeit`}
                    />
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-3 items-center mb-3">
                    <span className="text-xs text-sage tracking-wider uppercase">gelebt</span>
                    <RatingDots
                      value={v.living}
                      onChange={(l) => updateItem(v.id, { living: l })}
                      label={`${v.label} gelebt`}
                    />
                  </div>
                  <textarea
                    value={v.note}
                    onChange={(e) => updateItem(v.id, { note: e.target.value })}
                    placeholder="Notiz (optional)"
                    rows={1}
                    className="w-full bg-paper border border-line-soft px-3 py-2 rounded-sm text-ink-soft placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-none text-sm"
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <Card>
        <h2 className="display text-xl mb-4">Reflexion</h2>
        <textarea
          value={data.reflection}
          onChange={(e) => onChange({ ...data, reflection: e.target.value })}
          rows={6}
          placeholder="Wo spürst du Reibung zwischen diesen Werten und dem, was du gerade lebst?"
          className="w-full bg-paper border border-line px-3 py-3 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft resize-y"
        />
      </Card>
    </div>
  );
}
