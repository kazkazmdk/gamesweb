import { levelFromXp, xpRewards } from "@gamesweb/config";
import { dailyQuests } from "@gamesweb/game-sdk";
import { achievementXp } from "./merge";
import { lowerIsBetter as gameLowerIsBetter, medalForTime } from "./constants";
import type { ProgressionDiff, VerifiedStatus } from "./types";

export type RunContext = {
  gameId: string;
  mode: string;
  score: number;
  durationMs: number;
  result: string;
  metadata: Record<string, number | string | boolean>;
  verified: VerifiedStatus;
  existingAchievements: string[];
  existingXp: number;
  gamesPlayedToday: number;
  uniqueGamesToday: string[];
  playedGameIds: string[];
  pbBefore: number;
  pbCount: number;
  dayKey: string;
  hourUtc: number;
  questProgress: Record<string, number>;
  questCompleted: string[];
};

export function isPersonalBest(gameId: string, score: number, pbBefore: number): boolean {
  const lower = gameLowerIsBetter(gameId);
  const hasExisting = lower ? Number.isFinite(pbBefore) && pbBefore < 1e12 : Number.isFinite(pbBefore) && pbBefore > 0;
  if (!hasExisting) return score > 0;
  return lower ? score < pbBefore : score > pbBefore;
}

export function computeRunRewards(ctx: RunContext): ProgressionDiff & {
  questProgress: Record<string, number>;
  pbImproved: boolean;
  runXp: number;
  firstPlayOfDay: boolean;
  newGameTried: boolean;
  questXp: Record<string, number>;
} {
  if (ctx.verified === "flagged") {
    const lv = levelFromXp(ctx.existingXp);
    return {
      xpEarned: 0,
      runXp: 0,
      firstPlayOfDay: false,
      newGameTried: false,
      questXp: {},
      newLevel: lv.level,
      newXp: ctx.existingXp,
      achievements: [],
      questsCompleted: [],
      questProgress: ctx.questProgress,
      pbImproved: false,
    };
  }

  const pbImproved = isPersonalBest(ctx.gameId, ctx.score, ctx.pbBefore);

  if (ctx.verified === "unverified") {
    const lv = levelFromXp(ctx.existingXp);
    return {
      xpEarned: 0,
      runXp: 0,
      firstPlayOfDay: false,
      newGameTried: false,
      questXp: {},
      newLevel: lv.level,
      newXp: ctx.existingXp,
      achievements: [],
      questsCompleted: [],
      questProgress: ctx.questProgress,
      pbImproved: false,
    };
  }

  let xp = 0;
  const unlocked: string[] = [];
  const have = new Set(ctx.existingAchievements);
  const questXp: Record<string, number> = {};

  const scale = Math.min(1, ctx.durationMs / (xpRewards.minRunSecondsForFullXp * 1000));
  const runXp = Math.round(xpRewards.runComplete * scale + (ctx.durationMs / 60000) * xpRewards.runCompletePerMinute);
  xp += runXp;

  const firstPlayOfDay = ctx.gamesPlayedToday === 0;
  if (firstPlayOfDay) xp += xpRewards.firstPlayOfDay;

  const firstThisGame = !ctx.playedGameIds.includes(ctx.gameId);
  if (firstThisGame) xp += xpRewards.newGameTried;

  if (pbImproved) xp += xpRewards.personalBest;

  function unlock(id: string) {
    if (have.has(id) || unlocked.includes(id)) return;
    unlocked.push(id);
    xp += achievementXp(id);
  }

  unlock("platform:first-run");
  if (ctx.hourUtc < 5) unlock("platform:night-shift");

  if (ctx.gameId === "neon-drift") {
    if (ctx.score >= 25000) unlock("neon-drift:score-25k");
    if (ctx.score >= 60000) unlock("neon-drift:score-60k");
    if (Number(ctx.metadata.laps ?? 0) >= 2) unlock("neon-drift:two-laps");
    if (Number(ctx.metadata.combo ?? 0) >= 5) unlock("neon-drift:combo-5");
  }

  if (ctx.gameId === "velocity-run") {
    unlock("velocity-run:first-finish");
    const medal = medalForTime(ctx.mode, ctx.score);
    if (medal) unlock("velocity-run:bronze");
    if (medal === "gold" || medal === "platinum") unlock("velocity-run:gold");
    if (medal === "platinum") unlock("velocity-run:platinum");
    if (Number(ctx.metadata.deaths ?? 1) === 0) unlock("velocity-run:no-death");
    if (ctx.mode === "course-1" && ctx.score < 40000) unlock("velocity-run:sub-40");
  }

  if (ctx.gameId === "swarm-protocol") {
    const kills = Number(ctx.metadata.kills ?? 0);
    const survive = Number(ctx.metadata.surviveMs ?? ctx.durationMs);
    const level = Number(ctx.metadata.level ?? 1);
    if (kills >= 10) unlock("swarm-protocol:first-blood");
    if (survive >= 120000) unlock("swarm-protocol:survive-2");
    if (survive >= 300000) unlock("swarm-protocol:survive-5");
    if (level >= 8) unlock("swarm-protocol:level-8");
    if (kills >= 200) unlock("swarm-protocol:kills-200");
    if (Number(ctx.metadata.elites ?? 0) >= 1) unlock("swarm-protocol:elite");
  }

  const questProgress = { ...ctx.questProgress };
  const questsCompleted: string[] = [];
  const quests = dailyQuests(ctx.dayKey);
  const uniqueToday = ctx.uniqueGamesToday.includes(ctx.gameId)
    ? ctx.uniqueGamesToday.length
    : ctx.uniqueGamesToday.length + 1;

  for (const q of quests) {
    if (ctx.questCompleted.includes(q.id)) continue;
    let value = questProgress[q.id] ?? 0;
    if (q.stat === "platform:uniqueGamesToday") value = uniqueToday;
    if (q.stat === "platform:pbCountToday" && pbImproved) value = Math.max(value, 1);
    if (q.stat === "neon-drift:score" && ctx.gameId === "neon-drift") value = Math.max(value, ctx.score);
    if (q.stat === "neon-drift:maxCombo" && ctx.gameId === "neon-drift") {
      value = Math.max(value, Number(ctx.metadata.combo ?? 0));
    }
    if (q.stat === "swarm-protocol:surviveMs" && ctx.gameId === "swarm-protocol") {
      value = Math.max(value, Number(ctx.metadata.surviveMs ?? ctx.durationMs));
    }
    if (q.stat === "swarm-protocol:kills" && ctx.gameId === "swarm-protocol") {
      value = Math.max(value, Number(ctx.metadata.kills ?? 0));
    }
    if (q.stat === "velocity-run:gold" && ctx.gameId === "velocity-run") {
      const medal = medalForTime(ctx.mode, ctx.score);
      if (medal === "gold" || medal === "platinum") value = 1;
    }
    if (q.stat === "velocity-run:course-1-under" && ctx.mode === "course-1" && ctx.score < 65000) {
      value = 65000;
    }
    questProgress[q.id] = value;
    if (value >= q.target) {
      questsCompleted.push(q.id);
      xp += q.xp;
      questXp[q.id] = q.xp;
    }
  }

  const newXp = ctx.existingXp + Math.max(0, Math.round(xp));
  const lv = levelFromXp(newXp);
  return {
    xpEarned: Math.max(0, Math.round(xp)),
    runXp,
    firstPlayOfDay,
    newGameTried: firstThisGame,
    questXp,
    newLevel: lv.level,
    newXp,
    achievements: unlocked,
    questsCompleted,
    questProgress,
    pbImproved,
  };
}
