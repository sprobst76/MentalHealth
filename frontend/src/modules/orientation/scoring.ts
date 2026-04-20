import {
  DOMAINS,
  ITEMS,
  SCHEMA_LABELS,
  VALUE_LABELS,
} from "./constants";
import type {
  DerivedSchema,
  DerivedValue,
  DomainScore,
  ItemResponse,
  OrientationProfile,
} from "./types";

const responseMap = (responses: ItemResponse[]): Map<string, number> =>
  new Map(responses.map((r) => [r.item_id, r.rating]));

/** 0 at rating 3 (uncertain), 1 at rating 1 or 5 (clear opinion) */
function itemClarity(rating: number): number {
  return Math.abs(rating - 3) / 2;
}

export function calcProfile(responses: ItemResponse[]): OrientationProfile {
  const rMap = responseMap(responses);
  const totalItems = ITEMS.length;
  const answered = responses.length;

  // ── Domain scores ──────────────────────────────────────────────────────────
  const domains: DomainScore[] = DOMAINS.map((d) => {
    const domainItems = ITEMS.filter((i) => i.domain === d.id);
    const answered = domainItems.filter((i) => rMap.has(i.id));
    const completion = domainItems.length > 0 ? answered.length / domainItems.length : 0;
    const clarity =
      answered.length > 0
        ? (answered.reduce((sum, i) => sum + itemClarity(rMap.get(i.id)!), 0) /
            answered.length) *
          completion
        : 0;
    return { id: d.id, label: d.label, completion, clarity };
  });

  const totalCompletion = totalItems > 0 ? answered / totalItems : 0;
  const clarityScore =
    domains.length > 0
      ? domains.reduce((s, d) => s + d.clarity, 0) / domains.length
      : 0;

  // ── Value scores ───────────────────────────────────────────────────────────
  const valueAccum: Record<string, { score: number; max: number }> = {};
  for (const item of ITEMS) {
    const rating = rMap.get(item.id);
    if (rating === undefined) continue;
    for (const m of item.mappings) {
      if (m.type !== "value") continue;
      const effective = m.direction === "inverse" ? 6 - rating : rating;
      if (!valueAccum[m.id]) valueAccum[m.id] = { score: 0, max: 0 };
      valueAccum[m.id].score += effective * m.weight;
      valueAccum[m.id].max += 5 * m.weight;
    }
  }

  const topValues: DerivedValue[] = Object.entries(valueAccum)
    .map(([id, { score, max }]) => ({
      id,
      label: VALUE_LABELS[id] ?? id,
      score: max > 0 ? score / max : 0,
    }))
    .filter((v) => v.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // ── Schema scores ──────────────────────────────────────────────────────────
  const schemaAccum: Record<string, { score: number; max: number }> = {};
  for (const item of ITEMS) {
    const rating = rMap.get(item.id);
    if (rating === undefined) continue;
    for (const m of item.mappings) {
      if (m.type !== "schema") continue;
      const effective = m.direction === "inverse" ? 6 - rating : rating;
      if (!schemaAccum[m.id]) schemaAccum[m.id] = { score: 0, max: 0 };
      schemaAccum[m.id].score += effective * m.weight;
      schemaAccum[m.id].max += 5 * m.weight;
    }
  }

  const activeSchemas: DerivedSchema[] = Object.entries(schemaAccum)
    .map(([id, { score, max }]) => ({
      id,
      label: SCHEMA_LABELS[id] ?? id,
      score: max > 0 ? score / max : 0,
    }))
    .filter((s) => s.score >= 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return { totalCompletion, clarityScore, domains, topValues, activeSchemas };
}

/** Verbal label for overall orientation readiness */
export function orientationLabel(profile: OrientationProfile): string {
  const p = profile.totalCompletion;
  if (p < 0.25) return "Noch am Anfang";
  if (p < 0.5) return "Im Entstehen";
  if (p < 0.75) return "Gut unterwegs";
  return "Klar orientiert";
}

/** 0–100 integer, weighted: 60% completion + 40% clarity */
export function orientationScore(profile: OrientationProfile): number {
  return Math.round(
    (profile.totalCompletion * 0.6 + profile.clarityScore * 0.4) * 100,
  );
}
