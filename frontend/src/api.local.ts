/**
 * localStorage adapter — same interface as api.ts but no server required.
 * Used when building with VITE_STORAGE=local (single-file offline mode).
 *
 * Storage layout:
 *   kompass:module:<id>  →  { schema_version, data, updated_at }
 */
import { modules } from "./modules/registry";
import type { ModuleRecord, ModuleSpecWire } from "./types";

const KEY = (id: string) => `kompass:module:${id}`;

function now(): string {
  return new Date().toISOString();
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
};
