import { YSQ_SCHEMAS } from "../modules/ysq/constants";
import type { YsqSchema } from "../modules/ysq/constants";
import type { ValueItem } from "../modules/values/types";

/**
 * Compute the score for one YSQ schema.
 * Returns null if all 5 items for this schema are null (schema was skipped).
 * Null item answers count as 0 in the sum (partial completion).
 * Pattern copied from computeYsqDelta in SyntheseModule.tsx lines 180-198.
 */
export function computeSchemaScore(
  answers: (number | null)[],
  schemaIdx: number,
): number | null {
  const items = answers.slice(schemaIdx * 5, schemaIdx * 5 + 5);
  if (items.every((v) => v === null)) return null;
  return items.reduce<number>((s, v) => s + (v ?? 0), 0);
}

/**
 * Return up to 3 schemas with the highest scores from a flat answers array.
 * Schemas where all 5 items are null are excluded (not answered).
 * Result is sorted descending by score.
 */
export function getTop3Schemas(
  answers: (number | null)[],
): Array<{ schema: YsqSchema; score: number }> {
  return YSQ_SCHEMAS.map((schema, i) => {
    const score = computeSchemaScore(answers, i);
    if (score === null) return null;
    return { schema, score };
  })
    .filter((x): x is { schema: YsqSchema; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/**
 * Return all value items where weight − living >= 2, sorted descending by gap.
 * Pattern from ValuesSummary.tsx lines 29-33 and buildTextReport lines 60-74.
 */
export function getValueGaps(selected: ValueItem[]): ValueItem[] {
  return [...selected]
    .filter((v) => v.weight - v.living >= 2)
    .sort((a, b) => b.weight - b.living - (a.weight - a.living));
}
