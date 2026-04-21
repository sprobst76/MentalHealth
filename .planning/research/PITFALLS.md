# Pitfalls Research

**Project:** Kompass
**Context:** Brownfield — adding YSQ module, snapshot system, checkin backend to existing codebase
**Researched:** 2026-04-21
**Confidence:** HIGH (all critical findings verified against actual source code)

---

## Data Integrity Risks (known + mitigations)

### Pitfall 1: localApi.getModule silently returns stale schema data

**What goes wrong:** `localApi.getModule` in `frontend/src/api.local.ts` (lines 44–51) reads
localStorage and returns the stored data as-is, without calling `runMigrations`. If a user has
data stored at schema_version 1 and the code ships a version 2 migration, the component receives
v1-shaped data but the TypeScript type says v2. Downstream code accessing a new field gets
`undefined` with no error.

**Why it happens:** The migration call only exists in the server code path in `App.tsx` (lines
66–70). The local path falls through to a raw `Promise.resolve` with the stored payload.

**Consequences:** Silent data corruption that is hard to diagnose. The component renders stale or
malformed state. A PUT call made after that render would write back v1 data under a v2
`schema_version` header, which is a lie — the backend would then store bad data permanently if
the user ever switches to server mode.

**Prevention (safe fix):**
Apply `runMigrations` inside `localApi.getModule` before returning, mirroring the server path
exactly:

```typescript
// api.local.ts — getModule, after JSON.parse
const stored = JSON.parse(raw) as { schema_version: number; data: T; updated_at: string };
const migratedData =
  stored.schema_version < mod.schemaVersion
    ? runMigrations<T>(stored.data, stored.schema_version, mod.schemaVersion, mod.migrations)
    : (stored.data as T);
// Also write the migrated data back so next load is already at current version
if (stored.schema_version < mod.schemaVersion) {
  localStorage.setItem(KEY(id), JSON.stringify({
    schema_version: mod.schemaVersion,
    data: migratedData,
    updated_at: stored.updated_at,
  }));
}
return Promise.resolve({
  module_id: id,
  schema_version: mod.schemaVersion,
  data: migratedData,
  updated_at: stored.updated_at,
});
```

Writing the migrated data back immediately (same as the backend does in `routers/modules.py`
lines 60–65) ensures the migration runs exactly once, not on every load.

**Detection:** Any test that writes a v1 blob to localStorage and then calls `getModule` would
catch this. Currently there are zero tests.

---

### Pitfall 2: Import always writes to localStorage in server mode

**What goes wrong:** `App.tsx` line 29 calls `localApi.importAll(dump)` directly, bypassing the
`api` abstraction entirely. When `VITE_STORAGE` is not set (server mode), `api` points to the
HTTP client, but import writes to localStorage instead. The user sees no error, believes the
import succeeded, and the server database is never updated.

**Why it happens:** Export/import was originally only implemented for local mode. When the server
path was built, the import function was never wired through `api`. The `isLocal` flag is checked
elsewhere in `App.tsx` but not in the import handler.

**Consequences:** In server mode, import data goes to a localStorage store that the server API
never reads. The user's server-side data is unchanged. If they then navigate a module, the server
data (which may be empty or older) overwrites the local state on the next `loadModule` call.
Result: silently discarded import.

**Prevention:** The correct fix requires the backend to expose `POST /api/import` first. Once it
does, the import handler must gate on `isLocal`:

```typescript
// In App.tsx importJSON handler:
if (isLocal) {
  localApi.importAll(dump);
} else {
  await api.importAll(dump); // calls POST /api/import
}
```

Until the backend endpoint exists, the import button should be hidden or disabled in server mode
with a visible explanation, rather than silently writing to the wrong store.

---

### Pitfall 3: Backend migration runs inline on GET with no rollback guard

**What goes wrong:** In `backend/app/routers/modules.py` lines 59–65, when the stored
`schema_version` is older than the spec, the migration runs synchronously and the result is
committed in the same request. If the migration function raises an unhandled exception, FastAPI
returns HTTP 500 and the record is left partially modified in the SQLite/Postgres session (though
SQLModel's session context should rollback automatically in most cases, this is not explicit).

**Why it happens:** The migration was written inline for simplicity without separating the
read-and-migrate step from the write step. There is no try/except around the `spec.migrate()`
call.

**Consequences:**
- HTTP 500 on every subsequent GET until the bad migration is fixed and deployed.
- No way for the user to recover their data from the UI.
- If autocommit is ever enabled or the session handling changes, partial writes could persist.

**Prevention:**

```python
# Wrap the migration in its own try block before touching the record
try:
    migrated = spec.migrate(data, record.schema_version)
except Exception as exc:
    # Log but return the original data — do not attempt to write
    logger.error("Migration failed for module %s: %s", module_id, exc)
    return ModuleDataResponse(
        module_id=module_id,
        schema_version=record.schema_version,
        data=record.data,
        updated_at=record.updated_at,
    )
# Only write back if migration succeeded
record.schema_version = spec.schema_version
record.data = migrated
...
session.commit()
```

This degrades gracefully: the user gets their old data and can continue working. The migration
failure surfaces in logs where it can be diagnosed and redeployed without data loss.

A secondary safeguard: migration functions should be pure and tested in isolation (even a simple
unit test per migration function eliminates this class of risk entirely).

---

### Pitfall 4: Math.random() IDs — collision risk and predictability

**What goes wrong:** The `uid()` helper in several modules uses
`Math.random().toString(36).slice(2, 10)` producing ~41 bits of entropy (8 base-36 chars). This
is used as the primary key for beliefs, goals, obstacles, and check-in entries — identifiers that
are stored in cross-module refs and snapshots.

**Collision probability:** With 41 bits and a birthday problem calculation, the 50% collision
threshold is around 1.5 million items. For a single-user personal tool, raw collision in normal
use is unlikely, but the deeper risk is different:

1. **Math.random is not cryptographically random.** In some browser/engine combinations,
   sequences can be reproduced given initial seed knowledge. For a private mental health tool,
   predictable IDs are a minor but real privacy concern (an observer could predict future item IDs
   if they can observe current ones).
2. **Cross-module refs and snapshot integrity.** If a collision does occur between two items
   (e.g., two beliefs both get ID "k7x2q9r1"), cross-module refs become ambiguous. The
   `{moduleId, id}` ref type does not protect against this — both items share the same module.
3. **Import from HTML-v1.** The reference HTML also used Math.random-style IDs. If an imported
   export happens to collide with an existing item, the newer item silently overwrites the ref
   target with no warning.

**Mitigation:** Replace `uid()` with `crypto.randomUUID()` everywhere. It is available in all
modern browsers in secure contexts (HTTPS or localhost) and produces RFC 4122 v4 UUIDs with
122 bits of cryptographic entropy. This is a zero-effort one-line change per call site:

```typescript
// Before
const uid = () => Math.random().toString(36).slice(2, 10);

// After
const uid = () => crypto.randomUUID();
```

**One constraint:** `crypto.randomUUID()` requires a secure context. The offline single-file
HTML build served via `file://` is technically not a secure context in all browsers. Test
`file://` delivery before removing the fallback. A safe guard:

```typescript
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
```

The fallback can be removed once `file://` delivery is validated or dropped.

---

## Offline/Online Mode Pitfalls

### Pitfall 1: Silent mode divergence (the core structural risk)

The dual-mode architecture (`VITE_STORAGE=local` vs server) means two completely separate
storage backends can accumulate different states independently. Currently there is no sync,
merge, or conflict detection between them.

**Scenarios that cause data loss:**
- User works in local mode for weeks, then deploys the backend and switches to server mode.
  The server database is empty. All local work appears gone (it is still in localStorage but
  invisible to the server-mode app).
- User imports a JSON file in server mode (current bug: writes to localStorage, not server).
  Next navigation reloads from server, discarding the import.
- User has both a local build and a server build open in different tabs or devices. Changes in
  one are invisible to the other with no indication of conflict.

**Mitigation for this project (v1 scope):** The tool is single-user, single-device. The right
answer is not to build sync — it is to make the mode visible and to protect transitions:

1. Show a persistent mode indicator in the UI ("Offline-Modus" / "Server-Modus") so the user
   always knows which store they are writing to.
2. On first load in server mode, detect if localStorage contains data with a newer `updated_at`
   than any server record, and offer a one-time migration prompt.
3. Disable the import button in server mode until `POST /api/import` exists.

---

### Pitfall 2: localStorage storage limit (5 MB typical)

All module data is stored as JSON strings in localStorage, which is typically limited to 5 MB
per origin. For Kompass, current modules (values, beliefs, goals, etc.) are small, but the
check-in module accumulates weekly entries indefinitely. 200 weekly entries with PHQ-9 + GAD-7
scores plus free-text fields could approach 100–200 KB. Snapshots stored in localStorage would
multiply this further.

**Mitigation:** Do not store snapshots in localStorage. Snapshots belong in the backend database
only. For the local-mode offline build, snapshots are out of scope — the single-file build is
a "no backend" mode and historical versioning requires persistence. Document this constraint
explicitly.

---

### Pitfall 3: iOS/Safari localStorage eviction

Safari may evict localStorage data if the site has not been visited in 7 days (ITP — Intelligent
Tracking Prevention). For a personal reflection tool used weekly, this is a real risk in local
mode.

**Mitigation:**
- On each app load in local mode, export a silent JSON backup to a dated key in IndexedDB
  (which is not subject to the same eviction policy) or prompt the user to download a backup.
- Document this risk in the UI with a "Daten sichern" reminder, especially in the offline HTML
  build.

---

### Pitfall 4: Checkin module data loss on mode switch

The `checkin` module has no backend counterpart. In server mode it returns HTTP 404. The
frontend silently falls back to `defaultData()` (empty entries). Any check-in entries written in
local mode are invisible in server mode, and any new entries written in server mode to an empty
default are never persisted (the PUT call fails with 404).

**This is not just a missing feature — it is a silent data sink.** The user fills out a PHQ-9
entry, presses save, gets no error, but nothing is stored.

**Mitigation:** Implement `backend/app/modules/checkin.py` before any milestone that ships the
server mode as usable. Until then, hide the checkin module in server mode with a visible message
rather than allowing silently lost writes.

---

## Snapshot Schema Evolution Problem

### The core tension

A snapshot is "all module data at a point in time." When a module's schema evolves after a
snapshot was taken, you face a version mismatch: the snapshot blob was written at schema_version
1, but the current code expects schema_version 2.

**If you run migrations on read:** The snapshot no longer represents the original state — it
represents what the original state would look like if migrated. For a reflection tool, this
matters: a belief statement that was restructured in v2 may show differently than the user
actually wrote it.

**If you do not run migrations on read:** The snapshot viewer must handle arbitrary old schema
shapes, which means every display component needs a version-aware rendering path.

### How this is solved in comparable systems

Apache Iceberg and similar data lake systems treat snapshots as strictly immutable — the stored
bytes never change, and reading old snapshots uses the schema that was current when the snapshot
was taken. This is possible because Iceberg stores the schema alongside each snapshot.

The event sourcing pattern's standard answer is "upcasting at read time": events are stored
immutably, and migration logic runs when the event is replayed. The snapshot's `schema_version`
is used to select the right upcast chain.

### Recommended approach for Kompass

Store the `schema_version` for each module within the snapshot blob (this is already how
`ModuleRecord` works — `schema_version` is a first-class field). The snapshot table stores the
full JSON of all modules including their individual `schema_version` values.

On read, for each module's data in the snapshot, run `runMigrations` up to the current version
before displaying it. This is the same upcasting approach the live GET endpoint already uses.

```python
# Snapshot retrieval (pseudocode)
for module_id, blob in snapshot.data.items():
    spec = get_module(module_id)
    if spec and blob["schema_version"] < spec.schema_version:
        blob["data"] = spec.migrate(blob["data"], blob["schema_version"])
        blob["schema_version"] = spec.schema_version
```

**Key constraint:** Migration functions must be kept in the codebase even after the schema has
moved beyond them. A snapshot from 18 months ago may need to be migrated through v1 -> v2 -> v3.
Never delete old migration steps. This is already the design intent (the `migrations` dict is
keyed by target version) — document it explicitly as a permanent constraint.

**One failure mode to prevent:** If a module is removed from the registry entirely, snapshots
containing that module's data become partially unreadable. The snapshot reader should tolerate
unknown module IDs gracefully (skip, display "module no longer available") rather than raising.

---

## ID Generation Risk

### Current state

Four modules use `Math.random().toString(36).slice(2, 10)` for item IDs. See the analysis in
"Data Integrity Risks, Pitfall 4" above for the full breakdown.

### Summary

| Property | Math.random() uid() | crypto.randomUUID() |
|----------|--------------------|--------------------|
| Entropy | ~41 bits | 122 bits |
| Cryptographically secure | No | Yes |
| Collision at 1M items | ~1-in-1000 chance | Negligible |
| Browser support | Universal | All modern browsers (secure context) |
| Works on file:// | Yes | Usually yes, varies by browser |
| Migration effort | Trivial (one-liner) | Trivial (one-liner) |

**Recommendation:** Replace unconditionally. Test the offline HTML build (`file://`) once before
removing the Math.random fallback.

---

## Common Mistakes in This Domain

### Mistake 1: Treating migration functions as temporary code

Migration functions are often written with the assumption they can be deleted once "everyone has
upgraded." For a personal single-user tool with no forced update mechanism, the user may open
the app after 6 months of inactivity with a localStorage blob from v1 while the code is at v4.
All intermediate migrations must be present and correct for the chain to work.

**Rule:** Never delete a migration function from the dict. Mark it with a comment indicating when
it was added (e.g., `# Added 2026-04-21: added intentions field`), but do not remove it.

---

### Mistake 2: Conflating "module deleted from registry" with "module data deleted"

If a module is removed from the frontend registry, `localApi.getModule` will reject with
"Unknown module." Any stored data for that module in localStorage becomes stranded — it sits
there but is inaccessible and will be silently skipped by `exportAll`. If a snapshot references
that module, the snapshot viewer will fail.

**Rule:** Retiring a module means marking it `kind: "special"` or `enabled: false` (add such a
flag) before full removal. Never remove a module ID that has any stored user data.

---

### Mistake 3: PUT without validation round-trip in local mode

The server PUT endpoint validates the payload through Pydantic (`spec.validate(payload)` in
`routers/modules.py` line 97). The local `putModule` writes directly to localStorage with no
validation. A component bug that writes a malformed object would be caught in server mode
(HTTP 422) but silently succeed in local mode, corrupting stored data.

**Mitigation:** Consider adding a lightweight validation call in `localApi.putModule` — at
minimum a JSON roundtrip to catch non-serializable values, ideally running the same Zod/schema
check used at the component level.

---

### Mistake 4: Error boundary gap means one bad module crashes everything

React does not automatically catch errors thrown during rendering. Without an error boundary
around the module component tree, a single module with a bad migration result or null-deref
crash will unmount the entire app, showing a blank page with no recovery path.

**Rule:** Wrap every module render in an error boundary with a fallback that shows the module
name and a "Daten zurücksetzen" option. The module data corruption case (bad migration output)
is the most likely trigger, and it must not be unrecoverable.

---

### Mistake 5: vite-plugin-singlefile version drift

`vite-plugin-singlefile` is listed in `package.json` with `^2.0.2` (caret = accepts minor
updates). The plugin has had breaking changes at major version boundaries (v0 -> v1: Node 18+
required; v1 -> v2: Vite 5.1+ required, `assetsInlineLimit` behavior changed). A `npm update`
could pull in v2.x with behavior changes or silently break asset inlining.

**Known edge cases from the changelog:**
- Worker code inlining is unreliable (null-check workarounds added).
- `base` option misconfiguration causes bundling failures.
- Vite 5.3 broke preload marker removal (fixed in v2.0.2, then again in v2.0.3).

**Mitigation:**
- Pin to an exact version: `"vite-plugin-singlefile": "2.2.1"` (current as of 2026-04-21).
- After any Vite or Node upgrade, explicitly test the `npm run build:local` output by opening
  the generated HTML file directly from `file://` in both Chrome and Firefox/Safari.
- Do not use dynamic imports or Web Workers inside the offline build — these are the documented
  inlining failure modes.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| localApi migration fix | Write-back must be atomic — partial write on migration leaves inconsistent state | Compute migrated data fully before writing; use a single `setItem` call |
| Checkin backend | Missing module in server mode is a silent data sink, not just a 404 | Guard PUT calls in the component; show explicit error if module is unavailable in current mode |
| Snapshot system | Snapshot schema_version must be stored per-module, not globally | Store `{schema_version, data}` per module entry in snapshot blob |
| YSQ module | YSQ has ~230 items across 18 schemas — rendering the full list as a flat component will be slow | Render one schema at a time; paginate or accordion |
| Export/Import | Import in server mode currently corrupts by writing to localStorage | Block import UI in server mode until `POST /api/import` backend endpoint is live |
| Snapshot read path | Old snapshots reference modules removed from registry | Snapshot reader must skip unknown module IDs gracefully, not throw |

---

## Sources

- Codebase: `/home/spro/development/MentalHealth/frontend/src/api.local.ts`
- Codebase: `/home/spro/development/MentalHealth/backend/app/routers/modules.py`
- Codebase: `/home/spro/development/MentalHealth/frontend/src/App.tsx`
- Codebase: `/home/spro/development/MentalHealth/.planning/codebase/CONCERNS.md`
- [RxDB: Downsides of Offline-First](https://rxdb.info/downsides-of-offline-first.html) — storage eviction, sync conflicts
- [vite-plugin-singlefile CHANGELOG](https://github.com/richardtallent/vite-plugin-singlefile/blob/main/CHANGELOG.md) — breaking changes history
- [Event Sourcing Snapshotting — Domain Centric](https://domaincentric.net/blog/event-sourcing-snapshotting) — schema versioning at read time
- [crypto.randomUUID vs Math.random — OpenReplay](https://blog.openreplay.com/generate-unique-ids-web-crypto-api/) — entropy comparison
- [GitLab MR replacing Math.random with crypto.randomUUID](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/88464) — real-world precedent
