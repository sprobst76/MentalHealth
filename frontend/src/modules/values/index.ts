import type { ModuleDef } from "../registry";
import { ValuesModule } from "./ValuesModule";
import { ValuesSummary } from "./ValuesSummary";
import type { ValuesData } from "./types";

const defaultData = (): ValuesData => ({
  selected: [],
  intentions: [],
  reflection: "",
});

export const valuesModule: ModuleDef<ValuesData> = {
  id: "values",
  title: "Werte",
  phaseNum: "01",
  kind: "data",
  schemaVersion: 2,
  defaultData,
  migrations: {
    2: (d: any) => ({
      ...d,
      selected: (d.selected ?? []).map((v: any) => ({ living: 0, ...v })),
    }),
  },
  Component: ValuesModule,
  SummaryBlock: ValuesSummary,
};
