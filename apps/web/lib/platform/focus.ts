import { allAchievements, GAME_MANIFESTS, getManifest, type GameManifest } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import {
  achievementProgress,
  activityFromHistory,
  challengeViewModel,
  dailySummary,
  friendOnBoard,
  gameRecordFor,
  latestUnlocks,
  type BoardRow,
} from "./adapters";
import { boardModeFromPlayIndex, boardModeLabel, playModeOptions } from "./modes";
import { formatPlayScore, hasRecord } from "./format";
import type { PlayerSnapshot } from "@/lib/player-store";

export type FocusedGameContext = {
  game: GameManifest;
  playIndex: number;
  boardMode: string;
  modeLabel: string;
  pb: number;
  pbLabel: string | null;
  played: boolean;
  playLabel: "Play" | "Continue";
  daily: { label: string; current: string; target: string; done: boolean } | null;
  friendBest: { name: string; username: string; score: number; scoreLabel: string | null } | null;
    nextTrophy: { name: string; description: string } | null;
  };

export function focusedGameContext(
  player: PlayerSnapshot,
  game: GameManifest,
  playIndex: number,
  board: BoardRow[],
): FocusedGameContext {
  const boardMode = boardModeFromPlayIndex(game.id, playIndex);
  const rec = gameRecordFor(player, game.id, boardMode);
  const pb = rec.score;
  const quests = dailySummary(player).quests;
  const dailyQuest = quests.find((q) => q.gameId === game.id);
  const daily = dailyQuest ? challengeViewModel(player, dailyQuest) : null;
  const friend = friendOnBoard(board, player.friends);
  const played = player.history.some((h) => h.gameId === game.id);
  const nextTrophy =
    allAchievements().find((a) => {
      if (a.gameId !== game.id) return false;
      return !player.achievements.includes(`${a.gameId}:${a.key}`);
    }) ?? null;
  return {
    game,
    playIndex,
    boardMode,
    modeLabel: boardModeLabel(game.id, boardMode),
    pb,
    pbLabel: hasRecord(pb) ? formatPlayScore(game.id, pb) : null,
    played,
    playLabel: played ? "Continue" : "Play",
    daily: daily
      ? {
          label: daily.quest.title,
          current: daily.currentLabel,
          target: daily.targetLabel,
          done: daily.done,
        }
      : null,
    friendBest: friend
      ? {
          name: friend.name,
          username: friend.username ?? "",
          score: friend.score,
          scoreLabel: formatPlayScore(game.id, friend.score),
        }
      : null,
    nextTrophy: nextTrophy ? { name: nextTrophy.name, description: nextTrophy.description } : null,
  };
}

export function achievementCatalog(player: PlayerSnapshot) {
  return allAchievements().map((a) => {
    const gameId = a.gameId ?? "platform";
    const id = `${gameId}:${a.key}`;
    const game = a.gameId ? getManifest(a.gameId) : null;
    return {
      id,
      key: a.key,
      name: a.name,
      description: a.description,
      xp: a.xp,
      gameId,
      gameTitle: game?.title ?? "Platform",
      unlocked: player.achievements.includes(id),
      unlockedAt: player.achievementUnlocks?.[id],
      how: a.description,
    };
  });
}

export function arcadeView(player: PlayerSnapshot, now = Date.now()) {
  const lv = levelFromXp(player.xp);
  const dailies = dailySummary(player);
  const friends = player.friends.filter((f) => f.status === "accepted");
  const records = GAME_MANIFESTS.map((g) => {
    const rec = gameRecordFor(player, g.id);
    return { game: g, score: rec.score, mode: rec.mode };
  }).filter((r) => hasRecord(r.score));
  return {
    level: lv,
    challenges: dailies.quests.map((q) => challengeViewModel(player, q)),
    dailies,
    friends,
    records,
    achievements: achievementProgress(player),
    recentUnlocks: latestUnlocks(player, 3),
    activity: activityFromHistory(player.history, 8).map((item) => ({
      ...item,
      timeLabel: item.at ? item.timeLabel : null,
    })),
    now,
    playModeOptions,
  };
}

export type PublicProfileView = {
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  favoriteGameId: string | null;
  records: Array<{ gameId: string; mode: string; score: number }>;
  achievements: string[];
  activity: Array<{ gameId: string; event: string; score: number; at: number }> | null;
};
