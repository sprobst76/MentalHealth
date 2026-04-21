/**
 * Generates a unique ID using crypto.randomUUID() where available (Secure Context),
 * falling back to Math.random() for file:// contexts where Secure Context may be absent.
 *
 * crypto.randomUUID() requires Secure Context (HTTPS or localhost).
 * file:// is not a Secure Context in Firefox/Safari — keep the Math.random fallback.
 */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
