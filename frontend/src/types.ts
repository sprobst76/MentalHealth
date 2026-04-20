export type Ref = { moduleId: string; id: string };

export interface ModuleRecord<T = unknown> {
  module_id: string;
  schema_version: number;
  data: T;
  updated_at: string | null;
}

export interface ModuleSpecWire {
  id: string;
  title: string;
  phase_num: string;
  order: number;
  schema_version: number;
  school: string | null;
}

export type AllData = Record<string, unknown>;
