import type { Ref } from "../../types";

export type Horizon = "30days" | "quarter" | "year" | "longer";
export type GoalStatus = "active" | "achieved" | "paused";

export interface Goal {
  id: string;
  title: string;
  description: string;
  value_refs: Ref[];
  horizon: Horizon;
  first_step: string;
  status: GoalStatus;
}

export interface GoalsData {
  goals: Goal[];
  reflection: string;
}
