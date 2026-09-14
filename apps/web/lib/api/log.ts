const SECRET = /service_role|secret|apikey|authorization|cookie|token|password/i;

export function slog(
  event:
    | "rate_limit_triggered"
    | "score_flagged"
    | "auth_failure"
    | "merge_failure"
    | "invalid_payload"
    | "suspicious_run"
    | "api_error"
    | "not_configured",
  fields: Record<string, string | number | boolean | null | undefined> = {},
) {
  const safe: Record<string, string | number | boolean | null> = { event };
  for (const [k, v] of Object.entries(fields)) {
    if (SECRET.test(k)) continue;
    if (typeof v === "string" && v.length > 180) {
      safe[k] = v.slice(0, 180);
      continue;
    }
    if (v === undefined) continue;
    safe[k] = v;
  }
  console.info(JSON.stringify(safe));
}
