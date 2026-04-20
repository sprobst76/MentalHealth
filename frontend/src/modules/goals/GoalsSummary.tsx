import { HORIZON_LABEL, STATUS_LABEL } from "./constants";
import type { GoalsData } from "./types";

export function GoalsSummary({ data }: { data: GoalsData }) {
  const active = data.goals.filter((g) => g.status === "active" && g.title.trim());
  if (active.length === 0) return <p className="text-ink-faint italic">Noch keine aktiven Ziele.</p>;
  return (
    <ul className="space-y-2">
      {active.map((g) => (
        <li key={g.id}>
          <div className="text-xs text-ink-faint uppercase tracking-wider">
            {HORIZON_LABEL[g.horizon]} · {STATUS_LABEL[g.status]}
          </div>
          <div className="text-ink">{g.title}</div>
        </li>
      ))}
    </ul>
  );
}
