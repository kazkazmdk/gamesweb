import { lowerIsBetter } from "@gamesweb/database";
import {
  challengeCompatible,
  challengeOutcome,
  defaultChallengeType,
  getManifest,
  rankScores,
  type ChallengeRecord,
  type ChallengeType,
} from "@gamesweb/game-sdk";
import type { StoredRival } from "@/lib/backend/types";

const CHALLENGE_TYPES = new Set<ChallengeType>([
  "beat-score",
  "beat-time",
  "beat-ghost",
  "survive-longer",
  "same-seed",
  "beat-route",
  "beat-build",
  "survive-seed",
]);

export type CompetitiveTarget = { gameId: string; mode: string; seed?: string | null };
export type CompetitiveRunTarget = { gameId: string; mode: string; seed?: string | null };

export function validateCompetitiveRunTarget(
  run: CompetitiveRunTarget,
  target: CompetitiveTarget,
): { ok: true } | { ok: false; error: "game_mismatch" | "mode_mismatch" | "seed_mismatch" } {
  if (run.gameId !== target.gameId) return { ok: false, error: "game_mismatch" };
  if (run.mode !== target.mode) return { ok: false, error: "mode_mismatch" };
  const runSeed = run.seed?.trim();
  const targetSeed = target.seed?.trim();
  if (runSeed && targetSeed && runSeed !== targetSeed) return { ok: false, error: "seed_mismatch" };
  return { ok: true };
}

export function resolveChallengeType(
  gameId: string,
  requested?: string | null,
): { ok: true; type: ChallengeType } | { ok: false; error: "type_mismatch" | "game_mismatch" } {
  const game = getManifest(gameId);
  if (!game) return { ok: false, error: "game_mismatch" };
  if (!requested) return { ok: true, type: defaultChallengeType(game) };
  if (!CHALLENGE_TYPES.has(requested as ChallengeType) || !challengeCompatible(game, requested as ChallengeType)) {
    return { ok: false, error: "type_mismatch" };
  }
  return { ok: true, type: requested as ChallengeType };
}

export type PartyRoundRow = { id: string; name?: string; score: number; submittedAt?: number };

/** Rank a closed round. Ties keep submission order, matching the SQL `submitted_at` sort. */
export function rankPartyRound<T extends PartyRoundRow>(rows: T[], gameId: string) {
  const ordered = [...rows].sort(
    (a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0) || a.id.localeCompare(b.id),
  );
  return rankScores(ordered, lowerIsBetter(gameId));
}

export function applyRoundPoints(
  standings: Array<{ id: string; name: string; points: number }>,
  ranked: Array<{ id: string; name?: string; points: number }>,
) {
  const next = standings.map((row) => ({ ...row }));
  for (const row of ranked) {
    const hit = next.find((standing) => standing.id === row.id);
    if (hit) hit.points += row.points;
    else next.push({ id: row.id, name: row.name ?? "Player", points: row.points });
  }
  return next;
}

export type RivalMatch = {
  selfId: string;
  otherId: string;
  otherName: string;
  outcome: "win" | "loss" | "draw";
  at: number;
};

/** Replay outcomes in time order. Draws do not change the streak. */
export function deriveRivalRows(matches: RivalMatch[]): StoredRival[] {
  const groups = new Map<string, RivalMatch[]>();
  for (const match of matches) {
    if (!match.otherId || match.otherId === match.selfId) continue;
    const key = `${match.selfId}\0${match.otherId}`;
    const list = groups.get(key) ?? [];
    list.push(match);
    groups.set(key, list);
  }
  const rows: StoredRival[] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => a.at - b.at || a.otherId.localeCompare(b.otherId));
    const row: StoredRival = {
      selfId: list[0].selfId,
      otherId: list[0].otherId,
      otherName: list[0].otherName || "Player",
      winsA: 0,
      winsB: 0,
      draws: 0,
      totalMatches: 0,
      lastMatch: list[list.length - 1].at,
      streak: 0,
      rivalryScore: 0,
    };
    for (const match of list) {
      row.totalMatches += 1;
      if (match.otherName) row.otherName = match.otherName;
      row.lastMatch = match.at;
      if (match.outcome === "win") {
        row.winsA += 1;
        row.streak = row.streak >= 0 ? row.streak + 1 : 1;
      } else if (match.outcome === "loss") {
        row.winsB += 1;
        row.streak = row.streak <= 0 ? row.streak - 1 : -1;
      } else {
        row.draws += 1;
      }
    }
    row.rivalryScore = row.totalMatches * 10 + Math.abs(row.winsA - row.winsB);
    rows.push(row);
  }
  return rows;
}

export function matchesFromChallenges(selfId: string, challenges: ChallengeRecord[]): RivalMatch[] {
  const out: RivalMatch[] = [];
  for (const challenge of challenges) {
    const lower = getManifest(challenge.gameId)?.scoreDirection === "lower";
    for (const attempt of challenge.attempts) {
      if (attempt.trust === "practice") continue;
      const opponentOutcome = challengeOutcome(challenge.type, challenge.challengerScore, attempt.score, Boolean(lower));
      if (attempt.playerId === selfId && challenge.challengerId !== selfId) {
        out.push({
          selfId,
          otherId: challenge.challengerId,
          otherName: challenge.challengerName,
          outcome: opponentOutcome,
          at: attempt.createdAt,
        });
      }
      if (challenge.challengerId === selfId && attempt.playerId && attempt.playerId !== selfId) {
        const mine = opponentOutcome === "win" ? "loss" : opponentOutcome === "loss" ? "win" : "draw";
        out.push({
          selfId,
          otherId: attempt.playerId,
          otherName: attempt.playerName,
          outcome: mine,
          at: attempt.createdAt,
        });
      }
    }
  }
  return out;
}

export function rivalsFromChallenges(selfId: string, challenges: ChallengeRecord[]): StoredRival[] {
  return deriveRivalRows(matchesFromChallenges(selfId, challenges));
}
