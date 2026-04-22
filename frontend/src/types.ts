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

export interface SnapshotMeta {
  id: string;
  label: string | null;
  created_at: string;
}

export interface SnapshotModuleEntry {
  schema_version: number;
  data: unknown;
}

export interface SnapshotFull extends SnapshotMeta {
  modules: Record<string, SnapshotModuleEntry>;
}
