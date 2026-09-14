import { GAME_MANIFESTS } from "./manifests";
import type { QuestDefinition } from "./types";

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

const POOL: QuestDefinition[] = [
  {
    id: "nd-score-25k",
    title: "Hold the line",
    description: "Score 25,000 in Neon Drift.",
    type: "daily",
    gameId: "neon-drift",
    stat: "neon-drift:score",
    target: 25000,
    xp: 60,
  },
  {
    id: "nd-combo-6",
    title: "Don't straighten",
    description: "Reach a 6x combo in Neon Drift.",
    type: "daily",
    gameId: "neon-drift",
    stat: "neon-drift:maxCombo",
    target: 6,
    xp: 50,
  },
  {
    id: "vr-course1-65",
    title: "Sub-65",
    description: "Finish Velocity Run Course 1 under 65 seconds.",
    type: "daily",
    gameId: "velocity-run",
    stat: "velocity-run:course-1-under",
    target: 65000,
    xp: 60,
  },
  {
    id: "vr-any-gold",
    title: "Gold split",
    description: "Earn gold on any Velocity Run course.",
    type: "daily",
    gameId: "velocity-run",
    stat: "velocity-run:gold",
    target: 1,
    xp: 55,
  },
  {
    id: "sp-survive-5",
    title: "Five-minute protocol",
    description: "Survive 5 minutes in Swarm Protocol.",
    type: "daily",
    gameId: "swarm-protocol",
    stat: "swarm-protocol:surviveMs",
    target: 5 * 60 * 1000,
    xp: 70,
  },
  {
    id: "sp-kills-120",
    title: "Clear the grid",
    description: "Defeat 120 hostiles in one Swarm Protocol run.",
    type: "daily",
    gameId: "swarm-protocol",
    stat: "swarm-protocol:kills",
    target: 120,
    xp: 55,
  },
  {
    id: "cross-two-games",
    title: "Two worlds",
    description: "Play 2 different games today.",
    type: "daily",
    gameId: null,
    stat: "platform:uniqueGamesToday",
    target: 2,
    xp: 50,
  },
  {
    id: "cross-pb",
    title: "Raise the floor",
    description: "Beat one personal best.",
    type: "daily",
    gameId: null,
    stat: "platform:pbCountToday",
    target: 1,
    xp: 45,
  },
];

export function dailyQuests(day = utcDayKey()): QuestDefinition[] {
  const n = hash(day || "day");
  const gameChallenges = POOL.filter((q) => q.gameId);
  const cross = POOL.filter((q) => !q.gameId);
  const games = GAME_MANIFESTS.filter(Boolean);
  if (!games.length) return [];
  const rotated = games[(n + (day?.length ?? 0)) % games.length] ?? games[0];
  const primary = gameChallenges.filter((q) => q.gameId === rotated.id);
  const secondGame = games[(games.indexOf(rotated) + 1 + (n % 2)) % games.length] ?? games[0];
  const secondary = gameChallenges.filter((q) => q.gameId === secondGame.id);
  const pick = (list: QuestDefinition[], salt: number) =>
    list.length ? list[Math.abs(salt) % list.length] : undefined;
  const picked = [pick(primary, n), pick(secondary, n >> 3), pick(cross, n)].filter(
    (q): q is QuestDefinition => Boolean(q),
  );
  return picked.map((q) => ({
    ...q,
    id: `${day}:${q.id}`,
  }));
}

export type RecommendInput = {
  history: Array<{ gameId: string; durationMs: number; at: number }>;
  playedIds: string[];
  challengeGameIds: string[];
  friendsPlaying: string[];
  lastResult?: { gameId: string; improved: boolean; retries: number };
};

export function recommend(input: RecommendInput): string[] {
  const scores = new Map<string, number>();
  for (const game of GAME_MANIFESTS) scores.set(game.id, 1);

  for (const id of input.playedIds) {
    scores.set(id, (scores.get(id) ?? 0) + 2);
  }
  for (const id of GAME_MANIFESTS.map((g) => g.id)) {
    if (!input.playedIds.includes(id)) scores.set(id, (scores.get(id) ?? 0) + 6);
  }
  for (const id of input.challengeGameIds) {
    scores.set(id, (scores.get(id) ?? 0) + 4);
  }
  for (const id of input.friendsPlaying) {
    scores.set(id, (scores.get(id) ?? 0) + 3);
  }

  const last = input.history[0];
  if (last) scores.set(last.gameId, (scores.get(last.gameId) ?? 0) + 1);

  if (input.lastResult) {
    if (input.lastResult.improved) {
      scores.set(input.lastResult.gameId, (scores.get(input.lastResult.gameId) ?? 0) + 2);
    }
    if (input.lastResult.retries >= 3 && !input.lastResult.improved) {
      scores.set(input.lastResult.gameId, (scores.get(input.lastResult.gameId) ?? 0) - 3);
      const other = GAME_MANIFESTS.find((g) => g.id !== input.lastResult?.gameId);
      if (other) scores.set(other.id, (scores.get(other.id) ?? 0) + 5);
    }
  }

  const avg = new Map<string, number>();
  for (const h of input.history) {
    avg.set(h.gameId, (avg.get(h.gameId) ?? 0) + h.durationMs);
  }
  for (const [id, total] of avg) {
    if (total > 4 * 60 * 1000) scores.set(id, (scores.get(id) ?? 0) + 1);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}
