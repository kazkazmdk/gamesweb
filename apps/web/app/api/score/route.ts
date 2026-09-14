import { assertMode, SubmitScoreSchema, validateScore } from "@gamesweb/database";
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
  const limited = await rateLimit(`score:${identityKey(identity)}:${clientIp(req)}`, policies.score);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many score submissions.", 429);

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = SubmitScoreSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "score" });
    return jsonError("INVALID_PAYLOAD", "Invalid score payload.", 400);
  }
  if (!assertMode(body.data.gameId, body.data.mode)) {
    return jsonError("INVALID_PAYLOAD", "Unknown mode for this game.", 400);
  }

  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);

  const idem = body.data.idempotencyKey ?? `score:${body.data.sessionId}`;
  const cached = await backend.getIdempotency(idem);
  if (cached) return jsonOk(cached.response, { status: cached.status });

  let session = await backend.getSession(body.data.sessionId);
  if (!session && body.data.offline) {
    session = await backend.startSession({
      identity,
      gameId: body.data.gameId,
      gameVersion: body.data.gameVersion,
      device: "desktop",
    });
  }
  if (!session) return jsonError("SESSION_MISSING", "Unknown game session.", 404);
  if (session.endedAt) return jsonError("SESSION_CLOSED", "Session already closed.", 409);
  if (session.gameId !== body.data.gameId) return jsonError("INVALID_SCORE", "Session game mismatch.", 400);
  if (session.gameVersion !== body.data.gameVersion) {
    slog("suspicious_run", { reason: "version_mismatch", gameId: body.data.gameId });
  }
  if (session.userId && identity.userId && session.userId !== identity.userId) {
    return jsonError("FORBIDDEN", "Session belongs to another player.", 403);
  }

  const serverDuration = Math.max(0, Date.now() - session.startedAt);
  const durationSkew = Math.abs(serverDuration - body.data.durationMs);
  const check = validateScore({
    sessionId: session.id,
    gameId: body.data.gameId,
    gameVersion: body.data.gameVersion,
    mode: body.data.mode,
    score: body.data.score,
    durationMs: body.data.durationMs,
    startedAt: body.data.startedAt,
    endedAt: body.data.endedAt,
    metadata: body.data.metadata,
    offline: body.data.offline,
  });
  if (durationSkew > 20_000 && !body.data.offline) check.reasons.push("server_duration_skew");
  if (check.reasons.includes("server_duration_skew") && check.status === "verified") {
    check.status = "unverified";
  }

  if (check.status === "flagged") slog("score_flagged", { gameId: body.data.gameId, reasons: check.reasons.length });

  const result = await backend.submitScore({
    identity,
    session,
    mode: body.data.mode,
    score: body.data.score,
    durationMs: body.data.durationMs,
    metadata: body.data.metadata,
    verified: check.status,
    offline: body.data.offline,
  });

  const payload = {
    verification: check,
    alreadyApplied: result.alreadyApplied,
    progressionDiff: result.progression,
    scoreId: result.score.id,
  };
  await backend.putIdempotency(idem, 200, payload);
  return jsonOk(payload);
}
