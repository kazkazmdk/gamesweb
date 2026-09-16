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
  share_activity: boolean;
  share_presence: boolean;
  share_public_activity: boolean;
  created_at: string;
  last_seen_at: string;
};

export type PublicProfile = {
  username: string;
  display_name: string;
  avatar: string;
  level: number;
  achievement_count: number;
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

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  username: string;
  avatar: string;
  score: number;
  verified: boolean;
  timestamp: string;
};

export type ProgressionDiff = {
  xpEarned: number;
  newLevel: number;
  newXp: number;
  achievements: string[];
  questsCompleted: string[];
};

export type GuestSnapshot = {
  xp: number;
  achievements: string[];
  scores: Array<{
    id: string;
    gameId: string;
    mode: string;
    score: number;
    at: number;
    verified: VerifiedStatus;
    metadata: Record<string, number | string | boolean>;
  }>;
  saves?: Record<string, { version: string; payload: Record<string, unknown>; updatedAt?: number }>;
  questProgress?: Record<string, number>;
  questCompleted?: string[];
  stats?: Record<string, number>;
  history?: Array<{ gameId: string; at: number; durationMs: number; score: number; result: string }>;
  username?: string;
  displayName?: string;
  avatar?: string;
  streak?: number;
};

export type AccountProgress = {
  xp: number;
  achievements: string[];
  scores: GuestSnapshot["scores"];
  saves: NonNullable<GuestSnapshot["saves"]>;
  questProgress: Record<string, number>;
  questCompleted: string[];
  stats: Record<string, number>;
  streak: number;
};
