import type { ModuleDef } from "../registry";
import { OrientationModule } from "./OrientationModule";
import { OrientationSummary } from "./OrientationSummary";
import type { OrientationData } from "./types";

const defaultData = (): OrientationData => ({ responses: [] });

export const orientationModule: ModuleDef<OrientationData> = {
  id: "orientation",
  title: "Orientierung",
  phaseNum: "00",
  kind: "data",
  schemaVersion: 1,
  defaultData,
  migrations: {},
  Component: OrientationModule,
  SummaryBlock: OrientationSummary,
};
