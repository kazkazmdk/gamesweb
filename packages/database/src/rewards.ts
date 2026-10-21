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

  const stats = ctx.metadata ?? {};
  const allGames = new Set([...(ctx.playedGameIds ?? []), ctx.gameId]);
  const todayGames = new Set([...(ctx.uniqueGamesToday ?? []), ctx.gameId]);

  unlock("platform:first-run");
  if (ctx.hourUtc < 5) unlock("platform:night-shift");
  if (allGames.size >= 3) unlock("platform:three-worlds");
  if (allGames.size >= 5) unlock("platform:arcade-tourist");
  if (allGames.size >= 8) unlock("platform:world-tour");
  if (todayGames.size >= 3) unlock("platform:on-fire");
  if (
    (allGames.size >= 3 && Number(ctx.gamesPlayedToday ?? 0) >= 6) ||
    Number(stats.totalRuns ?? 0) >= 9
  ) {
    unlock("platform:explorer");
  }
  if (pbImproved) unlock("platform:untouchable");
  if (Number(ctx.pbCount ?? 0) + (pbImproved ? 1 : 0) >= 4) unlock("platform:all-rounder");

  if (ctx.gameId === "neon-drift") {
    if (Number(stats.maxCombo ?? stats.combo ?? 0) >= 2 || ctx.score >= 1200) {
      unlock("neon-drift:first-slide");
    }
    if (ctx.score >= 25_000) unlock("neon-drift:score-25k");
    if (ctx.score >= 60_000) unlock("neon-drift:score-60k");
    if (Number(stats.laps ?? 0) >= 2) unlock("neon-drift:two-laps");
    if (Number(stats.maxCombo ?? stats.combo ?? 0) >= 5) unlock("neon-drift:combo-5");
    if (Number(stats.nearMisses ?? 0) >= 5) unlock("neon-drift:near-miss");
    if (Number(stats.boostGates ?? 0) >= 8) unlock("neon-drift:boost-gate");
    if (Number(stats.laps ?? 0) >= 1 && Number(stats.wallHits ?? 0) === 0) {
      unlock("neon-drift:no-crash-lap");
    }
    if (ctx.mode === "daily" && ctx.result === "finish") unlock("neon-drift:daily-drift");
  }

  if (ctx.gameId === "velocity-run") {
    unlock("velocity-run:first-finish");
    const medal = medalForTime(ctx.mode, ctx.score);
    if (medal) unlock("velocity-run:bronze");
    if (medal === "gold" || medal === "platinum") unlock("velocity-run:gold");
    if (medal === "platinum") unlock("velocity-run:platinum");
    if (Number(stats.deaths ?? 1) === 0) unlock("velocity-run:no-death");
    if (ctx.mode === "course-1" && ctx.score < 40000) unlock("velocity-run:sub-40");
    if (Number(stats.fastFalls ?? 0) >= 12) unlock("velocity-run:fast-fall");
    if (pbImproved && Number(ctx.pbBefore ?? Infinity) < Infinity && Number(ctx.pbBefore ?? 0) > 0) {
      unlock("velocity-run:pb-twice");
    }
  }

  if (ctx.gameId === "swarm-protocol") {
    const kills = Number(stats.kills ?? 0);
    const survive = Number(stats.surviveMs ?? ctx.durationMs);
    const level = Number(stats.level ?? 1);
    if (kills >= 10) unlock("swarm-protocol:first-blood");
    if (survive >= 120000) unlock("swarm-protocol:survive-2");
    if (survive >= 300000) unlock("swarm-protocol:survive-5");
    if (level >= 8) unlock("swarm-protocol:level-8");
    if (kills >= 200) unlock("swarm-protocol:kills-200");
    if (Number(stats.elites ?? 0) >= 1) unlock("swarm-protocol:elite");
    if (Number(stats.splitters ?? 0) >= 25) unlock("swarm-protocol:splitter");
    if (Number(stats.dashKills ?? 0) >= 15) unlock("swarm-protocol:dash-kill");
    if (Boolean(stats.shieldBroken)) unlock("swarm-protocol:shield");
    if (Number(stats.chainLevel ?? 0) >= 3) unlock("swarm-protocol:chain");
  }

  if (ctx.gameId === "sky-stack") {
    if (Number(stats.perfects ?? 0) >= 1) unlock("sky-stack:first-place");
    if (Number(stats.maxStreak ?? stats.streak ?? 0) >= 8) unlock("sky-stack:streak-8");
    if (Number(stats.floors ?? 0) >= 30 || ctx.score >= 3000) unlock("sky-stack:floor-30");
    if (Number(stats.floors ?? 0) >= 67 || ctx.score >= 6700) unlock("sky-stack:floor-67");
    if (Number(stats.fevers ?? 0) >= 2) unlock("sky-stack:fever-2");
  }

  if (ctx.gameId === "knockout-circuit") {
    if (ctx.result === "finish" || Number(stats.gates ?? 0) >= 1) {
      unlock("knockout-circuit:first-gate");
    }
    if (ctx.result === "finish") unlock("knockout-circuit:finish");
    if (ctx.result === "finish" && Number(stats.falls ?? stats.deaths ?? 0) === 0) {
      unlock("knockout-circuit:no-fall");
    }
    if (ctx.result === "finish" && ctx.score <= 36_000) unlock("knockout-circuit:fast");
  }

  if (ctx.gameId === "pocket-striker") {
    if (ctx.result === "finish") unlock("pocket-striker:first-pocket");
    if (ctx.result === "finish" && Boolean(stats.banked)) unlock("pocket-striker:bank");
    if (ctx.result === "finish" && ctx.score <= Number(stats.par ?? 3) - 1) {
      unlock("pocket-striker:under-par");
    }
    if (ctx.result === "finish" && ctx.score === 1) unlock("pocket-striker:perfect");
  }

  if (ctx.gameId === "territory-rush") {
    if (ctx.score >= 15) unlock("territory-rush:first-claim");
    if (ctx.score >= 50) unlock("territory-rush:half");
    if (ctx.score >= 72) unlock("territory-rush:dominate");
  }

  if (ctx.gameId === "crowd-control") {
    if (ctx.score >= 25) unlock("crowd-control:pack-gate");
    if (ctx.score >= 60) unlock("crowd-control:pack-60");
    if (ctx.score >= 120) unlock("crowd-control:pack-120");
    if (ctx.result === "finish" && Boolean(stats.bossCleared ?? true)) {
      unlock("crowd-control:win-boss");
    }
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
    else if (q.stat === "platform:pbCountToday" && pbImproved) value = Math.max(value, 1);
    else if (q.stat === "neon-drift:score" && ctx.gameId === "neon-drift") value = Math.max(value, ctx.score);
    else if (q.stat === "neon-drift:maxCombo" && ctx.gameId === "neon-drift") {
      value = Math.max(value, Number(stats.maxCombo ?? stats.combo ?? 0));
    } else if (q.stat === "swarm-protocol:surviveMs" && ctx.gameId === "swarm-protocol") {
      value = Math.max(value, Number(stats.surviveMs ?? ctx.durationMs));
    } else if (q.stat === "swarm-protocol:kills" && ctx.gameId === "swarm-protocol") {
      value = Math.max(value, Number(stats.kills ?? 0));
    } else if (q.stat === "velocity-run:gold" && ctx.gameId === "velocity-run") {
      const medal = medalForTime(ctx.mode, ctx.score);
      if (medal === "gold" || medal === "platinum") value = 1;
    } else if (q.stat === "velocity-run:course-1-under" && ctx.mode === "course-1" && ctx.score < 65000) {
      value = 65000;
    } else if (q.stat === "sky-stack:floors" && ctx.gameId === "sky-stack") {
      const fl = Number(stats.floors ?? Math.floor(ctx.score / 100));
      value = value + Math.max(0, fl - value);
    } else if (q.stat === "knockout-circuit:finish" && ctx.gameId === "knockout-circuit" && ctx.result === "finish") {
      value = value + 1;
    } else if (
      q.stat === "pocket-striker:strokes-under" &&
      ctx.gameId === "pocket-striker" &&
      ctx.result === "finish" &&
      ctx.score <= Number(stats.par ?? 3)
    ) {
      value = Math.max(value + 1, q.target);
    } else if (q.stat === "territory-rush:pct" && ctx.gameId === "territory-rush") {
      value = value + Math.max(0, ctx.score - value);
    } else if (q.stat === "crowd-control:pack" && ctx.gameId === "crowd-control") {
      value = value + Math.max(0, ctx.score - value);
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
