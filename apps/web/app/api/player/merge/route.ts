import { GuestMergeSchema, idempotencyScope } from "@gamesweb/database";
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
  if (parsed.data && typeof parsed.data === "object" && ("anonymousId" in parsed.data || "snapshot" in parsed.data)) {
    slog("suspicious_run", { reason: "merge_client_identity" });
    return jsonError("FORBIDDEN", "Guest identity is bound to the server cookie.", 403);
  }
  const body = GuestMergeSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "merge" });
    return jsonError("INVALID_PAYLOAD", "Invalid merge payload.", 400);
  }

  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);

  const scope = idempotencyScope(identity);
  const key = `merge:${identity.userId}:${identity.anonymousId}`;
  const cached = await backend.getIdempotency(scope, key);
  if (cached) return jsonOk(cached.response, { status: cached.status });

  const result = await backend.mergeGuest(identity, { offlineRuns: body.data.offlineRuns });
  if ("error" in result) {
    slog("merge_failure", { reason: result.error });
    return jsonError("MERGE_FAILURE", "Guest merge failed.", 409);
  }
  const payload = {
    ok: true,
    alreadyMerged: result.alreadyMerged,
    xp: result.profile.xp,
    achievements: result.profile.achievements,
    questsCompleted: result.profile.questCompleted,
  };
  await backend.putIdempotency(scope, key, "merge", 200, payload, identity);
  return jsonOk(payload);
}
