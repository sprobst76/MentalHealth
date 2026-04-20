import type { ModuleDef } from "../registry";
import { CheckinModule } from "./CheckinModule";
import { CheckinSummary } from "./CheckinSummary";
import type { CheckinData } from "./types";

const defaultData = (): CheckinData => ({ entries: [] });

export const checkinModule: ModuleDef<CheckinData> = {
  id: "checkin",
  title: "Wochen-Check-in",
  phaseNum: "W",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: CheckinModule,
  SummaryBlock: CheckinSummary,
};
