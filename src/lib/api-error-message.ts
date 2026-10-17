// DRF error bodies come in several shapes - {"detail": "..."},
// {"non_field_errors": ["..."]} or field errors like
// {"candidate": ["No active AI interview configuration ..."]}. Reading only
// `detail` hid every field error behind a generic "failed" message, so
// return the first human-readable message found, or null.
export function apiErrorMessage(error: unknown): string | null {
  const first = (value: unknown): string | null => {
    if (typeof value === "string") return value.trim() || null;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = first(item);
        if (found) return found;
      }
      return null;
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of ["detail", "error", "message", "non_field_errors"]) {
        const found = first(record[key]);
        if (found) return found;
      }
      for (const nested of Object.values(record)) {
        const found = first(nested);
        if (found) return found;
      }
    }
    return null;
  };

  if (!error || typeof error !== "object") return null;
  const body = (error as { response?: { data?: unknown } }).response?.data ?? error;
  // An HTML error page (e.g. a 500) is not a message to show a user.
  if (typeof body === "string" && body.trimStart().startsWith("<")) return null;
  return first(body);
}
