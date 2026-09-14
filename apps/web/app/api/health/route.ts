import { jsonError, jsonOk } from "@/lib/api/errors";
import { resolveBackend } from "@/lib/env";
import { commitSha, APP_VERSION } from "@/lib/version";

export async function GET() {
  const backend = resolveBackend();
  if (backend === "none") return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  return jsonOk({
    ok: true,
    backendConfigured: true,
    persistence: backend === "supabase" ? "durable" : "ephemeral",
    commit: commitSha(),
    version: APP_VERSION,
  });
}
