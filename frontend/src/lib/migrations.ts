/**
 * Runs module-local data migrations. Mirrors the backend's ModuleSpec.migrate —
 * but kept here so the frontend can self-heal from a stale localStorage blob
 * even when the API is offline.
 */
export function runMigrations<T>(
  data: unknown,
  fromVersion: number,
  targetVersion: number,
  migrations: Record<number, (d: any) => any>,
): T {
  let current: any = data;
  for (let v = fromVersion + 1; v <= targetVersion; v++) {
    const migration = migrations[v];
    if (migration) current = migration(current);
  }
  return current as T;
}
