import type { ModuleDef } from "../registry";
import { BeliefsActModule } from "./BeliefsActModule";
import { BeliefsActSummary } from "./BeliefsActSummary";
import type { BeliefsActData } from "./types";

const defaultData = (): BeliefsActData => ({ commitments: [], reflection: "" });

export const beliefsActModule: ModuleDef<BeliefsActData> = {
  id: "beliefs_act",
  title: "Stärkende Glaubenssätze",
  phaseNum: "03",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: BeliefsActModule,
  SummaryBlock: BeliefsActSummary,
  school: "ACT",
};
