export interface ActCommitment {
  id: string;
  value_id: string;
  commitment: string;
  defusion: string;
  first_action: string;
  resonance: number;
}

export interface BeliefsActData {
  commitments: ActCommitment[];
  reflection: string;
}
