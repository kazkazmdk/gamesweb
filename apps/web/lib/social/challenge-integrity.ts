import { challengeCompatible, getManifest, type ChallengeRecord, type ChallengeShare } from "@gamesweb/game-sdk";

/** Business errors from the challenge API. These are not network failures. */
export const CHALLENGE_BUSINESS_ERRORS = [
  "challenge_closed",
  "self_challenge",
  "run_reuse",
  "mode_mismatch",
  "game_mismatch",
  "invalid_score",
  "expired",
  "run_forbidden",
  "not_found",
  "type_mismatch",
  "seed_mismatch",
  "run_not_found",
] as const;

export type ChallengeBusinessError = (typeof CHALLENGE_BUSINESS_ERRORS)[number];

export type ChallengeApiError = { code?: string; message?: string };

export type ChallengeRemoteResult =
  | { ok: true }
  | { ok: false; status?: number; error?: ChallengeApiError };

export function challengeBusinessError(error?: ChallengeApiError | null): ChallengeBusinessError | null {
  const message = error?.message ?? "";
  return (CHALLENGE_BUSINESS_ERRORS as readonly string[]).includes(message) ? (message as ChallengeBusinessError) : null;
}

export function isServerBackedChallenge(challenge?: { metadata?: Record<string, unknown> } | null) {
  return challenge?.metadata?.persistence === "server";
}

export function markServerChallenge<T extends ChallengeRecord>(challenge: T): T {
  return {
    ...challenge,
    metadata: { ...challenge.metadata, persistence: "server" },
  };
}

export function markLocalChallenge<T extends ChallengeRecord>(challenge: T): T {
  return {
    ...challenge,
    trust: "unverified",
    metadata: { ...challenge.metadata, source: "local-share", persistence: "local" },
  };
}

/** Decode an untrusted local share. Base64url is not a signature. */
export function localChallengeFromShare(
  share: ChallengeShare,
  code: string,
  now = Date.now(),
): { ok: true; challenge: ChallengeRecord } | { ok: false; error: ChallengeBusinessError } {
  if (share.publicCode.toUpperCase() !== code.toUpperCase()) return { ok: false, error: "not_found" };
  const game = getManifest(share.gameId);
  if (!game) return { ok: false, error: "game_mismatch" };
  if (!challengeCompatible(game, share.type)) return { ok: false, error: "type_mismatch" };
  if (!game.modes.includes(share.mode)) return { ok: false, error: "mode_mismatch" };
  if (!Number.isFinite(share.expiresAt)) return { ok: false, error: "expired" };
  const expired = share.expiresAt <= now;
  return {
    ok: true,
    challenge: markLocalChallenge({
      id: `local:${code.toUpperCase()}`,
      publicCode: code.toUpperCase(),
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
      status: expired ? "expired" : "open",
      createdAt: now,
      expiresAt: share.expiresAt,
      metadata: {},
      winnerId: null,
      targetScore: null,
      trust: "unverified",
      gameVersion: share.gameVersion || game.version || "1.0.0",
      attempts: [],
    }),
  };
}

export type ChallengeAttemptPlan =
  | { action: "use-server" }
  | { action: "local" }
  | { action: "reject"; error: ChallengeBusinessError }
  | { action: "unavailable"; error: "server_unavailable" };

export function planChallengeAttempt(input: {
  remote: ChallengeRemoteResult;
  hasLocalShare: boolean;
  serverBacked: boolean;
}): ChallengeAttemptPlan {
  if (input.remote.ok) return { action: "use-server" };
  const error = challengeBusinessError(input.remote.error);
  if (error === "not_found" && input.hasLocalShare && !input.serverBacked) return { action: "local" };
  if (error) return { action: "reject", error };
  if (input.serverBacked) return { action: "unavailable", error: "server_unavailable" };
  if (input.hasLocalShare) return { action: "local" };
  return { action: "unavailable", error: "server_unavailable" };
}

export type ChallengeCreatePlan = { action: "use-server" } | { action: "local" } | { action: "reject"; error: string };

export function planChallengeCreate(remote: ChallengeRemoteResult): ChallengeCreatePlan {
  if (remote.ok) return { action: "use-server" };
  const error = challengeBusinessError(remote.error);
  if (error) return { action: "reject", error };
  return { action: "local" };
}
