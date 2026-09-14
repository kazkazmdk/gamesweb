import { GuestMergeSchema } from "@gamesweb/database";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  if (!identity.userId) return jsonError("UNAUTHORIZED", "Sign in before merging guest progress.", 401);
  const limited = await rateLimit(`merge:${identityKey(identity)}:${clientIp(req)}`, policies.merge);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many merge attempts.", 429);

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = GuestMergeSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "merge" });
    return jsonError("INVALID_PAYLOAD", "Invalid merge payload.", 400);
  }

  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);

  const key = body.data.idempotencyKey ?? `merge:${body.data.anonymousId}:${identity.userId}`;
  const cached = await backend.getIdempotency(key);
  if (cached) return jsonOk(cached.response, { status: cached.status });

  const result = await backend.mergeGuest(identity, body.data.anonymousId, body.data.snapshot);
  if ("error" in result) {
    slog("merge_failure", { reason: result.error });
    return jsonError("MERGE_FAILURE", "Guest merge failed.", 409);
  }
  const payload = {
    ok: true,
    alreadyMerged: result.alreadyMerged,
    xp: result.profile.xp,
    achievements: result.profile.achievements,
  };
  await backend.putIdempotency(key, 200, payload);
  return jsonOk(payload);
}
