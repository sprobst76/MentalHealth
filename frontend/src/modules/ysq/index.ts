import type { ModuleDef } from "../registry";
import { YsqModule } from "./YsqModule";
import { YsqSummary } from "./YsqSummary";
import type { YsqData } from "./types";

const defaultData = (): YsqData => ({
  answers: null,
  draft: null,
  notes: {},
});

export const ysqModule: ModuleDef<YsqData> = {
  id: "ysq",
  title: "Schemafragebögen (YSQ)",
  phaseNum: "02",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: YsqModule,
  SummaryBlock: YsqSummary,
};
