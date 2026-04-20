import { RatingDots } from "../../components/RatingDots";
import { SCHEMA_MAP } from "./constants";
import type { BeliefsSchemaData } from "./types";

interface Props {
  data: BeliefsSchemaData;
}

export function BeliefsSchemaSummary({ data }: Props) {
  const active = data.entries.filter((e) => e.active).sort((a, b) => b.intensity - a.intensity);
  if (active.length === 0) return <p className="text-ink-faint italic">Noch keine Glaubenssätze bearbeitet.</p>;

  return (
    <ul className="space-y-3">
      {active.map((e) => {
        const info = SCHEMA_MAP.get(e.schema_id);
        return (
          <li key={e.schema_id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-ink font-medium">{info?.label ?? e.schema_id}</span>
              <RatingDots value={e.intensity} />
            </div>
            {e.personal_text && (
              <p className="text-ink-soft text-sm italic">{'"'}{e.personal_text}{'"'}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
