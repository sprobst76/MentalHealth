# Phase 1: Correctness & Build — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 01-correctness-build
**Areas discussed:** Error state visual, Vite 7 upgrade path, Token enforcement (QUAL-05)

---

## Error State Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal text note | "Fehler in diesem Modul. Seite neu laden um fortzufahren." — two lines, no Card, no button | ✓ |
| Card with retry button | Styled Card with terracotta border and "Modul neu laden" reset button | |

**User's choice:** Minimal text note

---

| Option | Description | Selected |
|--------|-------------|----------|
| Clean only, no raw error | No error.message shown — DevTools is the debug path | ✓ |
| Show error in small type below | Append error.message in muted font for quick triage | |

**User's choice:** Clean only, no raw error
**Notes:** Fits the reflective, editorial tone of the app.

---

## Vite 7 Upgrade Path

| Option | Description | Selected |
|--------|-------------|----------|
| Direct 5 → 7 | One migration pass, less work | ✓ |
| Step through Vite 6 first | Safer but doubles config changes and testing rounds | |

**User's choice:** Direct 5 → 7

---

| Option | Description | Selected |
|--------|-------------|----------|
| Build completes + Chrome check | Safari is nice-to-have, not a phase blocker | ✓ |
| Both Chrome and Safari required | Full verification per original requirement wording | |

**User's choice:** Build completes + manual Chrome file:// check
**Notes:** Relaxed "verified" definition — Safari remains a nice-to-have.

---

## Token Enforcement (QUAL-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Startup warning only | Python logging.warning if default token used; app still starts | ✓ |
| Reject in non-localhost contexts | Refuse to start with default token outside localhost | |

**User's choice:** Startup warning only for default "change-me-please" token

---

| Option | Description | Selected |
|--------|-------------|----------|
| Hard reject at startup | Pydantic validator raises ValueError for empty token; app won't start | ✓ |
| Warn and allow (current behavior) | Keep existing empty-token = no-auth behavior with a warning | |

**User's choice:** Hard reject at startup for empty KOMPASS_TOKEN

---

## Claude's Discretion

- Exact location of shared `uid()` utility (natural home: `frontend/src/lib/uid.ts`)
- Whether error boundary is an inline class or extracted component
- Python logging format for migration failures and token warnings

## Deferred Ideas

None.
