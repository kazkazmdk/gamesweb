import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";
import { listInbox, markInboxRead } from "@/lib/backend/social-arcade";

export async function GET(req: Request) {
  const identity = await getIdentity();
  const limited = await rateLimit(`inbox:${identityKey(identity)}:${clientIp(req)}`, policies.inbox);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many inbox reads.", 429);
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  return jsonOk({ items: await listInbox(identity), persistence: "server", guest: !identity.userId });
}

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as { id?: string };
  if (!body.id) return jsonError("INVALID_PAYLOAD", "Missing id.", 400);
  const identity = await getIdentity();
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const item = await markInboxRead(identity, body.id);
  if (!item) return jsonError("NOT_FOUND", "Inbox item not found.", 404);
  return jsonOk({ item });
}
