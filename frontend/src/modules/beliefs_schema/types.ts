export interface BeliefEntry {
  schema_id: string;
  active: boolean;
  intensity: number;
  personal_text: string;
  counter_evidence: string;
  alternative: string;
}

export interface BeliefsSchemaData {
  entries: BeliefEntry[];
  reflection: string;
}
