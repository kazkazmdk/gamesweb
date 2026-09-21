import { actorId } from "@/lib/api/actor";
import type { Identity } from "@/lib/api/identity";
import type { BackendStore, CompetitiveRun, StoredScore } from "@/lib/backend/types";

export function ownsScore(score: StoredScore, identity: Identity) {
  if (identity.userId) return score.userId === identity.userId;
  return !score.userId && score.anonymousId === identity.anonymousId;
}

export async function loadCompetitiveRun(
  backend: BackendStore,
  identity: Identity,
  runId: string,
): Promise<CompetitiveRun | { error: string }> {
  const score = await backend.getScore(runId);
  if (!score) return { error: "run_not_found" };
  if (!ownsScore(score, identity)) return { error: "run_forbidden" };
  const session = score.sessionId ? await backend.getSession(score.sessionId) : null;
  const durationMs =
    typeof score.metadata.durationMs === "number"
      ? score.metadata.durationMs
      : typeof score.metadata.duration === "number"
        ? Number(score.metadata.duration)
        : session?.durationMs ?? 0;
  const gameVersion = session?.gameVersion ?? "1.0.0";
  return {
    runId: score.id,
    userId: score.userId,
    anonymousId: score.anonymousId,
    actorId: actorId(identity),
    gameId: score.gameId,
    mode: score.mode,
    score: score.score,
    durationMs,
    gameVersion,
    verificationStatus: score.verified,
    createdAt: score.createdAt,
  };
}

export function competitiveTrust(status: CompetitiveRun["verificationStatus"]): "verified" | "unverified" | "practice" {
  if (status === "verified") return "verified";
  if (status === "flagged") return "unverified";
  return "unverified";
}
