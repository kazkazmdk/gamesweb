import { medalForTime } from "./constants";
import type { VerifiedStatus } from "./types";

export type IdentityRef = {
  userId: string | null;
  anonymousId: string;
};

export type SessionOwnerInput = {
  userId: string | null;
  anonymousId: string | null;
};

export function assertSessionOwnership(
  session: SessionOwnerInput,
  identity: IdentityRef,
): "ok" | "forbidden" {
  if (identity.userId) {
    return session.userId === identity.userId ? "ok" : "forbidden";
  }
  if (session.userId) return "forbidden";
  if (!session.anonymousId || session.anonymousId !== identity.anonymousId) return "forbidden";
  return "ok";
}

export function idempotencyScope(identity: IdentityRef): string {
  return identity.userId ? `user:${identity.userId}` : `anon:${identity.anonymousId}`;
}

export function achievementId(gameId: string | null, key: string): string {
  return `${gameId ?? "platform"}:${key}`;
}

export type ScoreLike = {
  gameId: string;
  mode: string;
  score: number;
  verified: VerifiedStatus;
  metadata: Record<string, number | string | boolean>;
};

export function reconstructAchievementsFromScores(scores: ScoreLike[]): string[] {
  const out = new Set<string>();
  const verified = scores.filter((s) => s.verified === "verified");
  if (!verified.length) return [];
  out.add("platform:first-run");

  const games = new Set(verified.map((s) => s.gameId));
  if (games.has("neon-drift") && games.has("velocity-run") && games.has("swarm-protocol")) {
    out.add("platform:three-worlds");
  }

  for (const s of verified) {
    if (s.gameId === "neon-drift") {
      if (s.score >= 25000) out.add("neon-drift:score-25k");
      if (s.score >= 60000) out.add("neon-drift:score-60k");
      if (Number(s.metadata.laps ?? 0) >= 2) out.add("neon-drift:two-laps");
      if (Number(s.metadata.combo ?? 0) >= 5) out.add("neon-drift:combo-5");
    }
    if (s.gameId === "velocity-run") {
      out.add("velocity-run:first-finish");
      const medal = medalForTime(s.mode, s.score);
      if (medal) out.add("velocity-run:bronze");
      if (medal === "gold" || medal === "platinum") out.add("velocity-run:gold");
      if (medal === "platinum") out.add("velocity-run:platinum");
      if (Number(s.metadata.deaths ?? 1) === 0) out.add("velocity-run:no-death");
      if (s.mode === "course-1" && s.score < 40000) out.add("velocity-run:sub-40");
    }
    if (s.gameId === "swarm-protocol") {
      const kills = Number(s.metadata.kills ?? 0);
      const survive = Number(s.metadata.surviveMs ?? 0);
      const level = Number(s.metadata.level ?? 1);
      if (kills >= 10) out.add("swarm-protocol:first-blood");
      if (survive >= 120000) out.add("swarm-protocol:survive-2");
      if (survive >= 300000) out.add("swarm-protocol:survive-5");
      if (level >= 8) out.add("swarm-protocol:level-8");
      if (kills >= 200) out.add("swarm-protocol:kills-200");
      if (Number(s.metadata.elites ?? 0) >= 1) out.add("swarm-protocol:elite");
    }
  }
  return [...out];
}
