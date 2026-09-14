import { FriendActionSchema, FriendRequestSchema, UsernameSearchSchema } from "@gamesweb/database";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";

export async function GET(req: Request) {
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const identity = await getIdentity();
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (q) {
    const limited = await rateLimit(`search:${identityKey(identity)}:${clientIp(req)}`, policies.search);
    if (!limited.ok) return jsonError("RATE_LIMITED", "Too many searches.", 429);
    const parsed = UsernameSearchSchema.safeParse({ q });
    if (!parsed.success) return jsonError("INVALID_PAYLOAD", "Query must be at least 3 characters.", 400);
    const rows = await backend.searchUsers(identity, parsed.data.q);
    return jsonOk({ rows }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const rows = await backend.listFriends(identity);
  return jsonOk({ rows }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  if (!identity.userId) return jsonError("UNAUTHORIZED", "Sign in to add friends.", 401);
  const limited = await rateLimit(`friends:${identityKey(identity)}:${clientIp(req)}`, policies.friends);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many friend actions.", 429);
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;

  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);

  const action = FriendActionSchema.safeParse(parsed.data);
  if (action.success) {
    const result = await backend.friendAction(identity, action.data.userId, action.data.action);
    if ("error" in result) return jsonError("CONFLICT", "Friend action failed.", 409);
    return jsonOk({ ok: true });
  }

  const request = FriendRequestSchema.safeParse(parsed.data);
  if (!request.success) {
    slog("invalid_payload", { endpoint: "friends" });
    return jsonError("INVALID_PAYLOAD", "Invalid friend payload.", 400);
  }
  const result = await backend.sendFriendRequest(identity, request.data.username);
  if ("error" in result) {
    const map: Record<string, [number, string]> = {
      not_found: [404, "Player not found."],
      self: [400, "You cannot friend yourself."],
      duplicate: [409, "Request already exists."],
      blocked: [403, "Cannot send this request."],
      auth_required: [401, "Sign in to add friends."],
    };
    const hit = map[result.error] ?? [400, "Friend request failed."];
    return jsonError(hit[0] === 404 ? "NOT_FOUND" : hit[0] === 401 ? "UNAUTHORIZED" : "CONFLICT", hit[1], hit[0]);
  }
  return jsonOk({ ok: true });
}
