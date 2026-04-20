import type { ModuleDef } from "../registry";
import { SyntheseModule } from "./SyntheseModule";

export const syntheseModule: ModuleDef<unknown> = {
  id: "synthese",
  title: "Synthese",
  phaseNum: "06",
  kind: "special",
  schemaVersion: 1,
  defaultData: () => ({}),
  migrations: {},
  Component: SyntheseModule,
};
