export type { Json, DeviceClass, VerifiedStatus, FriendshipStatus, PresenceStatus, ProfileRow, PublicProfile, GameSessionRow, ScoreRow, LeaderboardEntry, ProgressionDiff, GuestSnapshot, AccountProgress } from "./types";
export { validateScore, type ScorePayload, type ScoreValidation } from "./validate-score";
export { mergeGuestIntoAccount, achievementXp } from "./merge";
export { computeRunRewards, isPersonalBest, type RunContext } from "./rewards";
export {
  assertSessionOwnership,
  idempotencyScope,
  reconstructAchievementsFromScores,
  achievementId,
  type IdentityRef,
  type ScoreLike,
} from "./ownership";
export {
  GAME_IDS,
  GAME_MODES,
  VELOCITY_MEDALS,
  PRESENCE_STALE_MS,
  MAX_SAVE_BYTES,
  defaultMode,
  lowerIsBetter,
  medalForTime,
  isGameId,
} from "./constants";
export {
  StartSessionSchema,
  SubmitScoreSchema,
  PresenceSchema,
  FriendRequestSchema,
  FriendActionSchema,
  ProfileUpdateSchema,
  GuestMergeSchema,
  AuthMagicLinkSchema,
  GameSaveSchema,
  UsernameSearchSchema,
  LeaderboardQuerySchema,
  ScoreMetadataSchema,
  assertMode,
  boundedJsonSize,
} from "./schemas";

export function isSupabaseConfigured(): boolean {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const url = env?.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && publishable);
}

export function supabasePublishableKey(env: Record<string, string | undefined> = process.env): string | undefined {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function supabaseSecretKey(env: Record<string, string | undefined> = process.env): string | undefined {
  return env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
}
