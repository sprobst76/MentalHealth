import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { CrisisBanner } from "../../components/CrisisBanner";
import { PhaseHeader } from "../../components/PhaseHeader";
import { PHQ9_SUICIDE_ITEM_INDEX } from "../checkin/constants";
import {
  formatDate,
  gad7Severity,
  phq9Severity,
  sumAnswers,
} from "../checkin/scoring";
import type { CheckinData } from "../checkin/types";
import type { BeliefsSchemaData } from "../beliefs_schema/types";
import { SCHEMA_MAP } from "../beliefs_schema/constants";
import type { BeliefsActData } from "../beliefs_act/types";
import type { GoalsData } from "../goals/types";
import { HORIZON_LABEL, STATUS_LABEL } from "../goals/constants";
import type { ObstaclesData } from "../obstacles/types";
import type { ValuesData } from "../values/types";
import { modules } from "../registry";
import type { ModuleProps } from "../registry";
import { api } from "../../api";
import type { SnapshotMeta, SnapshotFull } from "../../types";
import { YSQ_SCHEMAS } from "../ysq/constants";
import type { YsqData } from "../ysq/types";

function buildTextReport(allData: Record<string, any>): string {
  const lines: string[] = [];
  const today = new Date().toLocaleDateString("de-DE");
  lines.push(`Kompass-Bericht · ${today}`);
  lines.push("=".repeat(40));
  lines.push("");

  const checkin = allData?.checkin as CheckinData | undefined;
  if (checkin?.entries?.length) {
    const sorted = [...checkin.entries].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    const latest = sorted[0];
    const phq = sumAnswers(latest.phq9);
    const gad = sumAnswers(latest.gad7);
    lines.push(`WOCHEN-CHECK-IN (${formatDate(latest.timestamp)})`);
    lines.push(`  PHQ-9 (Depression): ${phq}/27 — ${phq9Severity(phq).label}`);
    lines.push(`  GAD-7 (Angst):      ${gad}/21 — ${gad7Severity(gad).label}`);
    if (latest.phq9[PHQ9_SUICIDE_ITEM_INDEX] > 0) {
      lines.push(`  ! Suizidgedanken angegeben — bitte Hilfe suchen.`);
    }
    if (latest.note) lines.push(`  Notiz: ${latest.note}`);
    if (sorted.length >= 2) {
      const prev = sorted[1];
      const phqDelta = phq - sumAnswers(prev.phq9);
      const gadDelta = gad - sumAnswers(prev.gad7);
      const fmtDelta = (d: number) => (d > 0 ? `+${d}` : `${d}`);
      lines.push(`  Veränderung ggü. ${formatDate(prev.timestamp)}: PHQ ${fmtDelta(phqDelta)}, GAD ${fmtDelta(gadDelta)}`);
    }
    lines.push("");
  }

  const values = allData?.values as ValuesData | undefined;
  if (values?.selected?.length) {
    const top = [...values.selected]
      .map((v) => ({ ...v, gap: v.weight - (v.living ?? 0) }))
      .sort((a, b) => b.gap - a.gap || b.weight - a.weight)
      .slice(0, 8);
    lines.push("WERTE (wichtig vs. gelebt)");
    top.forEach((v) => {
      const living = v.living ?? 0;
      lines.push(
        `  ${v.label.padEnd(20)} wichtig ${v.weight}/5 · gelebt ${living}/5${
          v.gap >= 2 ? `  (Lücke ${v.gap})` : ""
        }`,
      );
      if (v.note) lines.push(`    ${v.note}`);
    });
    lines.push("");
  }

  const beliefs = allData?.beliefs_schema as BeliefsSchemaData | undefined;
  if (beliefs?.entries?.length) {
    const active = beliefs.entries
      .filter((e) => e.active)
      .sort((a, b) => b.intensity - a.intensity);
    if (active.length) {
      lines.push("GLAUBENSMUSTER (nach Intensität)");
      active.forEach((e) => {
        const label = SCHEMA_MAP.get(e.schema_id)?.label ?? e.schema_id;
        const stars = "•".repeat(e.intensity) + "·".repeat(5 - e.intensity);
        lines.push(`  ${stars}  ${label}`);
        if (e.personal_text) lines.push(`           „${e.personal_text}"`);
        if (e.alternative) lines.push(`           → ${e.alternative}`);
      });
      lines.push("");
    }
  }

  const act = allData?.beliefs_act as BeliefsActData | undefined;
  if (act?.commitments?.length) {
    lines.push("STÄRKENDE VERPFLICHTUNGEN");
    act.commitments.forEach((c) => {
      const valueLabel =
        values?.selected?.find((v) => v.id === c.value_id)?.label ?? "—";
      lines.push(`  [${valueLabel}] ${c.commitment || "(offen)"}`);
      if (c.first_action) lines.push(`     Schritt: ${c.first_action}`);
    });
    lines.push("");
  }

  const goals = allData?.goals as GoalsData | undefined;
  if (goals?.goals?.length) {
    lines.push("ZIELE");
    goals.goals.forEach((g) => {
      lines.push(
        `  [${STATUS_LABEL[g.status]} · ${HORIZON_LABEL[g.horizon]}] ${g.title || "(ohne Titel)"}`,
      );
      if (g.first_step) lines.push(`     Nächster Schritt: ${g.first_step}`);
    });
    lines.push("");
  }

  const obstacles = allData?.obstacles as ObstaclesData | undefined;
  if (obstacles?.obstacles?.length) {
    lines.push("HINDERNISSE");
    obstacles.obstacles.forEach((o) => {
      lines.push(`  · ${o.title || "(ohne Titel)"}`);
      if (o.strategy) lines.push(`     Strategie: ${o.strategy}`);
    });
    lines.push("");
  }

  lines.push("—");
  lines.push("Erstellt mit Kompass. Kein Ersatz für therapeutische Begleitung.");
  return lines.join("\n");
}

interface ValueDeltaRow {
  label: string;
  weightA: number | null;
  livingA: number | null;
  weightB: number | null;
  livingB: number | null;
}

function computeValuesDelta(snapA: SnapshotFull | null, snapB: SnapshotFull | null): ValueDeltaRow[] {
  const getSelected = (snap: SnapshotFull | null) =>
    (snap?.modules?.values?.data as ValuesData | undefined)?.selected ?? [];

  const selectedA = getSelected(snapA);
  const selectedB = getSelected(snapB);

  const allLabels = new Set([
    ...selectedA.map((v) => v.label.toLowerCase()),
    ...selectedB.map((v) => v.label.toLowerCase()),
  ]);

  return [...allLabels].map((lc) => {
    const va = selectedA.find((v) => v.label.toLowerCase() === lc);
    const vb = selectedB.find((v) => v.label.toLowerCase() === lc);
    return {
      label: va?.label ?? vb?.label ?? lc,
      weightA: va?.weight ?? null,
      livingA: va?.living ?? null,
      weightB: vb?.weight ?? null,
      livingB: vb?.living ?? null,
    };
  });
}

function computeYsqDelta(
  snapA: SnapshotFull | null,
  snapB: SnapshotFull | null,
): Array<{ label: string; scoreA: number | null; scoreB: number | null }> {
  const getAnswers = (snap: SnapshotFull | null): (number | null)[] | null =>
    (snap?.modules?.ysq?.data as YsqData | undefined)?.answers ?? null;

  const answersA = getAnswers(snapA);
  const answersB = getAnswers(snapB);

  return YSQ_SCHEMAS.map((schema, i) => {
    const scoreA = answersA
      ? (() => {
          const items = answersA.slice(i * 5, i * 5 + 5);
          return items.every((v) => v === null)
            ? null
            : items.reduce<number>((s, v) => s + (v ?? 0), 0);
        })()
      : null;
    const scoreB = answersB
      ? (() => {
          const items = answersB.slice(i * 5, i * 5 + 5);
          return items.every((v) => v === null)
            ? null
            : items.reduce<number>((s, v) => s + (v ?? 0), 0);
        })()
      : null;
    return { label: schema.label, scoreA, scoreB };
  });
}

function computeCheckinDelta(
  snapA: SnapshotFull | null,
  snapB: SnapshotFull | null,
): { phqA: number | null; gadA: number | null; phqB: number | null; gadB: number | null } {
  const getLatest = (snap: SnapshotFull | null) => {
    const data = snap?.modules?.checkin?.data as CheckinData | undefined;
    if (!data?.entries?.length) return null;
    return [...data.entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  };
  const latestA = getLatest(snapA);
  const latestB = getLatest(snapB);
  return {
    phqA: latestA ? sumAnswers(latestA.phq9) : null,
    gadA: latestA ? sumAnswers(latestA.gad7) : null,
    phqB: latestB ? sumAnswers(latestB.phq9) : null,
    gadB: latestB ? sumAnswers(latestB.gad7) : null,
  };
}

export function SyntheseModule({ allData }: ModuleProps<unknown>) {
  const [copied, setCopied] = useState(false);
  const [snaps, setSnaps] = useState<SnapshotMeta[]>([]);
  const [snapLabel, setSnapLabel] = useState("");
  const [snapCreating, setSnapCreating] = useState(false);
  const [snapError, setSnapError] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [snapA, setSnapA] = useState<SnapshotFull | null>(null);
  const [snapB, setSnapB] = useState<SnapshotFull | null>(null);

  useEffect(() => {
    api
      .listSnapshots()
      .then(setSnaps)
      .catch((err: unknown) => {
        setSnapError(
          err instanceof Error ? err.message : "Snapshots konnten nicht geladen werden."
        );
      });
  }, []);

  const dataModules = modules.filter((m) => m.id !== "synthese" && m.SummaryBlock);

  const checkin = allData?.checkin as CheckinData | undefined;
  const latest = checkin?.entries?.length
    ? [...checkin.entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
    : null;
  const crisis = latest && latest.phq9[PHQ9_SUICIDE_ITEM_INDEX] > 0;

  async function createSnapshotHandler() {
    setSnapCreating(true);
    setSnapError(null);
    try {
      const meta = await api.createSnapshot(snapLabel.trim() || undefined);
      setSnaps((prev) => [meta, ...prev]);
      setSnapLabel("");
    } catch (err) {
      setSnapError(err instanceof Error ? err.message : "Fehler beim Erstellen des Snapshots.");
    } finally {
      setSnapCreating(false);
    }
  }

  async function selectCompareA(id: string | null) {
    setCompareA(id);
    if (!id) { setSnapA(null); return; }
    try {
      const full = await api.getSnapshot(id);
      setSnapA(full);
    } catch (err: unknown) {
      setCompareA(null);
      setSnapA(null);
      setSnapError(err instanceof Error ? err.message : "Snapshot A konnte nicht geladen werden.");
    }
  }

  async function selectCompareB(id: string | null) {
    setCompareB(id);
    if (!id) { setSnapB(null); return; }
    try {
      const full = await api.getSnapshot(id);
      setSnapB(full);
    } catch (err: unknown) {
      setCompareB(null);
      setSnapB(null);
      setSnapError(err instanceof Error ? err.message : "Snapshot B konnte nicht geladen werden.");
    }
  }

  async function copyReport() {
    const text = buildTextReport(allData as Record<string, any>);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PhaseHeader
        phaseNum="06"
        title="Synthese"
        subtitle="Alles zusammen — dein Kompass in einem Blick. Du kannst diesen Bericht als Text kopieren oder ausdrucken, z.B. für ein Gespräch mit Therapeut:in."
      />

      <div className="flex gap-3 mb-8 print:hidden">
        <button
          type="button"
          onClick={copyReport}
          className="px-4 py-2 bg-ink text-paper rounded-sm hover:bg-accent transition-colors text-sm"
        >
          {copied ? "Kopiert ✓" : "Als Text kopieren"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 border border-line text-ink-soft hover:text-ink hover:border-ink-soft rounded-sm transition-colors text-sm"
        >
          Drucken / PDF
        </button>
      </div>

      {crisis && (
        <div className="mb-6">
          <CrisisBanner />
        </div>
      )}

      {dataModules.map((m) => {
        const data = allData?.[m.id];
        const Summary = m.SummaryBlock!;
        return (
          <Card key={m.id} className="mb-6">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-ink-faint text-xs tracking-[0.2em] uppercase">
                Phase {m.phaseNum}
              </span>
              <h2 className="display text-2xl text-ink">{m.title}</h2>
            </div>
            <Summary data={data} allData={allData} />
          </Card>
        );
      })}

      <section className="mt-8 print:hidden">
        <h2 className="display text-2xl text-ink mb-6">Snapshots</h2>
        <Card className="mb-4">
          <p className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-4">
            Neuen Snapshot erstellen
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={snapLabel}
              onChange={(e) => setSnapLabel(e.target.value)}
              placeholder="Bezeichnung (optional)"
              className="flex-1 bg-paper border border-line rounded-sm px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            />
            <button
              type="button"
              disabled={snapCreating}
              onClick={() => void createSnapshotHandler()}
              className="px-4 py-2 bg-ink text-paper text-sm rounded-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              {snapCreating ? "..." : "Snapshot erstellen"}
            </button>
          </div>
          {snapError && (
            <p className="text-xs text-accent mt-2">{snapError}</p>
          )}
        </Card>

        {snaps.length > 0 && (
          <Card>
            <p className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-4">Verlauf</p>
            <div className="divide-y divide-line-soft">
              {snaps.map((snap) => (
                <div key={snap.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-ink">
                      {snap.label ?? (
                        <span className="text-ink-faint italic">Kein Titel</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {new Date(snap.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {snaps.length >= 2 && (
          <Card className="mt-4">
            <p className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-4">Vergleich</p>
            <div className="flex gap-4 mb-6">
              <select
                value={compareA ?? ""}
                onChange={(e) => void selectCompareA(e.target.value || null)}
                className="flex-1 bg-paper border border-line rounded-sm px-3 py-2 text-sm text-ink"
              >
                <option value="">Snapshot A</option>
                {snaps.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label ?? "Kein Titel"} — {new Date(s.created_at).toLocaleDateString("de-DE")}
                  </option>
                ))}
              </select>
              <select
                value={compareB ?? ""}
                onChange={(e) => void selectCompareB(e.target.value || null)}
                className="flex-1 bg-paper border border-line rounded-sm px-3 py-2 text-sm text-ink"
              >
                <option value="">Snapshot B</option>
                {snaps.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label ?? "Kein Titel"} — {new Date(s.created_at).toLocaleDateString("de-DE")}
                  </option>
                ))}
              </select>
            </div>

            {snapA && snapB && (
              <div className="space-y-8">
                {(() => {
                  const rows = computeValuesDelta(snapA, snapB);
                  if (!rows.length) return null;
                  return (
                    <div>
                      <h3 className="display text-lg text-ink mb-3">Werte</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs tracking-[0.1em] uppercase text-ink-faint border-b border-line-soft">
                            <th className="text-left py-1 pr-4 font-normal">Wert</th>
                            <th className="text-right py-1 px-2 font-normal">wichtig A</th>
                            <th className="text-right py-1 px-2 font-normal">gelebt A</th>
                            <th className="text-right py-1 px-2 font-normal">wichtig B</th>
                            <th className="text-right py-1 px-2 font-normal">gelebt B</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-soft">
                          {rows.map((r) => (
                            <tr key={r.label}>
                              <td className="py-2 pr-4 text-ink">{r.label}</td>
                              <td className="py-2 px-2 text-right text-ink-soft">{r.weightA ?? "—"}</td>
                              <td className="py-2 px-2 text-right text-ink-soft">{r.livingA ?? "—"}</td>
                              <td className="py-2 px-2 text-right text-ink-soft">{r.weightB ?? "—"}</td>
                              <td className="py-2 px-2 text-right text-ink-soft">{r.livingB ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(() => {
                  const rows = computeYsqDelta(snapA, snapB);
                  const anyData = rows.some((r) => r.scoreA !== null || r.scoreB !== null);
                  if (!anyData) return null;
                  return (
                    <div>
                      <h3 className="display text-lg text-ink mb-3">YSQ-Schemata</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs tracking-[0.1em] uppercase text-ink-faint border-b border-line-soft">
                            <th className="text-left py-1 pr-4 font-normal">Schema</th>
                            <th className="text-right py-1 px-2 font-normal">Score A</th>
                            <th className="text-right py-1 px-2 font-normal">Score B</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-soft">
                          {rows.map((r) => (
                            <tr key={r.label}>
                              <td className="py-2 pr-4 text-ink">{r.label}</td>
                              <td className="py-2 px-2 text-right text-ink-soft">{r.scoreA ?? "—"}</td>
                              <td className="py-2 px-2 text-right text-ink-soft">{r.scoreB ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(() => {
                  const { phqA, gadA, phqB, gadB } = computeCheckinDelta(snapA, snapB);
                  if (phqA === null && phqB === null && gadA === null && gadB === null) return null;
                  return (
                    <div>
                      <h3 className="display text-lg text-ink mb-3">Check-in</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs tracking-[0.1em] uppercase text-ink-faint border-b border-line-soft">
                            <th className="text-left py-1 pr-4 font-normal">Skala</th>
                            <th className="text-right py-1 px-2 font-normal">A</th>
                            <th className="text-right py-1 px-2 font-normal">B</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-soft">
                          <tr>
                            <td className="py-2 pr-4 text-ink">PHQ-9</td>
                            <td className="py-2 px-2 text-right text-ink-soft">{phqA ?? "—"}</td>
                            <td className="py-2 px-2 text-right text-ink-soft">{phqB ?? "—"}</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 text-ink">GAD-7</td>
                            <td className="py-2 px-2 text-right text-ink-soft">{gadA ?? "—"}</td>
                            <td className="py-2 px-2 text-right text-ink-soft">{gadB ?? "—"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>
        )}
      </section>

      <p className="text-ink-faint text-xs mt-10 leading-relaxed print:mt-6">
        Dieser Bericht fasst deine eigenen Einträge zusammen. Er ist kein klinisches Gutachten.
        PHQ-9 und GAD-7 sind anerkannte Screening-Instrumente, ersetzen aber keine Diagnose.
      </p>
    </div>
  );
}
