import { YSQ_SCHEMAS } from "./constants";
import type { YsqData } from "./types";

interface Props {
  data: YsqData;
}

export function YsqSummary({ data }: Props) {
  if (data.answers == null) {
    return (
      <p className="text-sm text-ink-faint italic">Noch kein YSQ ausgefüllt.</p>
    );
  }

  // Compute per-schema scores; null = all 5 items were null (skipped)
  const scored = YSQ_SCHEMAS.map((schema, i) => {
    const items = data.answers!.slice(i * 5, i * 5 + 5);
    const allNull = items.every((v) => v === null);
    const score = allNull ? null : items.reduce((sum, v) => (sum as number) + (v ?? 0), 0 as number);
    return { schema, score };
  });

  // Sort descending, excluding skipped schemas, take top 3
  const top3 = scored
    .filter((s) => s.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  if (top3.length === 0) {
    return (
      <p className="text-sm text-ink-faint italic">Noch kein YSQ ausgefüllt.</p>
    );
  }

  return (
    <div>
      <h3 className="display text-xl mb-3">Auffälligste Schemata</h3>
      <div>
        {top3.map(({ schema, score }) => (
          <div
            key={schema.id}
            className="flex items-center justify-between py-2 border-b border-line-soft last:border-b-0"
          >
            <span className="text-sm text-ink">{schema.label}</span>
            <span className="text-xs font-mono text-ink-faint">{score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
