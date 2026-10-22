import { jsonError, jsonOk } from "@/lib/api/errors";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";
import { listRivals } from "@/lib/backend/social-arcade";

export async function GET(req: Request) {
  const identity = await getIdentity();
  const limited = await rateLimit(`rivals:${identityKey(identity)}:${clientIp(req)}`, policies.inbox);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many rival reads.", 429);
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  return jsonOk({ rows: await listRivals(identity), persistence: "server" });
}
