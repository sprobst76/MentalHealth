import { describe, expect, it } from "vitest";
import { computeSchemaScore, getTop3Schemas, getValueGaps } from "./insights";

describe("computeSchemaScore", () => {
  it("returns null when all 5 items are null", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    expect(computeSchemaScore(answers, 0)).toBeNull();
  });

  it("sums non-null items, treating null as 0", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    answers[0] = 6;
    answers[1] = 5;
    // items 2, 3, 4 for schemaIdx 0 remain null → count as 0
    expect(computeSchemaScore(answers, 0)).toBe(11);
  });

  it("sums all 5 items when none are null", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    for (let i = 0; i < 5; i++) answers[i] = 6; // schemaIdx 0: all 6s
    expect(computeSchemaScore(answers, 0)).toBe(30);
  });

  it("reads the correct 5-item window for schema index 2", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    // schemaIdx 2 → items at positions 10–14
    answers[10] = 3;
    answers[11] = 4;
    // positions 12, 13, 14 remain null
    expect(computeSchemaScore(answers, 2)).toBe(7);
  });
});

describe("getTop3Schemas", () => {
  it("returns at most 3 schemas", () => {
    const answers = Array(90).fill(3) as (number | null)[];
    expect(getTop3Schemas(answers)).toHaveLength(3);
  });

  it("returns empty array when all answers are null", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    expect(getTop3Schemas(answers)).toHaveLength(0);
  });

  it("top result has highest score", () => {
    const answers = Array(90).fill(1) as (number | null)[];
    // schema 0 (abandonment) gets all 6s — score 30, everyone else gets 5
    for (let i = 0; i < 5; i++) answers[i] = 6;
    const top3 = getTop3Schemas(answers);
    expect(top3[0].schema.id).toBe("abandonment");
    expect(top3[0].score).toBe(30);
  });

  it("excludes schemas where all items are null", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    // Only schema 1 (mistrust, items 5-9) has answers
    answers[5] = 4;
    answers[6] = 3;
    const result = getTop3Schemas(answers);
    expect(result).toHaveLength(1);
    expect(result[0].schema.id).toBe("mistrust");
  });

  it("results are sorted descending by score", () => {
    const answers = Array(90).fill(null) as (number | null)[];
    // Schema 0: score 5 (one item answered)
    answers[0] = 5;
    // Schema 1: score 10 (two items answered)
    answers[5] = 6;
    answers[6] = 4;
    // Schema 2: score 3
    answers[10] = 3;
    const result = getTop3Schemas(answers);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
  });
});

describe("getValueGaps", () => {
  it("filters items where weight - living >= 2", () => {
    const items = [
      { id: "a", label: "A", weight: 5, living: 2, note: "" }, // gap 3 — included
      { id: "b", label: "B", weight: 3, living: 2, note: "" }, // gap 1 — excluded
      { id: "c", label: "C", weight: 4, living: 1, note: "" }, // gap 3 — included
      { id: "d", label: "D", weight: 2, living: 2, note: "" }, // gap 0 — excluded
    ];
    expect(getValueGaps(items)).toHaveLength(2);
  });

  it("sorts descending by gap size", () => {
    const items = [
      { id: "a", label: "A", weight: 5, living: 2, note: "" }, // gap 3
      { id: "b", label: "B", weight: 5, living: 1, note: "" }, // gap 4
    ];
    const result = getValueGaps(items);
    expect(result[0].id).toBe("b"); // larger gap first
  });

  it("returns empty array when no items meet threshold", () => {
    const items = [
      { id: "a", label: "A", weight: 3, living: 2, note: "" }, // gap 1
      { id: "b", label: "B", weight: 2, living: 2, note: "" }, // gap 0
    ];
    expect(getValueGaps(items)).toHaveLength(0);
  });

  it("does not mutate the input array", () => {
    const items = [
      { id: "a", label: "A", weight: 5, living: 1, note: "" },
      { id: "b", label: "B", weight: 5, living: 2, note: "" },
    ];
    const original = [...items];
    getValueGaps(items);
    expect(items).toEqual(original);
  });
});
