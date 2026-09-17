import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { arcadeStore } from "@/lib/social/arcade-store";
import { decodeChallengePayload, type ChallengeType } from "@gamesweb/game-sdk";

type G = typeof globalThis & { __gw_challenges?: Map<string, unknown> };
function bag() {
  const g = globalThis as G;
  if (!g.__gw_challenges) g.__gw_challenges = new Map();
  return g.__gw_challenges;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").toUpperCase();
  if (!code) return jsonError("INVALID_PAYLOAD", "Missing code.", 400);
  const hit = bag().get(code) ?? arcadeStore.getChallenge(code, url.searchParams.get("p"));
  if (!hit) return jsonError("NOT_FOUND", "Challenge not found on this instance.", 404);
  return jsonOk({ challenge: hit, persistence: "ephemeral" });
}

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as {
    gameId?: string;
    mode?: string;
    seed?: string;
    type?: ChallengeType;
    challengerName?: string;
    challengerId?: string;
    score?: number;
    payload?: string;
  };
  if (body.payload) {
    const share = decodeChallengePayload(body.payload);
    if (!share) return jsonError("INVALID_PAYLOAD", "Bad payload.", 400);
    bag().set(share.publicCode, share);
    return jsonOk({ challenge: share, persistence: "ephemeral" });
  }
  if (!body.gameId || typeof body.score !== "number") return jsonError("INVALID_PAYLOAD", "Need gameId and score.", 400);
  const made = arcadeStore.createChallenge({
    gameId: body.gameId,
    mode: body.mode ?? "default",
    seed: body.seed ?? `${Date.now()}`,
    type: body.type ?? "beat-score",
    challengerId: body.challengerId ?? "guest",
    challengerName: body.challengerName ?? "Player",
    score: body.score,
  });
  bag().set(made.challenge.publicCode, made.challenge);
  return jsonOk({ ...made, persistence: "ephemeral" });
}
