import { TrendChart } from "../../components/TrendChart";
import {
  daysSince,
  formatDate,
  gad7Severity,
  phq9Severity,
  sumAnswers,
} from "./scoring";
import type { CheckinData } from "./types";

interface Props {
  data: CheckinData;
}

export function CheckinSummary({ data }: Props) {
  if (data.entries.length === 0) {
    return (
      <p className="text-ink-faint italic">
        Noch kein Check-in erfasst. Starte im Modul „Wochen-Check-in".
      </p>
    );
  }

  const sorted = [...data.entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const latest = sorted[0];
  const phq = sumAnswers(latest.phq9);
  const gad = sumAnswers(latest.gad7);
  const chart = sorted.slice(0, 12).reverse();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-1">
            PHQ-9 · Depression
          </div>
          <div className="flex items-baseline gap-2">
            <span className="display text-2xl text-ink">{phq}</span>
            <span className="text-ink-faint text-xs">/ 27</span>
          </div>
          <div className="text-sm text-ink-soft">{phq9Severity(phq).label}</div>
        </div>
        <div>
          <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-1">
            GAD-7 · Angst
          </div>
          <div className="flex items-baseline gap-2">
            <span className="display text-2xl text-ink">{gad}</span>
            <span className="text-ink-faint text-xs">/ 21</span>
          </div>
          <div className="text-sm text-ink-soft">{gad7Severity(gad).label}</div>
        </div>
      </div>

      <div className="text-ink-faint text-xs">
        Letzter Check-in: {formatDate(latest.timestamp)} · vor {daysSince(latest.timestamp)} Tag
        {daysSince(latest.timestamp) === 1 ? "" : "en"}
        {sorted.length > 1 && ` · ${sorted.length} Einträge gesamt`}
      </div>

      {chart.length >= 2 && (
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          <div>
            <div className="text-xs text-ink-faint mb-1">PHQ-9 Verlauf</div>
            <TrendChart
              points={chart.map((e) => ({
                x: 0,
                y: sumAnswers(e.phq9),
                label: formatDate(e.timestamp).slice(0, 5),
              }))}
              maxY={27}
              thresholds={[
                { value: 5, tone: "sage" },
                { value: 10, tone: "ocean" },
                { value: 15, tone: "accent" },
              ]}
              height={80}
            />
          </div>
          <div>
            <div className="text-xs text-ink-faint mb-1">GAD-7 Verlauf</div>
            <TrendChart
              points={chart.map((e) => ({
                x: 0,
                y: sumAnswers(e.gad7),
                label: formatDate(e.timestamp).slice(0, 5),
              }))}
              maxY={21}
              thresholds={[
                { value: 5, tone: "sage" },
                { value: 10, tone: "ocean" },
                { value: 15, tone: "accent" },
              ]}
              height={80}
            />
          </div>
        </div>
      )}
    </div>
  );
}
