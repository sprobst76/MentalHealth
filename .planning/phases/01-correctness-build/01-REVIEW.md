---
phase: 01-correctness-build
reviewed: 2026-04-21T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - backend/tests/conftest.py
  - backend/tests/test_config.py
  - backend/tests/test_modules.py
  - backend/app/config.py
  - backend/app/main.py
  - backend/app/routers/modules.py
  - backend/pyproject.toml
  - frontend/src/lib/uid.ts
  - frontend/src/components/ErrorBoundary.tsx
  - frontend/src/api.local.ts
  - frontend/src/App.tsx
  - frontend/src/modules/beliefs_act/BeliefsActModule.tsx
  - frontend/src/modules/goals/GoalsModule.tsx
  - frontend/src/modules/obstacles/ObstaclesModule.tsx
  - frontend/src/modules/checkin/CheckinModule.tsx
  - frontend/package.json
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-21
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 1 delivers the backend test infrastructure, config hardening, lifespan warning,
migration error guard, frontend uid utility, ErrorBoundary, and localApi migration
write-back. The overall shape is clean and follows the project conventions from CLAUDE.md.

One critical issue was found: the auth bypass condition in `auth.py` inverts the intended
security check — an empty token disables auth entirely, which conflicts with the config
validator that now rejects empty tokens. Together they create a latent logic contradiction
that will allow unauthenticated access if `settings.kompass_token` is ever falsy for any
reason beyond the empty-string case.

Five warnings cover a stale-data bug in the migration error path, a missing `@pytest.mark.asyncio`
decorator, an unsafe `JSON.parse` without error handling in `api.local.ts`, an off-by-one
concern in the `daysSince` display, and a missing `type` attribute on an `<input>` in
`GoalsModule.tsx`.

---

## Critical Issues

### CR-01: Auth bypass when token is falsy — config and auth.py are logically inconsistent

**File:** `backend/app/auth.py:32`
**Issue:** `get_current_user` skips the token check when `expected` is falsy (`if expected:`).
The config validator in `config.py` already rejects the empty string at startup, so `expected`
should never be `""` in a running process — but it can still be any other falsy value (e.g.,
`None` if a future code path constructs `Settings` directly without a token field). More
importantly, the comment in the docstring says "Set KOMPASS_TOKEN to an empty string to disable
the check for local dev", which directly contradicts the new `token_must_not_be_empty` validator.
This creates a maintenance trap: a developer reading the comment will attempt the documented
workflow, get a `ValidationError` at startup, and then either work around the validator or
remove it — breaking the security contract in the other direction. The bypass path should be
removed; local dev should use the default `change-me-please` token, which is already accepted.

**Fix:**
```python
# backend/app/auth.py — remove the bypass branch entirely
def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    """Single-user auth: bearer token from KOMPASS_TOKEN env var."""
    token = _extract_token(authorization)
    if token != settings.kompass_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing bearer token.",
        )
    user = session.exec(select(User).where(User.name == SINGLE_USER_NAME)).first()
    if user is None:
        user = User(name=SINGLE_USER_NAME)
        session.add(user)
        session.commit()
        session.refresh(user)
    return user
```

Also update the docstring comment so it no longer suggests setting an empty token.

---

## Warnings

### WR-01: Migration error path returns stale `record.data`, not the in-memory `data` snapshot

**File:** `backend/app/routers/modules.py:80-86`
**Issue:** When `spec.migrate()` raises, the except block reassigns the local variable
`data = record.data`. However, at the point of the exception the `record` object may have
already been mutated in memory (lines 65–66 set `record.schema_version` and `record.data`
to partial results before the `session.commit()` that was never reached). Depending on
SQLModel's change-tracking behaviour the stale in-memory state of `record.data` could
differ from what was originally stored. The response on line 85 then uses `record.data`
rather than the `data` local variable for the `data=` field.

The two-variable dance (`data` vs `record.data`) also makes the happy path's response on
lines 82–87 inconsistent: it passes `record.data` for the `data` field even though `data`
holds the (possibly newer) migrated result. Since `session.refresh(record)` was called
on the happy path, `record.data` should be in sync — but after a failed migration where
no commit happened, `record.data` reflects any in-memory mutations made before the
exception.

**Fix:**
```python
# Snapshot original data before attempting migration
original_data = record.data
try:
    data = spec.migrate(original_data, record.schema_version)
    record.schema_version = spec.schema_version
    record.data = data
    record.updated_at = datetime.now(timezone.utc)
    session.add(record)
    session.commit()
    session.refresh(record)
except Exception as exc:
    logger.error(...)
    # Restore the session object to its pre-mutation state
    session.expunge(record)
    return ModuleDataResponse(
        module_id=module_id,
        schema_version=record.schema_version,  # still the original version
        data=original_data,
        updated_at=record.updated_at,
    )

return ModuleDataResponse(
    module_id=module_id,
    schema_version=record.schema_version,
    data=record.data,
    updated_at=record.updated_at,
)
```

### WR-02: `test_default_token_warning` is an async function without `@pytest.mark.asyncio`

**File:** `backend/tests/test_config.py:25`
**Issue:** `async def test_default_token_warning(caplog)` has no `@pytest.mark.asyncio`
decorator. With `asyncio_mode = "auto"` in `pyproject.toml` all async test functions are
run automatically without the decorator — but only when discovered by pytest's asyncio plugin.
`asyncio_mode = "auto"` requires pytest-asyncio >= 0.21 and the plugin must be active; if the
dev environment installs pytest-asyncio at exactly the `>=0.23` minimum listed in pyproject.toml
this works. However, `asyncio_mode = "auto"` is not scoped: it applies globally including to
fixtures. The `client` fixture in `conftest.py` is an `async def` fixture without a scope
marker, which is also relying on this global mode. If someone runs with `--asyncio-mode=strict`
(a common CI override) both `client` and `test_default_token_warning` will be silently skipped
rather than fail loudly, producing false-green CI. Adding explicit `@pytest.mark.asyncio` to
async test functions and `@pytest_asyncio.fixture` to async fixtures is defensive best practice.

**Fix:**
```python
# backend/tests/test_config.py
import pytest

@pytest.mark.asyncio
async def test_default_token_warning(caplog):
    ...

# backend/tests/conftest.py
import pytest_asyncio

@pytest_asyncio.fixture
async def client(test_engine):
    ...
```

Also add `pytest-asyncio` to `dev` dependencies with explicit `>=0.23`:
already present in `pyproject.toml` — no change needed there.

### WR-03: `JSON.parse` in `api.local.ts` is not guarded against corrupt localStorage data

**File:** `frontend/src/api.local.ts:46`
**Issue:** `JSON.parse(raw)` on line 46 (and line 86) is called without a try/catch.
If the localStorage entry is corrupt (truncated write, manual editing, extension
interference) this will throw an unhandled exception that propagates through `getModule`
as a rejected promise. `App.tsx` does catch the rejection and shows `state.error`, so the
UX impact is limited — but the error message will be a raw `SyntaxError` string, not
something the user can act on. The `exportAll` path on line 86 will also throw, silently
losing the rest of the export.

**Fix:**
```typescript
// api.local.ts — wrap getModule's parse
let stored: { schema_version: number; data: T; updated_at: string };
try {
  stored = JSON.parse(raw) as typeof stored;
} catch {
  // Corrupt entry — treat as missing, return default
  return Promise.resolve({
    module_id: id,
    schema_version: mod.schemaVersion,
    data: mod.defaultData() as T,
    updated_at: null,
  });
}

// exportAll — skip corrupt entries
const parsed = (() => { try { return JSON.parse(raw); } catch { return null; } })();
if (parsed) out[mod.id] = parsed;
```

### WR-04: `daysSince` display produces "0 Tagen" for a same-day check-in

**File:** `frontend/src/modules/checkin/CheckinModule.tsx:171`
**Issue:** The pluralization logic `{daysSince(latest.timestamp) === 1 ? "" : "en"}` appends
"en" for any count that is not exactly 1, including 0. A check-in made today will show
"vor 0 Tagen" which reads awkwardly. `daysSince` returning 0 should display "heute" or
"weniger als einem Tag". This is a logic error in the copy, not just a style issue.

**Fix:**
```tsx
{daysSince(latest.timestamp) === 0
  ? "heute"
  : `vor ${daysSince(latest.timestamp)} Tag${daysSince(latest.timestamp) === 1 ? "" : "en"}`}
```
Note: `daysSince` is called three times here; extract to a local variable to avoid
redundant computation:
```tsx
const days = daysSince(latest.timestamp);
// then: days === 0 ? "heute" : `vor ${days} Tag${days === 1 ? "" : "en"}`
```

### WR-05: `<input>` in `GoalsModule.tsx` is missing `type` attribute

**File:** `frontend/src/modules/goals/GoalsModule.tsx:125` and `193`
**Issue:** Two `<input>` elements (goal title on line 125, first step on line 193) omit
the `type` attribute. Without an explicit `type`, browsers default to `type="text"`, which
is the intended behaviour here — so there is no functional bug today. However, CLAUDE.md
convention explicitly calls out `type="button"` for buttons, and TypeScript's strict mode
will not catch the omission. The `<input>` in `CheckinModule.tsx` (line 303) sets
`maxLength` and is also missing `type`. If these inputs are ever placed inside a `<form>`
element in a future refactor, the missing type could cause unintended submit-on-Enter
behaviour.

**Fix:**
```tsx
<input
  type="text"
  value={g.title}
  ...
/>
```
Apply the same fix to the `first_step` input on line 193 and the note input in
`CheckinModule.tsx` line 303.

---

## Info

### IN-01: `test_default_token_warning` imports `lifespan` but does not need to

**File:** `backend/tests/test_config.py:27`
**Issue:** The comment `# noqa: F401 — ImportError is expected until Plan 02` suggests this
import is present speculatively. The import is currently used (on line 30), so the noqa
comment is slightly misleading — F401 fires for *unused* imports, not for ImportError at
import time. If `lifespan` is removed from `app.main` in a future refactor, this test will
fail with `ImportError` rather than a clear assertion failure. The comment should be updated
to explain what it is actually protecting against.

### IN-02: `ModuleState.data` typed as `any` in `App.tsx`

**File:** `frontend/src/App.tsx:39`
**Issue:** `data: any` in the `ModuleState` interface and the corresponding `handleChange`
signature (`(id: string) => (next: any) => void`) bypass TypeScript's module-level type
safety. Since `ModuleDef<T>` carries a `defaultData: () => T`, it would be possible to
type `Store` as `Record<string, ModuleState<unknown>>` with the `data` field carrying the
per-module generic. This is acknowledged as acceptable for v1 in CLAUDE.md (no state
framework), but it is worth tracking.

### IN-03: `uid()` fallback entropy is weak for non-file-protocol contexts

**File:** `frontend/src/lib/uid.ts:12`
**Issue:** The Math.random fallback produces a 16-character base-36 string (~82 bits of
entropy from two calls). This is sufficient for UI list keys but is not a UUID-format
string (no hyphens, no version field). Any code that treats the output of `uid()` as a
UUID format string (e.g., by splitting on `-` or validating against a UUID regex) will
break in the fallback path. The comment correctly documents the file:// scope, but callers
are not made aware that the format differs. Consider naming the fallback return value
differently or padding it to visually distinguish it from a real UUID.

### IN-04: `ErrorBoundary` has no recovery mechanism

**File:** `frontend/src/components/ErrorBoundary.tsx:29-31`
**Issue:** The error UI tells the user to reload the page ("Seite neu laden"), but provides
no button to do so. On mobile or in contexts where the user is not comfortable with browser
refresh, this is a dead end. Adding a `<button onClick={() => window.location.reload()}`
would be a minimal improvement. Additionally, the `key={activeId}` usage in `App.tsx`
(line 184) resets the ErrorBoundary on every module switch, which is the correct pattern —
this note is to confirm the design is intentional and correct.

---

_Reviewed: 2026-04-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
