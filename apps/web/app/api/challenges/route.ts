import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";
import { attemptChallengeFromRun, createChallengeFromRun, getChallenge, putChallenge } from "@/lib/backend/social-arcade";
import { decodeChallengePayload, getManifest } from "@gamesweb/game-sdk";

function knownGame(id: string) {
  return Boolean(getManifest(id));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").toUpperCase();
  if (!code) return jsonError("INVALID_PAYLOAD", "Missing code.", 400);
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const payload = url.searchParams.get("p");
  let challenge = await getChallenge(code);
  if (!challenge && payload) {
    const share = decodeChallengePayload(payload);
    if (
      share &&
      share.publicCode.toUpperCase() === code &&
      knownGame(share.gameId) &&
      share.expiresAt > Date.now()
    ) {
      await putChallenge({
        id: crypto.randomUUID(),
        publicCode: code,
        gameId: share.gameId,
        mode: share.mode,
        seed: share.seed,
        type: share.type,
        challengerId: share.challengerId,
        challengerName: share.challengerName,
        targetId: null,
        targetName: null,
        challengerRunId: null,
        challengerScore: share.challengerScore,
        challengerGhostId: null,
        challengerMeta: {},
        status: "open",
        createdAt: Date.now(),
        expiresAt: share.expiresAt,
        metadata: { source: "payload-fallback" },
        winnerId: null,
        targetScore: null,
        trust: "unverified",
        gameVersion: share.gameVersion,
        attempts: [],
      });
      challenge = await getChallenge(code);
    }
  }
  if (!challenge) return jsonError("NOT_FOUND", "Challenge not found.", 404);
  return jsonOk({ challenge, persistence: "server" });
}

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as {
    action?: "create" | "attempt";
    runId?: string;
    code?: string;
    challengeType?: string;
    type?: string;
    score?: number;
    trust?: string;
    playerId?: string;
    challengerId?: string;
    gameId?: string;
  };
  if (body.trust === "verified" || typeof body.score === "number" || body.playerId || body.challengerId) {
    return jsonError("FORBIDDEN", "Score, trust, and identity are server-derived from runId.", 403);
  }
  const identity = await getIdentity();
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  if ((body.action ?? "create") === "attempt") {
    const limited = await rateLimit(`challenge-attempt:${identityKey(identity)}:${clientIp(req)}`, policies.challengeAttempt);
    if (!limited.ok) return jsonError("RATE_LIMITED", "Too many attempts.", 429);
    const code = (body.code ?? "").toUpperCase();
    if (!code || !body.runId) return jsonError("INVALID_PAYLOAD", "Need code and runId.", 400);
    const result = await attemptChallengeFromRun(identity, code, body.runId);
    if (!result.ok) {
      const forbidden = result.error === "run_forbidden" || result.error === "game_mismatch";
      return jsonError(forbidden ? "FORBIDDEN" : result.error === "expired" ? "CONFLICT" : "NOT_FOUND", result.error, forbidden ? 403 : result.error === "expired" ? 409 : 404);
    }
    return jsonOk({ ...result, persistence: "server" });
  }
  const limited = await rateLimit(`challenge-create:${identityKey(identity)}:${clientIp(req)}`, policies.challengeCreate);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many challenges.", 429);
  if (!body.runId) return jsonError("INVALID_PAYLOAD", "Need runId.", 400);
  const created = await createChallengeFromRun(identity, body.runId, body.challengeType ?? body.type);
  if ("error" in created) {
    return jsonError(created.error === "run_forbidden" ? "FORBIDDEN" : "NOT_FOUND", created.error, created.error === "run_forbidden" ? 403 : 404);
  }
  return jsonOk({ ...created, persistence: "server" });
}
