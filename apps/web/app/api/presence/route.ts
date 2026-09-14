import { PresenceSchema } from "@gamesweb/database";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";

export async function GET() {
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const identity = await getIdentity();
  const rows = await backend.listPresence(identity);
  return jsonOk({ rows }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  const limited = await rateLimit(`presence:${identityKey(identity)}:${clientIp(req)}`, policies.presence);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many presence updates.", 429);
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = PresenceSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "presence" });
    return jsonError("INVALID_PAYLOAD", "Invalid presence payload.", 400);
  }
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  await backend.upsertPresence(identity, body.data.status, body.data.gameId ?? null);
  return jsonOk({ ok: true });
}
