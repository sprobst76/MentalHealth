export interface YsqSchema {
  id: string; // stable identifier, reuses beliefs_schema IDs where overlap exists
  label: string; // German schema name shown in UI
  items: string[]; // exactly 5 item texts — POPULATED IN PLAN-08 FROM reference/kompass.html
}

// 18 schemas in standard YSQ-S3 order.
// Array index determines answer slot position: schemaIdx * 5 + itemIdx
// ITEM TEXTS: placeholder strings below — plan-08 populates from reference/kompass.html (D-01).
export const YSQ_SCHEMAS: YsqSchema[] = [
  { id: "abandonment", label: "Verlassenheit / Instabilität", items: ["", "", "", "", ""] },
  { id: "mistrust", label: "Misstrauen / Missbrauch", items: ["", "", "", "", ""] },
  { id: "emotional_deprivation", label: "Emotionale Entbehrung", items: ["", "", "", "", ""] },
  { id: "defectiveness", label: "Unzulänglichkeit / Scham", items: ["", "", "", "", ""] },
  { id: "social_isolation", label: "Soziale Isolation / Entfremdung", items: ["", "", "", "", ""] },
  { id: "dependence", label: "Abhängigkeit / Inkompetenz", items: ["", "", "", "", ""] },
  { id: "vulnerability", label: "Anfälligkeit für Schaden oder Krankheit", items: ["", "", "", "", ""] },
  { id: "enmeshment", label: "Verstrickung / Unterentwickeltes Selbst", items: ["", "", "", "", ""] },
  { id: "failure", label: "Versagen", items: ["", "", "", "", ""] },
  { id: "entitlement", label: "Anspruchlichkeit / Grandiosität", items: ["", "", "", "", ""] },
  { id: "insufficient_self_control", label: "Unzureichende Selbstkontrolle", items: ["", "", "", "", ""] },
  { id: "subjugation", label: "Unterwerfung", items: ["", "", "", "", ""] },
  { id: "self_sacrifice", label: "Selbstaufopferung", items: ["", "", "", "", ""] },
  { id: "approval_seeking", label: "Streben nach Zustimmung", items: ["", "", "", "", ""] },
  { id: "negativity", label: "Negativität / Pessimismus", items: ["", "", "", "", ""] },
  { id: "emotional_inhibition", label: "Emotionale Gehemmtheit", items: ["", "", "", "", ""] },
  { id: "unrelenting_standards", label: "Hohe Standards / Überkritik", items: ["", "", "", "", ""] },
  { id: "punitiveness", label: "Bestrafen", items: ["", "", "", "", ""] },
];

// Maximum score per item — verify exact scale from reference/kompass.html in plan-08.
// UI-SPEC copywriting contract lists 4 answer options (1–4), so 4 is the current assumption.
// Update this constant in plan-08 after confirming the scale from the reference file.
export const YSQ_MAX_ITEM_SCORE = 4;
export const YSQ_MAX_SCHEMA_SCORE = 5 * YSQ_MAX_ITEM_SCORE; // 20 at 1-4 scale

// Lookup map: schema index string "0"–"17" → YsqSchema
export const YSQ_SCHEMA_MAP = new Map(YSQ_SCHEMAS.map((s, i) => [String(i), s]));

// 4-point Likert answer scale labels — match UI-SPEC copywriting contract exactly
export const YSQ_ANSWER_SCALE = [
  { value: 1, label: "Trifft gar nicht zu" },
  { value: 2, label: "Trifft kaum zu" },
  { value: 3, label: "Trifft eher zu" },
  { value: 4, label: "Trifft völlig zu" },
];
