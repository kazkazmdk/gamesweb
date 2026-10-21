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
  if (games.size >= 5) out.add("platform:arcade-tourist");
  if (games.size >= 8) out.add("platform:world-tour");

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
    if (s.gameId === "sky-stack") {
      const floors = Number(s.metadata.floors ?? 0);
      if (floors >= 1 || Number(s.metadata.perfects ?? 0) >= 1 || s.score >= 100) {
        out.add("sky-stack:first-place");
      }
      if (Number(s.metadata.maxStreak ?? s.metadata.streak ?? 0) >= 8) {
        out.add("sky-stack:streak-8");
      }
      if (floors >= 30 || s.score >= 3000) out.add("sky-stack:floor-30");
      if (floors >= 67 || s.score >= 6700) out.add("sky-stack:floor-67");
      if (Number(s.metadata.fevers ?? 0) >= 2) out.add("sky-stack:fever-2");
    }
    if (s.gameId === "knockout-circuit") {
      out.add("knockout-circuit:first-gate");
      if (s.metadata.result !== "death" && s.metadata.result !== "timeout") {
        out.add("knockout-circuit:finish");
        if (Number(s.metadata.falls ?? s.metadata.deaths ?? 0) === 0) {
          out.add("knockout-circuit:no-fall");
        }
        if (s.score > 0 && s.score <= 36_000) {
          out.add("knockout-circuit:fast");
        }
      }
    }
    if (s.gameId === "pocket-striker") {
      out.add("pocket-striker:first-pocket");
      if (Boolean(s.metadata.banked)) out.add("pocket-striker:bank");
      if (s.score <= Number(s.metadata.par ?? 3) - 1) out.add("pocket-striker:under-par");
      if (s.score === 1) out.add("pocket-striker:perfect");
    }
    if (s.gameId === "territory-rush") {
      out.add("territory-rush:first-claim");
      if (s.score >= 50 || Number(s.metadata.territoryPct ?? 0) >= 50) {
        out.add("territory-rush:half");
      }
      if (s.score >= 72 || Number(s.metadata.territoryPct ?? 0) >= 72) {
        out.add("territory-rush:dominate");
      }
    }
    if (s.gameId === "crowd-control") {
      out.add("crowd-control:pack-gate");
      if (s.score >= 60 || Number(s.metadata.pack ?? 0) >= 60) {
        out.add("crowd-control:pack-60");
      }
      if (s.score >= 120 || Number(s.metadata.pack ?? 0) >= 120) {
        out.add("crowd-control:pack-120");
      }
      if (
        Boolean(s.metadata.bossCleared) ||
        (s.metadata.result === "finish" && s.metadata.bossCleared !== false)
      ) {
        out.add("crowd-control:win-boss");
      }
    }
  }
  return [...out];
}
