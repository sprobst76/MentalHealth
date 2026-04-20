import type { ValuesData } from "./types";

interface Props {
  data: ValuesData;
}

function MiniDots({ value, tone }: { value: number; tone: "accent" | "sage" }) {
  const color = tone === "accent" ? "bg-accent" : "bg-sage";
  const border = tone === "accent" ? "border-accent" : "border-sage";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full border ${
            i < value ? `${color} ${border}` : "bg-transparent border-line"
          }`}
        />
      ))}
    </span>
  );
}

export function ValuesSummary({ data }: Props) {
  if (data.selected.length === 0) {
    return <p className="text-ink-faint italic">Noch keine Werte gewählt.</p>;
  }

  const byGap = [...data.selected]
    .map((v) => ({ ...v, gap: v.weight - v.living }))
    .sort((a, b) => b.gap - a.gap || b.weight - a.weight);
  const topGaps = byGap.filter((v) => v.gap >= 2).slice(0, 5);
  const others = byGap.filter((v) => v.gap < 2 && v.weight > 0).slice(0, 5);

  return (
    <div className="space-y-5">
      {topGaps.length > 0 && (
        <div>
          <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-3">
            Größte Lücken — Ansatzpunkte
          </div>
          <ul className="space-y-2">
            {topGaps.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-4">
                <span className="text-ink flex-1">{v.label}</span>
                <span className="inline-flex items-center gap-3 text-xs">
                  <MiniDots value={v.weight} tone="accent" />
                  <span className="text-ink-faint">vs.</span>
                  <MiniDots value={v.living} tone="sage" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <div className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-3">
            Gelebte Werte
          </div>
          <ul className="space-y-2">
            {others.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-4">
                <span className="text-ink flex-1">{v.label}</span>
                <span className="inline-flex items-center gap-3 text-xs">
                  <MiniDots value={v.weight} tone="accent" />
                  <span className="text-ink-faint">vs.</span>
                  <MiniDots value={v.living} tone="sage" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
