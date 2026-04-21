// null = item skipped or not yet answered
export type YsqAnswer = number | null;

export interface YsqData {
  // Committed result after "Abschließen" — null until user completes the questionnaire for the first time.
  // Length 90, indexed [schemaIdx * 5 + itemIdx]
  answers: YsqAnswer[] | null;
  // In-progress draft during an active questionnaire session.
  // Same shape as answers; set to null after commit (D-07).
  draft: YsqAnswer[] | null;
  // Free-text note per schema. Key = schema index string "0"–"17".
  notes: Record<string, string>;
}
