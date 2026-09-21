import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { getIdentity } from "@/lib/api/identity";
import { actorId, attemptChallenge, createChallenge, getChallenge } from "@/lib/backend/social-arcade";
import { decodeChallengePayload, type ChallengeType } from "@gamesweb/game-sdk";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").toUpperCase();
  if (!code) return jsonError("INVALID_PAYLOAD", "Missing code.", 400);
  const payload = url.searchParams.get("p");
  let challenge = getChallenge(code);
  if (!challenge && payload) {
    const share = decodeChallengePayload(payload);
    if (share) {
      challenge = createChallenge({
        gameId: share.gameId,
        mode: share.mode,
        seed: share.seed,
        type: share.type,
        challengerId: share.challengerId,
        challengerName: share.challengerName,
        score: share.challengerScore,
        trust: share.trust,
        gameVersion: share.gameVersion,
        publicCode: share.publicCode,
        expiresAt: share.expiresAt,
      });
    }
  }
  if (!challenge) return jsonError("NOT_FOUND", "Challenge not found on this instance.", 404);
  return jsonOk({ challenge, persistence: "server" });
}

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as {
    action?: "create" | "attempt";
    gameId?: string;
    mode?: string;
    seed?: string;
    type?: ChallengeType;
    challengerName?: string;
    score?: number;
    code?: string;
    playerName?: string;
    trust?: "verified" | "unverified" | "flagged";
    durationMs?: number;
  };
  const identity = await getIdentity();
  const id = actorId(identity);
  if ((body.action ?? "create") === "attempt") {
    const code = (body.code ?? "").toUpperCase();
    if (!code || typeof body.score !== "number") return jsonError("INVALID_PAYLOAD", "Need code and score.", 400);
    const result = attemptChallenge(code, {
      id: crypto.randomUUID(),
      playerId: id,
      playerName: body.playerName ?? "Player",
      score: body.score,
      runId: null,
      trust: body.trust ?? "unverified",
      createdAt: Date.now(),
      metadata: { durationMs: body.durationMs ?? 0 },
    });
    if (!result.ok) return jsonError("NOT_FOUND", "Challenge not found.", 404);
    return jsonOk({ ...result, persistence: "server" });
  }
  if (!body.gameId || typeof body.score !== "number") return jsonError("INVALID_PAYLOAD", "Need gameId and score.", 400);
  const challenge = createChallenge({
    gameId: body.gameId,
    mode: body.mode ?? "default",
    seed: body.seed ?? `${Date.now()}`,
    type: body.type ?? "beat-score",
    challengerId: id,
    challengerName: body.challengerName ?? "Player",
    score: body.score,
    trust: body.trust,
  });
  return jsonOk({ challenge, url: `/c/${challenge.publicCode}`, persistence: "server" });
}
