import { RatingDots } from "../../components/RatingDots";
import type { ValuesData } from "./types";

interface Props {
  data: ValuesData;
}

export function ValuesSummary({ data }: Props) {
  const top = [...data.selected].sort((a, b) => b.weight - a.weight).slice(0, 5);
  if (top.length === 0) {
    return (
      <p className="text-ink-faint italic">Noch keine Werte gewählt.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {top.map((v) => (
        <li key={v.id} className="flex items-center justify-between gap-4">
          <span className="text-ink">{v.label}</span>
          <RatingDots value={v.weight} />
        </li>
      ))}
    </ul>
  );
}
