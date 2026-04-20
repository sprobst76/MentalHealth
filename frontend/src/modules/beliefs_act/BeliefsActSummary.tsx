import { RatingDots } from "../../components/RatingDots";
import type { BeliefsActData } from "./types";

export function BeliefsActSummary({ data }: { data: BeliefsActData }) {
  const items = data.commitments.filter((c) => c.commitment.trim());
  if (items.length === 0) return <p className="text-ink-faint italic">Noch keine Verpflichtungen.</p>;
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li key={c.id}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-ink text-sm">{c.commitment}</span>
            <RatingDots value={c.resonance} />
          </div>
        </li>
      ))}
    </ul>
  );
}
