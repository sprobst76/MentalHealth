import type { FC } from "react";
import type { AllData } from "../types";
import { beliefsActModule } from "./beliefs_act";
import { beliefsSchemaModule } from "./beliefs_schema";
import { goalsModule } from "./goals";
import { obstaclesModule } from "./obstacles";
import { orientationModule } from "./orientation";
import { syntheseModule } from "./synthese";
import { valuesModule } from "./values";

export interface ModuleProps<T> {
  data: T;
  onChange: (next: T) => void;
  allData: AllData;
}

export interface SummaryProps<T> {
  data: T;
  allData: AllData;
}

export interface ModuleDef<T = any> {
  id: string;
  title: string;
  phaseNum: string;
  kind: "data" | "special";
  schemaVersion: number;
  defaultData: () => T;
  migrations: Record<number, (data: any) => any>;
  Component?: FC<ModuleProps<T>>;
  SummaryBlock?: FC<SummaryProps<T>>;
  school?: string;
}

export const modules: ModuleDef[] = [
  orientationModule,
  valuesModule,
  beliefsSchemaModule,
  beliefsActModule,
  goalsModule,
  obstaclesModule,
  syntheseModule,
];

export function getModule(id: string): ModuleDef | undefined {
  return modules.find((m) => m.id === id);
}
