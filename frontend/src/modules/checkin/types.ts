export interface CheckinEntry {
  id: string;
  timestamp: string;
  phq9: number[];
  gad7: number[];
  note: string;
}

export interface CheckinData {
  entries: CheckinEntry[];
}
