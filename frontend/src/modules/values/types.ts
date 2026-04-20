export interface ValueItem {
  id: string;
  label: string;
  weight: number;
  note: string;
}

export interface Intention {
  id: string;
  value_id: string;
  text: string;
}

export interface ValuesData {
  selected: ValueItem[];
  intentions: Intention[];
  reflection: string;
}
