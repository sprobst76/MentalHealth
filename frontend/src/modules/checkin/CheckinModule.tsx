import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { CrisisBanner } from "../../components/CrisisBanner";
import { PhaseHeader } from "../../components/PhaseHeader";
import { TrendChart } from "../../components/TrendChart";
import type { ModuleProps } from "../registry";
import {
  ANSWER_SCALE,
  GAD7_ITEMS,
  PHQ9_ITEMS,
  PHQ9_SUICIDE_ITEM_INDEX,
} from "./constants";
import {
  daysSince,
  formatDate,
  gad7Severity,
  isComplete,
  phq9Severity,
  sumAnswers,
} from "./scoring";
import type { CheckinData, CheckinEntry } from "./types";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyAnswers(len: number): number[] {
  return Array.from({ length: len }, () => -1);
}

function ScaleRow({
  question,
  value,
  onChange,
}: {
  question: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-4 border-b border-line-soft last:border-b-0">
      <p className="text-ink text-sm leading-relaxed mb-3">{question}</p>
      <div className="flex flex-wrap gap-2">
        {ANSWER_SCALE.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
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
}

export function CheckinModule({ data, onChange }: ModuleProps<CheckinData>) {
  const [mode, setMode] = useState<"overview" | "new">(() =>
    data.entries.length === 0 ? "new" : "overview",
  );
  const [phq9, setPhq9] = useState<number[]>(() => emptyAnswers(PHQ9_ITEMS.length));
  const [gad7, setGad7] = useState<number[]>(() => emptyAnswers(GAD7_ITEMS.length));
  const [note, setNote] = useState("");

  const sorted = useMemo(
    () => [...data.entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [data.entries],
  );
  const latest = sorted[0];

  const crisis = latest && latest.phq9[PHQ9_SUICIDE_ITEM_INDEX] > 0;
  const phq9Complete = isComplete(phq9, PHQ9_ITEMS.length);
  const gad7Complete = isComplete(gad7, GAD7_ITEMS.length);
  const canSave = phq9Complete && gad7Complete;

  function setPhq9At(i: number, v: number) {
    const next = [...phq9];
    next[i] = v;
    setPhq9(next);
  }
  function setGad7At(i: number, v: number) {
    const next = [...gad7];
    next[i] = v;
    setGad7(next);
  }

  function save() {
    if (!canSave) return;
    const entry: CheckinEntry = {
      id: uid(),
      timestamp: new Date().toISOString(),
      phq9: [...phq9],
      gad7: [...gad7],
      note: note.trim(),
    };
    onChange({ entries: [entry, ...data.entries] });
    setPhq9(emptyAnswers(PHQ9_ITEMS.length));
    setGad7(emptyAnswers(GAD7_ITEMS.length));
    setNote("");
    setMode("overview");
  }

  function remove(id: string) {
    onChange({ entries: data.entries.filter((e) => e.id !== id) });
  }

  const chartEntries = sorted.slice(0, 12).reverse();
  const phq9Points = chartEntries.map((e) => ({
    x: 0,
    y: sumAnswers(e.phq9),
    label: formatDate(e.timestamp).slice(0, 5),
  }));
  const gad7Points = chartEntries.map((e) => ({
    x: 0,
    y: sumAnswers(e.gad7),
    label: formatDate(e.timestamp).slice(0, 5),
  }));

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="W"
        title="Wochen-Check-in"
        subtitle="Zwei kurze, validierte Fragebögen (PHQ-9 für Depression, GAD-7 für Angst). Rund 3 Minuten. Wiederhole den Check am besten wöchentlich — die Antworten werden über die Zeit verglichen."
      />

      {crisis && (
        <div className="mb-6">
          <CrisisBanner />
        </div>
      )}

      {mode === "overview" && latest && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-2">
                PHQ-9 · Depression
              </div>
              <div className="flex items-baseline gap-3">
                <span className="display text-4xl text-ink">{sumAnswers(latest.phq9)}</span>
                <span className="text-ink-faint text-sm">/ 27</span>
              </div>
              <div className="text-sm text-ink-soft mt-1">
                {phq9Severity(sumAnswers(latest.phq9)).label}
              </div>
            </Card>
            <Card>
              <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-2">
                GAD-7 · Angst
              </div>
              <div className="flex items-baseline gap-3">
                <span className="display text-4xl text-ink">{sumAnswers(latest.gad7)}</span>
                <span className="text-ink-faint text-sm">/ 21</span>
              </div>
              <div className="text-sm text-ink-soft mt-1">
                {gad7Severity(sumAnswers(latest.gad7)).label}
              </div>
            </Card>
          </div>

          <p className="text-ink-faint text-sm mb-6">
            Letzter Check-in: {formatDate(latest.timestamp)} · vor {daysSince(latest.timestamp)} Tag
            {daysSince(latest.timestamp) === 1 ? "" : "en"}
          </p>

          {chartEntries.length >= 2 && (
            <Card className="mb-6">
              <h2 className="display text-xl mb-4">Verlauf</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-2">
                    PHQ-9
                  </div>
                  <TrendChart
                    points={phq9Points}
                    maxY={27}
                    thresholds={[
                      { value: 5, tone: "sage" },
                      { value: 10, tone: "ocean" },
                      { value: 15, tone: "accent" },
                    ]}
                  />
                </div>
                <div>
                  <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-2">
                    GAD-7
                  </div>
                  <TrendChart
                    points={gad7Points}
                    maxY={21}
                    thresholds={[
                      { value: 5, tone: "sage" },
                      { value: 10, tone: "ocean" },
                      { value: 15, tone: "accent" },
                    ]}
                  />
                </div>
              </div>
              <p className="text-ink-faint text-xs mt-4">
                Gestrichelte Linien markieren die Schwellen zwischen den Schweregraden.
              </p>
            </Card>
          )}

          <button
            type="button"
            onClick={() => setMode("new")}
            className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors mb-8"
          >
            Neuen Check-in starten
          </button>

          {sorted.length > 0 && (
            <Card>
              <h2 className="display text-xl mb-4">Bisherige Einträge</h2>
              <ul className="divide-y divide-line-soft">
                {sorted.map((e) => {
                  const phq = sumAnswers(e.phq9);
                  const gad = sumAnswers(e.gad7);
                  return (
                    <li key={e.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-ink-soft text-sm">{formatDate(e.timestamp)}</div>
                        <div className="text-ink-faint text-xs">
                          PHQ-9 {phq} · {phq9Severity(phq).label} · GAD-7 {gad} ·{" "}
                          {gad7Severity(gad).label}
                          {e.note && <span className="italic"> · {e.note}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(e.id)}
                        className="text-ink-faint hover:text-accent text-xs"
                      >
                        Löschen
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}

      {mode === "new" && (
        <>
          <p className="text-ink-soft text-sm leading-relaxed mb-6">
            <span className="font-medium text-ink">Zeitraum:</span> Wie oft hast du dich in den
            letzten 2 Wochen durch die folgenden Beschwerden beeinträchtigt gefühlt?
          </p>

          <Card className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="display text-xl">PHQ-9 · Depression</h2>
              <span className="text-ink-faint text-xs">
                {phq9.filter((v) => v >= 0).length} / {PHQ9_ITEMS.length}
              </span>
            </div>
            <div>
              {PHQ9_ITEMS.map((q, i) => (
                <ScaleRow
                  key={i}
                  question={q}
                  value={phq9[i]}
                  onChange={(v) => setPhq9At(i, v)}
                />
              ))}
            </div>
          </Card>

          <Card className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="display text-xl">GAD-7 · Angst</h2>
              <span className="text-ink-faint text-xs">
                {gad7.filter((v) => v >= 0).length} / {GAD7_ITEMS.length}
              </span>
            </div>
            <div>
              {GAD7_ITEMS.map((q, i) => (
                <ScaleRow
                  key={i}
                  question={q}
                  value={gad7[i]}
                  onChange={(v) => setGad7At(i, v)}
                />
              ))}
            </div>
          </Card>

          <Card className="mb-6">
            <label className="block text-xs tracking-[0.12em] uppercase text-ink-faint mb-2">
              Notiz (optional, eine Zeile)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. schwere Woche, neue Situation, Medikament angepasst"
              maxLength={120}
              className="w-full bg-paper border border-line px-3 py-2 rounded-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-soft"
            />
          </Card>

          {phq9Complete && phq9[PHQ9_SUICIDE_ITEM_INDEX] > 0 && (
            <div className="mb-6">
              <CrisisBanner />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors disabled:bg-paper-3 disabled:text-ink-faint disabled:cursor-not-allowed"
            >
              Check-in speichern
            </button>
            {data.entries.length > 0 && (
              <button
                type="button"
                onClick={() => setMode("overview")}
                className="px-4 py-2 text-ink-soft hover:text-ink transition-colors"
              >
                Abbrechen
              </button>
            )}
          </div>
        </>
      )}

      <p className="text-ink-faint text-xs mt-10 leading-relaxed">
        PHQ-9 und GAD-7 sind validierte Screening-Fragebögen (Kroenke, Spitzer et al., Pfizer Inc.
        — frei zur klinischen Nutzung). Sie ersetzen keine diagnostische Beurteilung. Bei
        anhaltenden Belastungen oder Krisen bitte professionelle Hilfe suchen.
      </p>
    </div>
  );
}
