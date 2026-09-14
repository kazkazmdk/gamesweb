import { assertMode, assertSessionOwnership, idempotencyScope, SubmitScoreSchema, validateScore } from "@gamesweb/database";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";
import { commitSha } from "@/lib/version";

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

  const offline = Boolean(body.data.offline || body.data.offlineSubmission);
  const scope = idempotencyScope(identity);
  const idem = body.data.idempotencyKey ?? (body.data.sessionId ? `score:${body.data.sessionId}` : `score-offline:${body.data.localSessionId ?? body.data.startedAt}`);
  const cached = await backend.getIdempotency(scope, idem);
  if (cached) {
    const cachedBody = cached.response as Record<string, unknown>;
    return jsonOk({ ...cachedBody, alreadyApplied: true }, { status: cached.status });
  }

  let session = body.data.sessionId ? await backend.getSession(body.data.sessionId) : null;
  if (!session && !offline) return jsonError("SESSION_MISSING", "Unknown game session.", 404);
  if (session) {
    if (assertSessionOwnership(session, identity) !== "ok") {
      slog("suspicious_run", { reason: "session_ownership" });
      return jsonError("FORBIDDEN", "Session belongs to another player.", 403);
    }
    if (session.endedAt) return jsonError("SESSION_CLOSED", "Session already closed.", 409);
    if (session.gameId !== body.data.gameId) return jsonError("INVALID_SCORE", "Session game mismatch.", 400);
    if (session.gameVersion !== body.data.gameVersion) {
      slog("suspicious_run", { reason: "version_mismatch", gameId: body.data.gameId });
    }
  }

  const serverDuration = session ? Math.max(0, Date.now() - session.startedAt) : body.data.durationMs;
  const durationSkew = Math.abs(serverDuration - body.data.durationMs);
  const check = validateScore({
    sessionId: session?.id ?? body.data.localSessionId ?? "offline",
    gameId: body.data.gameId,
    gameVersion: body.data.gameVersion,
    mode: body.data.mode,
    score: body.data.score,
    durationMs: body.data.durationMs,
    startedAt: body.data.startedAt,
    endedAt: body.data.endedAt,
    metadata: body.data.metadata,
    offline,
  });
  if (!offline && durationSkew > 20_000 && check.status === "verified") {
    check.reasons.push("server_duration_skew");
    check.status = "unverified";
  }
  if (offline && check.status === "verified") {
    check.status = "unverified";
    check.reasons.push("offline_unverified");
  }

  if (check.status === "flagged") slog("score_flagged", { gameId: body.data.gameId, reasons: check.reasons.length });

  try {
    const result = await backend.submitScore({
      identity,
      session,
      gameId: body.data.gameId,
      mode: body.data.mode,
      score: body.data.score,
      durationMs: body.data.durationMs,
      metadata: body.data.metadata,
      verified: check.status,
      offline,
      flagReasons: check.reasons,
      gameVersion: body.data.gameVersion,
      buildSha: commitSha(),
      clientStartedAt: body.data.startedAt,
      clientEndedAt: body.data.endedAt,
      localSessionId: body.data.localSessionId,
    });

    const payload = {
      verification: check,
      alreadyApplied: result.alreadyApplied,
      progressionDiff: result.progression,
      scoreId: result.score.id,
    };
    slog("score_finalized", {
      gameId: body.data.gameId,
      scoreId: result.score.id,
      sessionId: session?.id ?? "offline",
      verification: check.status,
    });
    await backend.putIdempotency(scope, idem, "score", 200, payload, identity);
    return jsonOk(payload);
  } catch (err) {
    const code = err instanceof Error && "code" in err ? String((err as { code?: string }).code) : "";
    if (code === "FORBIDDEN" || (err instanceof Error && err.message === "forbidden")) {
      return jsonError("FORBIDDEN", "Session belongs to another player.", 403);
    }
    slog("api_error", { endpoint: "score" });
    return jsonError("INTERNAL", "Could not store score.", 500);
  }
}
