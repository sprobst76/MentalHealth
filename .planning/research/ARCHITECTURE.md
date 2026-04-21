# Architecture Research
**Project:** Kompass  
**Milestone context:** Subsequent — snapshot system, export/import backend API, error boundaries  
**Researched:** 2026-04-21  
**Confidence:** HIGH (all findings derived from direct codebase inspection)

---

## Snapshot System Design

### What the DB already provides

`Snapshot` table: `id UUID, user_id UUID, label VARCHAR|NULL, data JSON, created_at DATETIME`. No `updated_at` — snapshots are immutable by design. That is correct; never add update semantics to a point-in-time record.

### What a snapshot's `data` JSON must contain

A snapshot is a full state dump taken at a moment in time. It must be self-contained enough to reconstruct the state without querying any other table. The schema:

```json
{
  "_version": 1,
  "_snapshot_at": "2026-04-21T14:00:00Z",
  "modules": {
    "values": {
      "schema_version": 3,
      "data": { ... },
      "updated_at": "2026-04-20T10:00:00Z"
    },
    "beliefs_schema": {
      "schema_version": 2,
      "data": { ... },
      "updated_at": "2026-04-19T18:30:00Z"
    }
  }
}
```

Key decisions:
- Include `schema_version` per module entry. Without it, you cannot run migrations when reading a snapshot from the past after a module schema upgrade.
- Include `updated_at` per module entry so the UI can show when each module was last edited at the time of snapshot.
- Only include modules that have a stored `ModuleRecord`. Do not include modules that only have default data (nothing to snapshot).
- `_version` tracks the snapshot envelope format itself, independent of module schema versions.

### API design

```
POST /api/snapshots
  Body: { label?: string }
  Response: SnapshotResponse { id, label, created_at, module_count }
  Behavior: reads all current ModuleRecords for the user, composes the data JSON, inserts Snapshot row.

GET /api/snapshots
  Response: list[SnapshotResponse]  (newest first, no data blob — list metadata only)

GET /api/snapshots/{snapshot_id}
  Response: SnapshotDetailResponse { id, label, created_at, data }
  Behavior: returns the full data blob for diffing or restoring
```

The list endpoint intentionally omits `data` — it can be megabytes. Clients fetch the detail only when the user opens a specific snapshot.

`SnapshotResponse` already exists in `backend/app/schemas/api.py` (id, label, created_at). Add `module_count: int` there to make the list useful without fetching each detail. Add a separate `SnapshotDetailResponse` that extends it with `data: dict`.

### Router placement

Create `backend/app/routers/snapshots.py` mirroring the structure of `routers/modules.py`. Register it in `main.py` with `prefix="/api/snapshots"`. Use the same `Depends(current_user_id)` and `Depends(get_session)` pattern already established.

### Snapshot creation — correct query

```python
records = session.exec(
    select(ModuleRecord).where(ModuleRecord.user_id == user_id)
).all()

data = {
    "_version": 1,
    "_snapshot_at": datetime.now(timezone.utc).isoformat(),
    "modules": {
        r.module_id: {
            "schema_version": r.schema_version,
            "data": r.data,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in records
    }
}
```

Do not run migrations during snapshot creation. Store raw stored versions. Run migrations on read (same pattern as `GET /api/modules/{id}`).

---

## Export/Import API Design

### Current state (bug)

`App.tsx` lines 12–35: both `exportJSON` and `importJSON` call `localApi` unconditionally, regardless of `VITE_STORAGE` mode. Import in server mode silently writes to localStorage while the API backend is ignored — data appears to import successfully but the backend never sees it. This is explicitly listed in PROJECT.md as a known critical gap.

### Export format — compatibility requirement

PROJECT.md constraint: "Import-Format muss mit HTML-v1-Export kompatibel bleiben."

The HTML v1 export format (from `reference/kompass.html`) is what `localApi.exportAll()` already produces:

```json
{
  "_version": 1,
  "_exported": "2026-04-21T14:00:00Z",
  "values": { "schema_version": 3, "data": {...}, "updated_at": "..." },
  "beliefs_schema": { "schema_version": 2, "data": {...}, "updated_at": "..." }
}
```

Module entries are top-level keys (not nested under `"modules"`). This differs from the snapshot format (which nests under `"modules"` to keep envelope metadata clean). The export format must stay flat for backward compatibility.

### Server-side export endpoint

```
GET /api/export
  Response: JSON file download (Content-Disposition: attachment)
  Body: same flat format as localApi.exportAll() — { _version, _exported, [module_id]: {schema_version, data, updated_at} }
```

Implementation: query all `ModuleRecord` rows for the user, compose the flat dict, return as `JSONResponse` with `Content-Disposition: attachment; filename="kompass-{date}.json"`.

Do not run migrations on export. Export the raw stored versions so the file is an accurate snapshot of what was in the DB, not a silently upgraded version.

### Server-side import endpoint

```
POST /api/import
  Body: JSON (the same flat export format)
  Response: { imported: int, skipped: int, errors: list[str] }
```

Implementation strategy:
1. Validate envelope: `_version` must be present and equal to 1.
2. For each key that matches a known module ID (from `MODULES` registry), upsert a `ModuleRecord`. Use the same upsert logic as `PUT /api/modules/{id}` but bypass Pydantic validation (the import is a raw restore, not a validated write — allow stale schema versions through, they will migrate on next GET).
3. Skip unknown keys (`_version`, `_exported`, unknown module IDs) silently; count them in `skipped`.
4. Return counts so the UI can show "Imported 8 modules."

Critically: do NOT run Pydantic validation on import. The data may be from an older schema version. Running validation against the current schema will reject valid historical data. Store the raw `data` blob and the `schema_version` from the file; migration runs lazily on next GET.

### Frontend fix for mode-aware export/import

`api.ts` needs `exportAll` and `importAll` added to both `serverApi` and the unified `api` export. `App.tsx` then calls `api.exportAll()` / `api.importAll()` instead of `localApi.*`.

```typescript
// api.ts additions to serverApi:
exportAll: async (): Promise<Record<string, unknown>> =>
  request<Record<string, unknown>>("/api/export"),

importAll: async (dump: Record<string, unknown>): Promise<void> =>
  request<void>("/api/import", { method: "POST", body: JSON.stringify(dump) }),
```

`localApi` already implements these methods. The unified `api` export picks the right adapter automatically via `USE_LOCAL`.

`App.tsx` `exportJSON()` becomes async: `const data = await api.exportAll()`. `importJSON` calls `api.importAll(dump)` (which returns a promise) instead of `localApi.importAll(dump)` (which is synchronous void).

---

## Error Boundary Strategy

### Current state

`App.tsx` has no React error boundary. A runtime error in any module component propagates to the React root and crashes the entire app (blank white screen). For a registry-driven architecture where modules render independently, this is a high-impact gap: one broken module makes all others inaccessible.

### Recommended strategy: per-module boundary, not app-wide

One error boundary wrapping only the active module's render site (the `<active.Component .../>` call in `main`). This is the minimal and correct scope:

```tsx
// frontend/src/components/ModuleErrorBoundary.tsx
import { Component, type ReactNode } from "react";

interface Props { moduleId: string; children: ReactNode; }
interface State { error: Error | null; }

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // No external logging — privacy constraint. Console only.
    console.error(`[Kompass] Module "${this.props.moduleId}" crashed:`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-12 text-ink-faint space-y-2">
          <p className="text-accent">Dieses Modul konnte nicht geladen werden.</p>
          <p className="text-sm font-mono break-all">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="text-sm text-ink-soft underline"
          >
            Erneut versuchen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Usage in `App.tsx` — replace the bare render block:

```tsx
{active?.Component && state?.loaded ? (
  <ModuleErrorBoundary key={activeId} moduleId={activeId}>
    <active.Component
      data={state.data}
      onChange={handleChange(active.id)}
      allData={allData}
    />
  </ModuleErrorBoundary>
) : (
  <div className="p-12 text-ink-faint">Lade…</div>
)}
```

The `key={activeId}` prop is essential: it resets the boundary state when the user navigates to a different module. Without it, an error in module A keeps the error UI even after navigating away.

Why not wrap the entire `<main>` or `<App>`? The sidebar must remain functional so the user can navigate away from the broken module. An app-wide boundary would also catch sidebar errors (extremely unlikely but still) and offers no recovery path.

Why not one boundary per registry entry (wrapping each nav button)? Nav buttons have no user-provided render logic — they can't throw from module-specific data. Scope the boundary to the actual risk surface.

---

## localApi Migration Fix Pattern

### The bug

`localApi.getModule` (lines 31–52 of `api.local.ts`) reads the stored blob and returns it as-is. If `stored.schema_version < mod.schemaVersion`, no migration runs. The caller in `App.tsx` (`loadModule`) does run `runMigrations` after getting the record — but only if `record.schema_version < mod.schemaVersion`. 

Looking at `App.tsx` lines 65–69:

```typescript
const record = await api.getModule<any>(id);
const data =
  record.schema_version < mod.schemaVersion
    ? runMigrations(record.data, record.schema_version, mod.schemaVersion, mod.migrations)
    : record.data;
```

`App.tsx` already handles this correctly for the case it knows about. The actual bug is more subtle: `localApi.getModule` returns `stored.schema_version` (the on-disk version, which may be stale), so `App.tsx` does see the version mismatch and runs `runMigrations` — but it never writes the migrated data back to localStorage. The next load reads the stale blob again and re-runs migrations. It is a performance issue and a correctness risk (if `runMigrations` ever has side effects or fails partway), not a silent data corruption issue in steady state.

The server-side `GET /api/modules/{id}` handler runs migrations AND persists the result (lines 59–65 of `routers/modules.py`). The local adapter should mirror this.

### Cleanest fix: migrate-and-persist inside `localApi.getModule`

```typescript
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
    // Import runMigrations at top of file
    const migratedData = runMigrations<T>(
      stored.data,
      stored.schema_version,
      mod.schemaVersion,
      mod.migrations,
    );
    const upgraded = { schema_version: mod.schemaVersion, data: migratedData, updated_at: now() };
    localStorage.setItem(KEY(id), JSON.stringify(upgraded));
    return Promise.resolve({ module_id: id, ...upgraded });
  }

  return Promise.resolve({
    module_id: id,
    schema_version: stored.schema_version,
    data: stored.data,
    updated_at: stored.updated_at,
  });
},
```

This requires importing `runMigrations` from `../lib/migrations` at the top of `api.local.ts`. There is no circular dependency: `api.local.ts` imports from `modules/registry` already; `lib/migrations.ts` imports nothing from the module tree.

With this fix, `App.tsx` `loadModule` no longer needs its own migration call — but keeping it there as a fallback is harmless (it will always see `record.schema_version === mod.schemaVersion` after the fix and skip the branch). Either remove it for clarity or leave it as a safety net; both are fine.

---

## Build Order Implications

The four items have the following dependency structure:

```
localApi migration fix   — no dependencies, safe to implement standalone
Error boundary           — no dependencies, safe to implement standalone
Export/Import backend    — depends on: localApi fix (frontend export/import must be mode-aware before backend endpoint is wired up)
Snapshot system          — depends on: nothing technically, but shares router/schema patterns with export/import
```

Recommended implementation order within a single milestone:

1. **localApi migration fix** — one file change (`api.local.ts`), high correctness value, zero risk. Do first.
2. **Error boundary** — new component + two-line change in `App.tsx`. Do second; improves resilience for all subsequent work.
3. **Export/Import** — backend router (`routers/export_import.py` or inline in a new `routers/data.py`) + frontend `api.ts` additions + `App.tsx` mode-aware calls. This also fixes the known `App.tsx` bug of always calling `localApi`.
4. **Snapshot system** — backend router (`routers/snapshots.py`) + minimal frontend UI. Can be done after export/import since they share schema/router patterns; implementing export/import first validates the pattern.

Checkin backend module (404 in server mode) is orthogonal to all four items above — it is a missing `ModuleSpec` registration, not an architectural concern. It should be tracked separately but does not block or depend on any of the four milestone items.

---

*Confidence: HIGH — all findings from direct source inspection. No external sources required.*
