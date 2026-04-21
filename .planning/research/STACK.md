# Stack Research

**Project:** Kompass (personal reflection tool)
**Researched:** 2026-04-21
**Mode:** Brownfield — continuing development, not greenfield

---

## Current Stack Assessment

The existing stack is in good shape but several components are multiple major versions behind.
The most pressing version gaps are Vite (5 vs current 8) and SQLModel (0.0.22 vs current 0.0.38).
React 18 is still a reasonable choice. FastAPI has drifted from 0.115 to 0.135.1 but without
breaking changes that affect this project.

### Component-by-Component Status

| Component | Pinned Version | Current (Apr 2026) | Gap | Risk |
|-----------|---------------|-------------------|-----|------|
| FastAPI | >=0.115 | 0.135.1 | minor drift | LOW — no breaking changes in this range |
| SQLModel | >=0.0.22 | 0.0.38 | significant | MEDIUM — Pydantic v1 dropped at 0.0.31, Annotated fix at 0.0.32 |
| Pydantic | >=2.8 | 2.x current | minor | LOW — already on v2, no v1 compat concerns |
| Alembic | >=1.13 | 1.18.4 | minor | LOW — SQLAlchemy 2.0 support stable |
| Vite | 5.3 | 8.0.8 | 3 major versions | HIGH — significant toolchain changes across v6/v7/v8 |
| @vitejs/plugin-react | 4.3 | 6.x (ships with Vite 8) | major | HIGH — v6 drops Babel entirely, uses Oxc |
| vite-plugin-singlefile | 2.0 | 2.3.2 | minor | LOW — 2.2.1 added Vite 7 support; check Vite 8 compat |
| React | 18.3 | 19.x | 1 major | LOW-MEDIUM — React 19 is backward-compatible; not urgent |
| Tailwind CSS | 3.4 | 4.x | 1 major | MEDIUM — config format changed entirely (JS → CSS @theme) |
| TypeScript | 5.5 | 5.8 | minor | LOW — no breaking changes relevant here |
| Node | 20 | 22 LTS | 1 major | LOW — Node 20 still under LTS until April 2026 |
| Python | 3.12 | 3.13 current | minor | LOW — 3.12 fully supported |

**Confidence:** MEDIUM — version numbers from PyPI/npm release pages and Vite official site.
SQLModel release history confirmed from GitHub releases page (latest: 0.0.38, April 2 2025).
Vite version confirmed from vite.dev/releases (8.0.8 current stable).

---

## Recommended Updates / Versions

### Priority 1 — Do Now (active bugs or important fixes)

**SQLModel: pin to >=0.0.32**

The current pin (`>=0.0.22`) allows installing versions with known issues. Two changes matter:
- 0.0.31 (Dec 2024): dropped Pydantic v1 support — the project is already Pydantic v2-only,
  so this is not a risk, but it makes the lower bound misleading.
- 0.0.32 (Feb 2025): fixed support for `Annotated` fields with Pydantic 2.12+. Without this,
  type annotations on model fields can break silently.

Recommendation: change `backend/pyproject.toml` to `sqlmodel>=0.0.32`.

**vite-plugin-singlefile: pin to >=2.2.1**

The current pin (2.0) predates the Vite 6 compatibility fix. Version 2.2.1 adds Vite 7 support.
Version 2.3.2 is current. The offline HTML build is a load-bearing feature for this project —
keeping this plugin current is important.

Recommendation: update `frontend/package.json` to `"vite-plugin-singlefile": "^2.3.2"`.

### Priority 2 — Do When Convenient

**FastAPI: update to >=0.130**

No breaking changes between 0.115 and 0.135.1 that affect this project. The update is safe
and picks up minor fixes. Python 3.9 support was dropped at 0.130 — irrelevant here (project
targets 3.12).

**Alembic: update to >=1.16**

Currently at >=1.13; latest is 1.18.4. No breaking changes. SQLAlchemy 2.0 async support is
stable. Update the lower bound in pyproject.toml.

### Priority 3 — Evaluate, Do Not Rush

**React 18 → 19**

React 19 (released Dec 2024) is backward-compatible. Key additions: `useActionState`,
`useFormStatus`, `useOptimistic`, and automatic memoization via the React Compiler. For
Kompass specifically, none of the new hooks are immediately useful — the app has minimal form
interactions and no concurrent data fetching. The upgrade is low-risk but the payoff is also
low. **Do it if a module already needs React 19 features; otherwise defer to next major feature.**

**Vite 5 → 8**

This is a 3-major-version jump with real toolchain changes:
- Vite 6: added Environment API, new config format options
- Vite 7: Rolldown-based dependency optimizer (not esbuild)
- Vite 8: @vitejs/plugin-react v6 ships with Vite 8, drops Babel in favor of Oxc for JSX transform

The Babel drop in plugin-react v6 is the key risk: if `vite.config.ts` uses `react({ babel: {...} })`
options, they will break. Kompass's current config is a plain `react()` call with no Babel plugins,
so the migration is likely clean. However, `vite-plugin-singlefile` must be verified against Vite 8
before upgrading (only Vite 7 compat is confirmed for 2.2.1).

**Recommendation:** upgrade Vite to 7 now (not 8 yet), confirm vite-plugin-singlefile compatibility,
then evaluate Vite 8 in a separate step.

**Tailwind CSS 3 → 4**

Tailwind v4 is a significant migration:
- `tailwind.config.js` is replaced by CSS-native `@theme` directives in the CSS file
- `@tailwind base/components/utilities` directives replaced by a single `@import`
- Several utility classes renamed (`bg-gradient-to-*` → `bg-linear-to-*`, etc.)
- Default border color changed from `currentColor` to `--color-gray-200`
- The automated upgrade tool handles most of this

For Kompass, the custom CSS variables (`--paper`, `--ink`, `--accent`, etc.) are in
`frontend/src/styles/index.css` and are already written as native CSS custom properties —
they will survive the migration intact. The `tailwind.config.js` config is minimal.

**Risk is MEDIUM** — the automated tool should handle most of it but must be verified.
**Defer until Vite upgrade is done** (Tailwind v4 also changed its Vite plugin).

---

## Dual-Mode SPA Patterns

### Current Implementation

Kompass uses a build-flag-based dual mode:
- `VITE_STORAGE=local` → `vite-plugin-singlefile` bundles to a self-contained HTML with
  localStorage as the data store (`localApi` in `api.ts`)
- Default build → React SPA served by a static host, calling FastAPI backend (`serverApi`)

This pattern is sound and well-suited for a single-user personal tool. The architectural
split at the `api.ts` adapter layer is correct.

### Known Issue (from PROJECT.md)

`localApi.getModule` does not call `runMigrations`. This means schema upgrades silently
produce stale data in offline mode. This is the most important functional bug in the current
dual-mode implementation.

**Fix:** `runMigrations` must be called in `localApi.getModule` the same way it is in the
server path. This is a one-line call — the machinery already exists.

### 2025/2026 Pattern Landscape

**localStorage remains appropriate for this use case.** The alternatives — IndexedDB, service
workers, RxDB — add significant complexity for marginal benefit on a single-user personal tool
with small JSON payloads (a few KB total). The LogRocket 2025 survey of offline-first patterns
confirms that localStorage is recommended for simple key-value structured data under ~5 MB with
no query/indexing requirements, which exactly describes Kompass module data.

**IndexedDB would be warranted if:** payloads grow to hundreds of records, structured queries
are needed, or multi-tab sync becomes a requirement. None of these apply to v1.

**Service workers are not needed** for the offline HTML build (the file is already fully
self-contained). For the server-backed mode, a service worker could cache the app shell for
offline access, but this is an enhancement, not a correctness fix.

**The `useSyncExternalStore` hook** (React 18+) is the idiomatic way to sync React state
with localStorage. The current `api.ts` imperative approach works but if the app ever needs
reactive cross-tab updates, `useSyncExternalStore` is the migration target.

### Dual-Mode Import Bug (from PROJECT.md)

`App.tsx` import always calls `localApi.importAll` regardless of active storage mode. Fix:
route to `serverApi.importAll` when in server mode. This is a correctness bug, not a design
question.

---

## What NOT to Change and Why

**Python / FastAPI stack: do not change frameworks**

The project constraints explicitly prohibit framework changes without discussion. FastAPI +
SQLModel + Alembic is a coherent, actively maintained stack. SQLModel 0.0.38 still uses the
same API surface as 0.0.22 — migrations are version bumps, not rewrites.

**React + Vite + TypeScript: do not change**

There is no React alternative that offers a better tradeoff for this project size. The strict
TypeScript config (`noUnusedLocals`, `noUnusedParameters`) is an asset — it will catch drift
as the codebase grows.

**No state management framework in v1**

The `useState + api.ts` pattern is explicitly called out in CLAUDE.md and PROJECT.md as
sufficient for v1, and that assessment is correct. React Query would be the sensible addition
if the app develops more concurrent data fetching (e.g., snapshot comparison, cross-module
analytics), but that is not a current requirement. Adding Zustand or Redux for the current
feature set would be pure overhead.

**No IndexedDB migration**

The data model is a small number of JSON blobs (one per module). Total data volume is under
50 KB. The storage constraints of localStorage (5 MB per origin) are not a concern. Migrating
to IndexedDB would require rewriting `api.ts`, all migration logic, and the import/export
system for no observable benefit to the user.

**Tailwind CSS: do not migrate to v4 before Vite is upgraded**

Tailwind v4 changed its Vite integration. Attempting the Tailwind upgrade on Vite 5 adds
unnecessary complexity. The correct sequence: Vite 7 first, then Tailwind 4.

**vite-plugin-singlefile: do not replace with custom bundler logic**

The offline HTML build is load-bearing for the use case. The plugin is actively maintained
(2.3.2 current, monthly releases). Building a custom inliner would introduce fragility in the
most important distribution artifact.

---

## Sources

- SQLModel releases: https://github.com/fastapi/sqlmodel/releases (confirmed 0.0.38, April 2025)
- Vite releases: https://vite.dev/releases (confirmed 8.0.8 current)
- Vite 8 announcement: https://vite.dev/blog/announcing-vite8
- vite-plugin-singlefile npm: https://www.npmjs.com/package/vite-plugin-singlefile (2.3.2 current)
- vite-plugin-singlefile Vite 6 issue: https://github.com/richardtallent/vite-plugin-singlefile/issues/104
- Alembic changelog: https://alembic.sqlalchemy.org/en/latest/changelog.html (1.18.4 current)
- React 19 release: https://react.dev/blog/2024/12/05/react-19
- Tailwind v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Offline-first 2025 LogRocket: https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/
- FastAPI release notes: https://fastapi.tiangolo.com/release-notes/
