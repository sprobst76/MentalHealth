import { Card } from "../../components/Card";
import { getTop3Schemas, getValueGaps } from "../../lib/insights";
import { YSQ_MAX_SCHEMA_SCORE } from "../ysq/constants";
import { YSQ_HINTS_MAP } from "../ysq/hints";
import type { YsqData } from "../ysq/types";
import type { ValuesData } from "../values/types";
import type { AllData } from "../../types";
import {
  EXPLORE_AS_GOAL_LABEL,
  INSIGHTS_SECTION_HEADING,
  SCHEMA_INSIGHTS_GOAL_SUGGESTIONS_LABEL,
  SCHEMA_INSIGHTS_OBSTACLES_LABEL,
  VALUES_GAP_HINT_TEXT,
  VALUES_GAP_SECTION_LABEL,
} from "./constants";

interface Props {
  allData: AllData;
  onNavigateToGoals?: (prefill: { title: string; description: string }) => void;
}

export function InsightsBlock({ allData, onNavigateToGoals }: Props) {
  const ysqData = allData?.ysq as YsqData | undefined;
  if (!ysqData?.answers) return null;

  const top3 = getTop3Schemas(ysqData.answers);
  const valuesData = allData?.values as ValuesData | undefined;
  const gaps = getValueGaps(valuesData?.selected ?? []);

  if (top3.length === 0 && gaps.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      <h2 className="display text-2xl text-ink mb-4">{INSIGHTS_SECTION_HEADING}</h2>

      {top3.map(({ schema, score }) => {
        const hint = YSQ_HINTS_MAP.get(schema.id);
        if (!hint) return null;
        return (
          <Card key={schema.id}>
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h3 className="display text-2xl text-accent">{schema.label}</h3>
              <span className="text-sm text-ink-faint whitespace-nowrap">
                {score} / {YSQ_MAX_SCHEMA_SCORE}
              </span>
            </div>

            <p className="text-sm text-ink-soft leading-relaxed mb-4">
              {hint.healingDirection}
            </p>

            <p className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-2">
              {SCHEMA_INSIGHTS_GOAL_SUGGESTIONS_LABEL}
            </p>
            <ul className="space-y-1 border-l-2 border-line-soft pl-4 mb-4">
              {hint.goalSuggestions.map((s, i) => (
                <li key={i} className="text-sm text-ink">
                  {s}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() =>
                onNavigateToGoals?.({
                  title: schema.label,
                  description: hint.goalSuggestions[0],
                })
              }
              className="text-sm text-ocean hover:text-ink transition-colors text-left mb-4"
            >
              {EXPLORE_AS_GOAL_LABEL}
            </button>

            <p className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-2">
              {SCHEMA_INSIGHTS_OBSTACLES_LABEL}
            </p>
            <ul className="space-y-1 border-l-2 border-line-soft pl-4">
              {hint.obstacleHints.map((o, i) => (
                <li key={i} className="text-sm text-ink-soft">
                  {o}
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {gaps.length > 0 && (
        <Card>
          <p className="text-xs tracking-[0.15em] uppercase text-ink-faint mb-4">
            {VALUES_GAP_SECTION_LABEL}
          </p>
          <ul className="space-y-3">
            {gaps.map((item) => {
              const gap = item.weight - item.living;
              return (
                <li key={item.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-ink flex-1">{item.label}</span>
                    <span className="text-xs text-ink-faint whitespace-nowrap">
                      {`Lücke ${gap}`}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft italic mt-1">{VALUES_GAP_HINT_TEXT}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
