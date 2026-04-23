import { describe, expect, it } from "vitest";
import { YSQ_HINTS, YSQ_HINTS_MAP } from "./hints";
import { YSQ_SCHEMAS } from "./constants";

describe("YSQ_HINTS", () => {
  it("contains exactly 18 entries", () => {
    expect(YSQ_HINTS).toHaveLength(18);
  });

  it("all YSQ_SCHEMAS IDs are present in YSQ_HINTS_MAP", () => {
    for (const schema of YSQ_SCHEMAS) {
      expect(
        YSQ_HINTS_MAP.has(schema.id),
        `Missing hint for schema: ${schema.id}`,
      ).toBe(true);
    }
  });

  it("every hint has non-empty healingDirection", () => {
    for (const hint of YSQ_HINTS) {
      expect(hint.healingDirection.trim().length).toBeGreaterThan(0);
    }
  });

  it("every hint has at least 2 goalSuggestions", () => {
    for (const hint of YSQ_HINTS) {
      expect(hint.goalSuggestions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every hint has at least 1 obstacleHint", () => {
    for (const hint of YSQ_HINTS) {
      expect(hint.obstacleHints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("YSQ_HINTS array order matches YSQ_SCHEMAS order", () => {
    YSQ_SCHEMAS.forEach((schema, i) => {
      expect(YSQ_HINTS[i].schemaId).toBe(schema.id);
    });
  });
});
