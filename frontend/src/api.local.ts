/**
 * localStorage adapter — same interface as api.ts but no server required.
 * Used when building with VITE_STORAGE=local (single-file offline mode).
 *
 * Storage layout:
 *   kompass:module:<id>  →  { schema_version, data, updated_at }
 */
import { runMigrations } from "./lib/migrations";
import { modules } from "./modules/registry";
import type { ModuleRecord, ModuleSpecWire, SnapshotMeta, SnapshotFull, SnapshotModuleEntry } from "./types";

const KEY = (id: string) => `kompass:module:${id}`;
const SNAPS_KEY = "kompass:snapshots";
const SNAP_KEY = (id: string) => `kompass:snapshot:${id}`;

function now(): string {
  return new Date().toISOString();
}

function loadSnaps(): SnapshotMeta[] {
  const raw = localStorage.getItem(SNAPS_KEY);
  return raw ? (JSON.parse(raw) as SnapshotMeta[]) : [];
}

export const localApi = {
  listModules(): Promise<ModuleSpecWire[]> {
    return Promise.resolve(
      modules.map((m) => ({
        id: m.id,
        title: m.title,
        phase_num: m.phaseNum,
        order: modules.indexOf(m),
        schema_version: m.schemaVersion,
        school: m.school ?? null,
      })),
    );
  },

  getModule<T>(id: string): Promise<ModuleRecord<T>> {
    const raw = localStorage.getItem(KEY(id));
    const mod = modules.find((m) => m.id === id);
    if (!mod) return Promise.reject(new Error(`Unknown module: ${id}`));

    if (!raw) {
      return Promise.resolve({
        module_id: id,
        schema_version: mod.schemaVersion,
        data: mod.defaultData() as T,
        updated_at: null,
      });
    }

    const stored = JSON.parse(raw) as { schema_version: number; data: T; updated_at: string };

    if (stored.schema_version < mod.schemaVersion) {
      const migrated = runMigrations<T>(
        stored.data,
        stored.schema_version,
        mod.schemaVersion,
        mod.migrations,
      );
      const updated = { schema_version: mod.schemaVersion, data: migrated, updated_at: now() };
      localStorage.setItem(KEY(id), JSON.stringify(updated));
      return Promise.resolve({ module_id: id, ...updated });
    }

    return Promise.resolve({
      module_id: id,
      schema_version: stored.schema_version,
      data: stored.data,
      updated_at: stored.updated_at,
    });
  },

  putModule<T>(id: string, data: T): Promise<ModuleRecord<T>> {
    const mod = modules.find((m) => m.id === id);
    if (!mod) return Promise.reject(new Error(`Unknown module: ${id}`));

    const record = { schema_version: mod.schemaVersion, data, updated_at: now() };
    localStorage.setItem(KEY(id), JSON.stringify(record));

    return Promise.resolve({ module_id: id, ...record });
  },

  health(): Promise<{ status: string }> {
    return Promise.resolve({ status: "ok (local)" });
  },

  exportAll(): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = { _version: 1, _exported: new Date().toISOString() };
    for (const mod of modules) {
      const raw = localStorage.getItem(KEY(mod.id));
      if (raw) out[mod.id] = JSON.parse(raw);
    }
    return Promise.resolve(out);
  },

  importAll(dump: Record<string, unknown>): Promise<void> {
    for (const mod of modules) {
      const entry = dump[mod.id];
      if (entry && typeof entry === "object") {
        localStorage.setItem(KEY(mod.id), JSON.stringify(entry));
      }
    }
    return Promise.resolve();
  },

  createSnapshot(label?: string): Promise<SnapshotMeta> {
    const metas = loadSnaps();
    const MAX_SNAPSHOTS = 200;
    if (metas.length >= MAX_SNAPSHOTS) {
      return Promise.reject(
        new Error(`Maximum number of snapshots (${MAX_SNAPSHOTS}) reached.`)
      );
    }
    const id = crypto.randomUUID();
    const created_at = now();
    const modulesBlob: Record<string, SnapshotModuleEntry> = {};
    for (const mod of modules) {
      const raw = localStorage.getItem(KEY(mod.id));
      if (raw) modulesBlob[mod.id] = JSON.parse(raw) as SnapshotModuleEntry;
    }
    const meta: SnapshotMeta = { id, label: label ?? null, created_at };
    const full: SnapshotFull = { ...meta, modules: modulesBlob };
    localStorage.setItem(SNAP_KEY(id), JSON.stringify(full));
    metas.unshift(meta);
    localStorage.setItem(SNAPS_KEY, JSON.stringify(metas));
    return Promise.resolve(meta);
  },

  listSnapshots(): Promise<SnapshotMeta[]> {
    return Promise.resolve(loadSnaps());
  },

  getSnapshot(id: string): Promise<SnapshotFull> {
    const raw = localStorage.getItem(SNAP_KEY(id));
    if (!raw) return Promise.reject(new Error(`Snapshot not found: ${id}`));
    return Promise.resolve(JSON.parse(raw) as SnapshotFull);
  },
};
