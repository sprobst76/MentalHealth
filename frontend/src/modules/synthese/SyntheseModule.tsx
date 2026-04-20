import { useState } from "react";
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

export function SyntheseModule({ allData }: ModuleProps<unknown>) {
  const [copied, setCopied] = useState(false);
  const dataModules = modules.filter((m) => m.id !== "synthese" && m.SummaryBlock);

  const checkin = allData?.checkin as CheckinData | undefined;
  const latest = checkin?.entries?.length
    ? [...checkin.entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
    : null;
  const crisis = latest && latest.phq9[PHQ9_SUICIDE_ITEM_INDEX] > 0;

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

      <p className="text-ink-faint text-xs mt-10 leading-relaxed print:mt-6">
        Dieser Bericht fasst deine eigenen Einträge zusammen. Er ist kein klinisches Gutachten.
        PHQ-9 und GAD-7 sind anerkannte Screening-Instrumente, ersetzen aber keine Diagnose.
      </p>
    </div>
  );
}
