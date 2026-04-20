import type { ModuleDef } from "../registry";
import { ObstaclesModule } from "./ObstaclesModule";
import { ObstaclesSummary } from "./ObstaclesSummary";
import type { ObstaclesData } from "./types";

const defaultData = (): ObstaclesData => ({ obstacles: [], reflection: "" });

export const obstaclesModule: ModuleDef<ObstaclesData> = {
  id: "obstacles",
  title: "Hindernisse",
  phaseNum: "05",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: ObstaclesModule,
  SummaryBlock: ObstaclesSummary,
};
