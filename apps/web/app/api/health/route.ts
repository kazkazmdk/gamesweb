import { jsonError, jsonOk } from "@/lib/api/errors";
import { publicEnvFlags, resolveBackend } from "@/lib/env";

export async function GET() {
  const backend = resolveBackend();
  if (backend === "none") return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  return jsonOk({ ...publicEnvFlags(), backend });
}
