import type { ObstaclesData } from "./types";

export function ObstaclesSummary({ data }: { data: ObstaclesData }) {
  const items = data.obstacles.filter((o) => o.title.trim());
  if (items.length === 0) return <p className="text-ink-faint italic">Noch keine Hindernisse benannt.</p>;
  return (
    <ul className="space-y-2">
      {items.map((o) => (
        <li key={o.id} className="text-ink">
          <div>{o.title}</div>
          {o.strategy && <div className="text-sm text-ink-soft italic mt-1">→ {o.strategy}</div>}
        </li>
      ))}
    </ul>
  );
}
