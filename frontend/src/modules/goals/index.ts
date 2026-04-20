import type { ModuleDef } from "../registry";
import { GoalsModule } from "./GoalsModule";
import { GoalsSummary } from "./GoalsSummary";
import type { GoalsData } from "./types";

const defaultData = (): GoalsData => ({ goals: [], reflection: "" });

export const goalsModule: ModuleDef<GoalsData> = {
  id: "goals",
  title: "Ziele",
  phaseNum: "04",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: GoalsModule,
  SummaryBlock: GoalsSummary,
};
