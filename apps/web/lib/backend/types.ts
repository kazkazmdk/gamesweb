import type {
  AccountProgress,
  DeviceClass,
  FriendshipStatus,
  LeaderboardEntry,
  PresenceStatus,
  ProgressionDiff,
  VerifiedStatus,
} from "@gamesweb/database";
import type { Identity } from "@/lib/api/identity";

export type OfflineRun = {
  gameId: string;
  mode: string;
  score: number;
  durationMs: number;
  startedAt: number;
  endedAt: number;
  metadata: Record<string, number | string | boolean>;
  localSessionId?: string;
  gameVersion?: string;
};

export type StoredSession = {
  id: string;
  userId: string | null;
  anonymousId: string | null;
  gameId: string;
  gameVersion: string;
  device: DeviceClass;
  startedAt: number;
  endedAt: number | null;
  durationMs: number | null;
  score: number | null;
  result: string | null;
  metadata: Record<string, unknown>;
};

export type StoredScore = {
  id: string;
  sessionId: string | null;
  userId: string | null;
  anonymousId: string | null;
  gameId: string;
  mode: string;
  score: number;
  metadata: Record<string, number | string | boolean>;
  createdAt: number;
  verified: VerifiedStatus;
  offlineSubmission?: boolean;
  localSessionId?: string;
};

export type StoredProfile = {
  userId: string;
  anonymousId: string | null;
  username: string;
  displayName: string;
  avatar: string;
  xp: number;
  streak: number;
  isGuest: boolean;
  shareActivity: boolean;
  sharePresence: boolean;
  sharePublicActivity: boolean;
  achievements: string[];
  questProgress: Record<string, number>;
  questCompleted: string[];
  stats: Record<string, number>;
  pbCount: number;
  uniqueGamesToday: string[];
  gamesPlayedToday: number;
  dayKey: string;
  playedGameIds: string[];
  achievementUnlocks: Record<string, number>;
};

export type StoredFriend = {
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: number;
};

export type StoredPresence = {
  userId: string;
  status: PresenceStatus;
  gameId: string | null;
  updatedAt: number;
};

export type StoredSave = {
  userId: string;
  gameId: string;
  version: string;
  payload: Record<string, unknown>;
  updatedAt: number;
};

export type ScoreWriteResult = {
  score: StoredScore;
  progression: ProgressionDiff;
  alreadyApplied: boolean;
};

export type SubmitScoreInput = {
  identity: Identity;
  session: StoredSession | null;
  gameId?: string;
  mode: string;
  score: number;
  durationMs: number;
  result?: string;
  metadata: Record<string, number | string | boolean>;
  verified: VerifiedStatus;
  offline?: boolean;
  flagReasons?: string[];
  gameVersion?: string;
  buildSha?: string;
  clientStartedAt?: number;
  clientEndedAt?: number;
  localSessionId?: string;
};

export type BackendStore = {
  kind: "memory" | "supabase";
  startSession(input: {
    identity: Identity;
    gameId: string;
    gameVersion: string;
    device: DeviceClass;
    buildSha?: string;
    appVersion?: string;
  }): Promise<StoredSession>;
  getSession(id: string): Promise<StoredSession | null>;
  submitScore(input: SubmitScoreInput): Promise<ScoreWriteResult>;
  leaderboard(gameId: string, mode: string, limit: number): Promise<LeaderboardEntry[]>;
  personalRank(identity: Identity, gameId: string, mode: string): Promise<number | null>;
  upsertPresence(identity: Identity, status: PresenceStatus, gameId: string | null): Promise<void>;
  listPresence(identity: Identity): Promise<Array<StoredPresence & { username: string; displayName: string; avatar: string }>>;
  getGuestProgress(anonymousId: string): Promise<StoredProfile>;
  sendFriendRequest(identity: Identity, username: string): Promise<{ ok: true } | { error: string }>;
  friendAction(
    identity: Identity,
    userId: string,
    action: "accept" | "decline" | "remove" | "block" | "unblock",
  ): Promise<{ ok: true } | { error: string }>;
  listFriends(identity: Identity): Promise<
    Array<{
      userId: string;
      username: string;
      displayName: string;
      avatar: string;
      status: "pending-out" | "pending-in" | "accepted" | "blocked";
      presence: PresenceStatus;
      gameId?: string;
    }>
  >;
  searchUsers(identity: Identity, q: string): Promise<Array<{ username: string; displayName: string; avatar: string }>>;
  getSave(identity: Identity, gameId: string): Promise<StoredSave | null>;
  putSave(identity: Identity, save: Omit<StoredSave, "userId"> & { userId?: string }): Promise<StoredSave | { error: string }>;
  getOrCreateProfile(identity: Identity): Promise<StoredProfile>;
  updateProfile(identity: Identity, patch: Partial<Pick<StoredProfile, "username" | "displayName" | "avatar" | "shareActivity" | "sharePresence" | "sharePublicActivity">>): Promise<StoredProfile | { error: string }>;
  mergeGuest(identity: Identity, input?: { offlineRuns?: OfflineRun[] }): Promise<{ ok: true; profile: StoredProfile; alreadyMerged: boolean } | { error: string }>;
  getIdempotency(scope: string, key: string): Promise<{ status: number; response: unknown } | null>;
  putIdempotency(scope: string, key: string, endpoint: string, status: number, response: unknown, identity: Identity): Promise<void>;
  accountProgress(userId: string): Promise<AccountProgress>;
  getPublicProfile(username: string): Promise<PublicPlayerPayload | null>;
};

export type PublicPlayerPayload = {
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  favoriteGameId: string | null;
  records: Array<{ gameId: string; mode: string; score: number }>;
  achievements: string[];
  activity: Array<{ gameId: string; event: string; score: number; at: number }> | null;
};
