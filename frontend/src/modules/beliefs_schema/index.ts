import type { ModuleDef } from "../registry";
import { BeliefsSchemaModule } from "./BeliefsSchemaModule";
import { BeliefsSchemaSummary } from "./BeliefsSchemaSummary";
import type { BeliefsSchemaData } from "./types";

const defaultData = (): BeliefsSchemaData => ({ entries: [], reflection: "" });

export const beliefsSchemaModule: ModuleDef<BeliefsSchemaData> = {
  id: "beliefs_schema",
  title: "Glaubenssätze",
  phaseNum: "02",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: BeliefsSchemaModule,
  SummaryBlock: BeliefsSchemaSummary,
  school: "Schema",
};
