export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type DeviceClass = "desktop" | "laptop" | "tablet" | "mobile";

export type VerifiedStatus = "verified" | "unverified" | "flagged";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export type PresenceStatus = "online" | "away" | "playing" | "offline";

export type ProfileRow = {
  user_id: string;
  anonymous_id: string | null;
  username: string;
  display_name: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  is_guest: boolean;
  is_seed: boolean;
  created_at: string;
  last_seen_at: string;
};

export type GameRow = {
  id: string;
  slug: string;
  title: string;
  status: "live" | "hidden";
  manifest: Json;
  created_at: string;
};

export type GameSessionRow = {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  game_id: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  device: DeviceClass;
  score: number | null;
  result: string | null;
  game_version: string;
  metadata: Json;
};

export type ScoreRow = {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  game_id: string;
  mode: string;
  score: number;
  metadata: Json;
  created_at: string;
  verified_status: VerifiedStatus;
  session_id: string | null;
};

export type AchievementRow = {
  id: string;
  game_id: string | null;
  key: string;
  name: string;
  description: string;
  xp_reward: number;
};

export type PlayerAchievementRow = {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
};

export type QuestRow = {
  id: string;
  type: "daily" | "weekly" | "platform";
  game_id: string | null;
  requirements: Json;
  reward: Json;
  starts_at: string;
  ends_at: string;
};

export type QuestProgressRow = {
  quest_id: string;
  user_id: string;
  progress: number;
  completed_at: string | null;
};

export type FriendshipRow = {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

export type PresenceRow = {
  user_id: string;
  game_id: string | null;
  status: PresenceStatus;
  updated_at: string;
  room_id: string | null;
};

export type GameSaveRow = {
  user_id: string;
  game_id: string;
  version: string;
  payload: Json;
  updated_at: string;
};

export type CosmeticRow = {
  id: string;
  type: string;
  rarity: string;
  metadata: Json;
};

export type PlayerCosmeticRow = {
  user_id: string;
  cosmetic_id: string;
  unlocked_at: string;
};

export type PlayerStatRow = {
  user_id: string;
  game_id: string;
  stat_key: string;
  value: number;
};

export type ScorePayload = {
  sessionId: string;
  gameId: string;
  gameVersion: string;
  mode: string;
  score: number;
  durationMs: number;
  startedAt: number;
  endedAt: number;
  metadata: Record<string, number | string | boolean>;
};

export type ScoreValidation = {
  status: VerifiedStatus;
  reasons: string[];
};

export function validateScore(payload: ScorePayload): ScoreValidation {
  const reasons: string[] = [];
  const durationSec = payload.durationMs / 1000;
  const clockSkew = Math.abs(payload.endedAt - payload.startedAt - payload.durationMs);

  if (payload.durationMs < 800) reasons.push("duration_too_short");
  if (payload.durationMs > 20 * 60 * 1000) reasons.push("duration_too_long");
  if (clockSkew > 5000) reasons.push("timestamp_mismatch");
  if (!Number.isFinite(payload.score)) reasons.push("score_nan");

  if (payload.gameId === "neon-drift") {
    if (payload.score < 0 || payload.score > 5_000_000) reasons.push("score_out_of_range");
    const maxPlausible = Math.max(8000, durationSec * 4200);
    if (payload.score > maxPlausible) reasons.push("score_exceeds_pace");
    if (payload.score > 80_000 && durationSec < 18) reasons.push("high_score_fast_run");
  }

  if (payload.gameId === "velocity-run") {
    if (payload.score < 6_000 || payload.score > 180_000) reasons.push("time_out_of_range");
    if (payload.durationMs + 400 < payload.score) reasons.push("timer_desync");
  }

  if (payload.gameId === "swarm-protocol") {
    if (payload.score < 0 || payload.score > 1_000_000) reasons.push("score_out_of_range");
    const kills = Number(payload.metadata.kills ?? 0);
    if (kills > durationSec * 8 + 20) reasons.push("kill_pace_impossible");
    if (payload.score > 200_000 && durationSec < 40) reasons.push("high_score_fast_run");
  }

  if (reasons.includes("score_nan") || reasons.includes("score_out_of_range")) {
    return { status: "flagged", reasons };
  }
  if (reasons.length >= 2) return { status: "flagged", reasons };
  if (reasons.length === 1) return { status: "unverified", reasons };
  return { status: "verified", reasons };
}

export function isSupabaseConfigured(): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return Boolean(env?.NEXT_PUBLIC_SUPABASE_URL && env?.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
