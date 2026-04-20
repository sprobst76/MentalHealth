export type DomainId =
  | "autonomy"
  | "connection"
  | "selfworth"
  | "safety"
  | "meaning"
  | "expression";

export type ScaleType = "agreement" | "importance" | "frequency";

export type MappingType = "value" | "schema";

export interface Mapping {
  type: MappingType;
  id: string;
  weight: number;
  direction: "direct" | "inverse";
}

export interface QuestionItem {
  id: string;
  domain: DomainId;
  text: string;
  scaleType: ScaleType;
  mappings: Mapping[];
}

export interface ItemResponse {
  item_id: string;
  rating: number;
}

export interface OrientationData {
  responses: ItemResponse[];
}

export interface DomainScore {
  id: DomainId;
  label: string;
  completion: number;
  clarity: number;
}

export interface DerivedValue {
  id: string;
  label: string;
  score: number;
}

export interface DerivedSchema {
  id: string;
  label: string;
  score: number;
}

export interface OrientationProfile {
  totalCompletion: number;
  clarityScore: number;
  domains: DomainScore[];
  topValues: DerivedValue[];
  activeSchemas: DerivedSchema[];
}
