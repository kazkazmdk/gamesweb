import { allAchievements, dailyQuests, GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { QuestDefinition } from "@gamesweb/game-sdk";
import { formatPlayScore, formatRelativeTime, hasRecord } from "./format";
import { defaultBoardMode, lowerIsBetter } from "./modes";
import type { Friend, PlayRecord, PlayerSnapshot, StoredScore } from "@/lib/player-store";

export function playerStatsFromSnapshot(player: PlayerSnapshot) {
  const games = new Set(player.history.map((h) => h.gameId));
  return {
    runs: player.history.length,
    pbs: player.pbCount,
    achievements: player.achievements.length,
    games: games.size,
  };
}

export function favoriteGameId(player: PlayerSnapshot) {
  const counts = new Map<string, number>();
  for (const h of player.history) counts.set(h.gameId, (counts.get(h.gameId) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [id, c] of counts) {
    if (c > n) {
      best = id;
      n = c;
    }
  }
  return best;
}

export function lastPbEvent(history: PlayRecord[]) {
  for (const h of history) {
    const delta = h.metadata?.pbDelta;
    if (typeof delta !== "number") continue;
    const improved = h.gameId === "velocity-run" ? delta < 0 : delta > 0;
    if (!improved) continue;
    return { gameId: h.gameId, score: h.score, delta, at: h.at };
  }
  return null;
}

export function gameRecordFor(
  player: PlayerSnapshot,
  gameId: string,
  mode = defaultBoardMode(gameId),
) {
  const lower = lowerIsBetter(gameId);
  const rows = player.scores.filter((s) => s.gameId === gameId && s.mode === mode);
  if (!rows.length) return { score: lower ? Number.POSITIVE_INFINITY : 0, mode, at: 0 };
  const score = lower ? Math.min(...rows.map((r) => r.score)) : Math.max(...rows.map((r) => r.score));
  const row = rows.find((r) => r.score === score);
  return { score, mode, at: row?.at ?? 0 };
}

export function recentDeltaFor(player: PlayerSnapshot, gameId: string, mode: string) {
  const rows = player.history.filter((h) => h.gameId === gameId && (h.metadata?.mode === mode || !h.metadata?.mode));
  const last = rows[0];
  const delta = last?.metadata?.pbDelta;
  return typeof delta === "number" ? delta : null;
}

export type ChallengeView = {
  quest: QuestDefinition;
  progress: number;
  done: boolean;
  gameTitle: string | null;
  slug: string | null;
  currentLabel: string;
  targetLabel: string;
};

export function challengeViewModel(player: PlayerSnapshot, quest: QuestDefinition): ChallengeView {
  const progress = player.questProgress[quest.id] ?? 0;
  const done = player.questCompleted.includes(quest.id);
  const game = quest.gameId ? getManifest(quest.gameId) : null;
  return {
    quest,
    progress,
    done,
    gameTitle: game?.title ?? null,
    slug: game?.slug ?? null,
    currentLabel: formatQuestValue(quest, Math.min(progress, quest.target)),
    targetLabel: formatQuestValue(quest, quest.target),
  };
}

function formatQuestValue(quest: QuestDefinition, value: number) {
  const stat = quest.stat;
  if (stat.includes("surviveMs") || stat.endsWith("-under")) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}s`;
  }
  if (stat.includes("score") || quest.target >= 1000) return Math.round(value).toLocaleString();
  return String(Math.round(value));
}

export function dailySummary(player: PlayerSnapshot) {
  const quests = dailyQuests(player.dayKey);
  const done = quests.filter((q) => player.questCompleted.includes(q.id)).length;
  const xp = quests.reduce((sum, q) => sum + (player.questCompleted.includes(q.id) ? q.xp : 0), 0);
  const totalXp = quests.reduce((sum, q) => sum + q.xp, 0);
  return { quests, done, total: quests.length, xp, totalXp };
}

export type ActivityItem = {
  id: string;
  gameId: string;
  title: string;
  event: string;
  scoreLabel: string | null;
  at: number;
  timeLabel: string | null;
};

export function activityFromHistory(history: PlayRecord[], limit = 8): ActivityItem[] {
  return history.slice(0, limit).map((h, i) => {
    const game = getManifest(h.gameId);
    const medal = typeof h.metadata?.medal === "string" ? h.metadata.medal : null;
    const delta = typeof h.metadata?.pbDelta === "number" ? h.metadata.pbDelta : null;
    const improved = delta !== null && (h.gameId === "velocity-run" ? delta < 0 : delta > 0);
    const event = improved ? "New PB" : medal ? medal : h.result || "Run";
    return {
      id: `${h.at}-${i}`,
      gameId: h.gameId,
      title: game?.title ?? h.gameId,
      event,
      scoreLabel: formatPlayScore(h.gameId, h.score),
      at: h.at,
      timeLabel: formatRelativeTime(h.at),
    };
  });
}

export type BoardRow = { name: string; score: number; isYou?: boolean };

export function rankViewModel(rows: BoardRow[], gameId: string) {
  const youIndex = rows.findIndex((r) => r.isYou);
  const rank = youIndex >= 0 ? youIndex + 1 : null;
  const you = youIndex >= 0 ? rows[youIndex] : null;
  const above = youIndex > 0 ? rows[youIndex - 1] : null;
  const lower = lowerIsBetter(gameId);
  const gap =
    you && above
      ? lower
        ? you.score - above.score
        : above.score - you.score
      : null;
  return {
    rank,
    you,
    top3: rows.slice(0, 3),
    above,
    gap,
    top10: rows.slice(0, 10),
  };
}

export function friendOnBoard(rows: BoardRow[], friends: Friend[]) {
  const names = new Set(friends.filter((f) => f.status === "accepted").map((f) => f.displayName));
  return rows.find((r) => !r.isYou && names.has(r.name)) ?? null;
}

export function friendsBoard(rows: BoardRow[], friends: Friend[]) {
  const names = new Set(friends.filter((f) => f.status === "accepted").map((f) => f.displayName));
  return rows.filter((r) => r.isYou || names.has(r.name));
}

export function latestUnlocks(player: PlayerSnapshot, limit = 3) {
  const defs = allAchievements();
  const unlocked = [...player.achievements].reverse();
  const items = [];
  for (const id of unlocked) {
    const [scope, ...rest] = id.split(":");
    const key = rest.join(":");
    const def = defs.find((a) => a.key === key && (a.gameId ?? "platform") === scope);
    if (def) items.push({ id, ...def, unlocked: true });
    if (items.length >= limit) break;
  }
  return items;
}

export function achievementProgress(player: PlayerSnapshot, gameId?: string) {
  const defs = gameId
    ? (getManifest(gameId)?.achievements ?? []).map((a) => ({ ...a, gameId }))
    : allAchievements();
  const unlocked = defs.filter((a) => player.achievements.includes(`${a.gameId ?? "platform"}:${a.key}`)).length;
  return { unlocked, total: defs.length, defs };
}

export function verifiedLabel(score: StoredScore | undefined) {
  if (!score) return null;
  if (score.verified === "verified") return "VERIFIED" as const;
  if (score.verified === "unverified") return "UNDER REVIEW" as const;
  return null;
}

export { GAME_MANIFESTS };
