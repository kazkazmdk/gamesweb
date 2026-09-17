import type { ChallengeType, GameManifest, RunContext } from "./types";
import { GAME_MANIFESTS, getManifest } from "./manifests";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function readRunContext(search = typeof window === "undefined" ? "" : window.location.search): RunContext {
  const q = new URLSearchParams(search.startsWith("?") || search.length === 0 ? search : `?${search}`);
  const mode = q.get("mode");
  return {
    daily: q.get("daily") === "1",
    seed: q.get("seed") ?? undefined,
    challengeCode: q.get("c") ?? q.get("challenge") ?? undefined,
    partyCode: q.get("party") ?? undefined,
    grandPrixId: q.get("gp") ?? undefined,
    endless: q.get("endless") === "1",
    modeIndex: mode && Number.isFinite(Number(mode)) ? Number(mode) : undefined,
    ghostKind: (q.get("ghost") as RunContext["ghostKind"]) ?? undefined,
  };
}

export function makePublicCode(seed = Math.random()): string {
  let n = Math.floor(seed * 1e12) ^ Date.now();
  let out = "";
  for (let i = 0; i < 5; i += 1) {
    out += CODE_ALPHABET[Math.abs(n) % CODE_ALPHABET.length];
    n = Math.imul(n, 16777619) + i * 97;
  }
  return out;
}

export type ChallengeRecord = {
  id: string;
  publicCode: string;
  gameId: string;
  mode: string;
  seed: string;
  type: ChallengeType;
  challengerId: string;
  challengerName: string;
  targetId: string | null;
  targetName: string | null;
  challengerRunId: string | null;
  challengerScore: number;
  challengerGhostId: string | null;
  challengerMeta: Record<string, number | string | boolean>;
  status: "open" | "accepted" | "completed" | "expired";
  createdAt: number;
  expiresAt: number;
  metadata: Record<string, number | string | boolean>;
  winnerId: string | null;
  targetScore: number | null;
  trust: "verified" | "unverified" | "practice";
  gameVersion: string;
  attempts: ChallengeAttempt[];
};

export type ChallengeAttempt = {
  id: string;
  challengeId: string;
  playerId: string;
  playerName: string;
  score: number;
  runId: string | null;
  trust: "verified" | "unverified" | "practice";
  createdAt: number;
  metadata: Record<string, number | string | boolean>;
};

export type ChallengeShare = Pick<
  ChallengeRecord,
  | "publicCode"
  | "gameId"
  | "mode"
  | "seed"
  | "type"
  | "challengerName"
  | "challengerScore"
  | "gameVersion"
  | "trust"
  | "expiresAt"
> & { challengerId: string };

export function encodeChallengePayload(share: ChallengeShare): string {
  const json = JSON.stringify(share);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeChallengePayload(token: string): ChallengeShare | null {
  try {
    const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - (token.length % 4));
    const raw = atob(token.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes)) as ChallengeShare;
  } catch {
    return null;
  }
}

export function challengeCompatible(game: GameManifest, type: ChallengeType) {
  return game.challengeTypes.includes(type);
}

export function defaultChallengeType(game: GameManifest): ChallengeType {
  if (game.scoreDirection === "lower") return game.challengeTypes.includes("beat-time") ? "beat-time" : "beat-score";
  if (game.id === "swarm-protocol") return "survive-seed";
  return game.challengeTypes[0] ?? "beat-score";
}

export function challengeOutcome(
  type: ChallengeType,
  challengerScore: number,
  opponentScore: number,
  lower: boolean,
): "win" | "loss" | "draw" {
  if (type === "survive-longer" || type === "survive-seed") {
    if (opponentScore === challengerScore) return "draw";
    return opponentScore > challengerScore ? "win" : "loss";
  }
  if (opponentScore === challengerScore) return "draw";
  if (lower) return opponentScore < challengerScore ? "win" : "loss";
  return opponentScore > challengerScore ? "win" : "loss";
}

export function applyChallengeAttempt(
  challenge: ChallengeRecord,
  attempt: ChallengeAttempt,
): { challenge: ChallengeRecord; duplicate: boolean; outcome: "win" | "loss" | "draw" | "pending" } {
  const existing = challenge.attempts.find((a) => a.playerId === attempt.playerId && a.id === attempt.id);
  if (existing) return { challenge, duplicate: true, outcome: "pending" };
  const already = challenge.attempts.find((a) => a.playerId === attempt.playerId);
  if (already) {
    return { challenge, duplicate: true, outcome: challenge.winnerId === attempt.playerId ? "win" : challenge.winnerId ? "loss" : "pending" };
  }
  if (attempt.trust === "practice") {
    return { challenge, duplicate: false, outcome: "pending" };
  }
  const next: ChallengeRecord = {
    ...challenge,
    attempts: [...challenge.attempts, attempt],
    status: "completed",
    targetScore: attempt.score,
    targetId: attempt.playerId,
    targetName: attempt.playerName,
  };
  const game = getManifest(challenge.gameId);
  const lower = game?.scoreDirection === "lower";
  const outcome = challengeOutcome(challenge.type, challenge.challengerScore, attempt.score, Boolean(lower));
  next.winnerId = outcome === "draw" ? null : outcome === "win" ? attempt.playerId : challenge.challengerId;
  return { challenge: next, duplicate: false, outcome };
}

const TYPICAL: Record<string, { great: number; lower: boolean }> = {
  "neon-drift": { great: 42000, lower: false },
  "velocity-run": { great: 38000, lower: true },
  "swarm-protocol": { great: 9000, lower: false },
  "sky-stack": { great: 9000, lower: false },
  "knockout-circuit": { great: 52000, lower: true },
  "pocket-striker": { great: 3, lower: true },
  "territory-rush": { great: 42000, lower: false },
  "crowd-control": { great: 18000, lower: false },
};

export function normalizePerformance(gameId: string, score: number): number {
  const spec = TYPICAL[gameId];
  if (!spec || !Number.isFinite(score) || score <= 0) return 0;
  const ratio = spec.lower ? spec.great / Math.max(1, score) : score / spec.great;
  return Math.round(Math.max(0, Math.min(1.25, ratio)) * 800);
}

export type DailyEvent = {
  gameId: string;
  mode: string;
  seed: string;
  label: string;
  index: number;
};

export function dailyArcadeEvents(dayKey: string): DailyEvent[] {
  const games = GAME_MANIFESTS.filter((g) => g.dailySupport);
  const n = [...dayKey].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const count = 3 + (n % 2);
  const out: DailyEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    const game = games[(n + i * 3) % games.length] ?? games[0];
    const mode = game.modes[i % game.modes.length] ?? game.modes[0];
    out.push({
      gameId: game.id,
      mode,
      seed: `${dayKey}:${game.id}:${mode}`,
      label: game.title,
      index: i,
    });
  }
  return out;
}

export const PARTY_POINTS = [10, 7, 5, 3, 2, 1] as const;

export const QUICK_PARTY_PLAYLIST = [
  { gameId: "sky-stack", mode: "climb" },
  { gameId: "pocket-striker", mode: "layout" },
  { gameId: "velocity-run", mode: "course-1" },
  { gameId: "knockout-circuit", mode: "map-a" },
] as const;

export const GRAND_PRIX_PLAYLIST = [
  { gameId: "sky-stack", mode: "climb" },
  { gameId: "velocity-run", mode: "course-1" },
  { gameId: "neon-drift", mode: "foundation" },
  { gameId: "pocket-striker", mode: "layout" },
  { gameId: "knockout-circuit", mode: "map-a" },
] as const;

export function roundPoints(place: number) {
  return PARTY_POINTS[place - 1] ?? 0;
}

export function rankScores<T extends { id: string; score: number }>(rows: T[], lower: boolean) {
  const sorted = [...rows].sort((a, b) => (lower ? a.score - b.score : b.score - a.score));
  return sorted.map((row, i) => ({ ...row, place: i + 1, points: roundPoints(i + 1) }));
}

export type NextAction = {
  type: string;
  label: string;
  reason: string;
  gameId?: string;
  targetId?: string;
  href: string;
};

export type NextActionInput = {
  recentRuns: Array<{ gameId: string; score: number; result: string; at: number }>;
  retries: number;
  pbImproved?: boolean;
  friendsAhead?: Array<{ name: string; gameId: string; deltaLabel: string; href?: string }>;
  openChallenge?: { code: string; gameId: string; from: string };
  daily?: { remaining: number };
  party?: { code: string; nextRound: boolean };
  gamesPlayed: string[];
  lastGameId?: string;
};

export function nextBestAction(input: NextActionInput): NextAction {
  if (input.party?.nextRound && input.party.code) {
    return {
      type: "party_next",
      label: "Next round",
      reason: "Your party is waiting",
      href: `/party/${input.party.code}`,
    };
  }
  if (input.openChallenge) {
    return {
      type: "accept_challenge",
      label: `Beat ${input.openChallenge.from}`,
      reason: "Challenge waiting",
      gameId: input.openChallenge.gameId,
      href: `/c/${input.openChallenge.code}`,
    };
  }
  if (input.daily && input.daily.remaining > 0) {
    return {
      type: "daily_event",
      label: "Next daily event",
      reason: `${input.daily.remaining} left today`,
      href: "/daily",
    };
  }
  const friend = input.friendsAhead?.[0];
  if (friend) {
    return {
      type: "beat_friend",
      label: `Beat ${friend.name}`,
      reason: friend.deltaLabel,
      gameId: friend.gameId,
      href: friend.href ?? `/play/${friend.gameId}`,
    };
  }
  if (input.pbImproved && input.lastGameId) {
    return {
      type: "retry_pb",
      label: "Retry for more",
      reason: "New personal best",
      gameId: input.lastGameId,
      href: `/play/${input.lastGameId}`,
    };
  }
  if (input.retries >= 5 && input.lastGameId) {
    const other = GAME_MANIFESTS.find((g) => g.id !== input.lastGameId);
    return {
      type: "try_another",
      label: other ? `Try ${other.title}` : "Try another game",
      reason: "Five retries, switch it up",
      gameId: other?.id,
      href: other ? `/play/${other.slug}` : "/",
    };
  }
  const last = input.lastGameId ?? input.recentRuns[0]?.gameId;
  if (last) {
    return {
      type: "challenge_friend",
      label: "Challenge a friend",
      reason: "Turn this score into a duel",
      gameId: last,
      href: `/play/${last}?challenge=new`,
    };
  }
  return { type: "play", label: "Play", reason: "Pick a game", href: "/" };
}

export type GhostKind = "pb" | "friend" | "rival" | "challenge" | "daily" | "nearby";

export type GhostRun = {
  id: string;
  gameId: string;
  mode: string;
  runId: string;
  userId: string | null;
  name: string;
  version: string;
  seed: string;
  duration: number;
  score: number;
  samplingRate: number;
  kind: GhostKind;
  data: Array<{ t: number; x: number; y: number; a?: number }>;
  createdAt: number;
};

export function ghostCompatible(localVersion: string, tapeVersion: string) {
  return localVersion.split(".")[0] === tapeVersion.split(".")[0];
}

export function downsampleGhost(samples: GhostRun["data"], max = 180) {
  if (samples.length <= max) return samples;
  const step = samples.length / max;
  const out: GhostRun["data"] = [];
  for (let i = 0; i < max; i += 1) out.push(samples[Math.min(samples.length - 1, Math.floor(i * step))]);
  return out;
}

export const LEAGUE_DIVISIONS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"] as const;

export function leagueForXp(xp: number) {
  if (xp >= 18000) return "Master";
  if (xp >= 12000) return "Diamond";
  if (xp >= 7000) return "Platinum";
  if (xp >= 3500) return "Gold";
  if (xp >= 1200) return "Silver";
  return "Bronze";
}

export const PARTY_REACTIONS = ["GG", "REMATCH", "CLOSE", "🔥", "💀", "👏"] as const;

export const CREW_REACTIONS = ["👏", "🔥", "GG"] as const;
