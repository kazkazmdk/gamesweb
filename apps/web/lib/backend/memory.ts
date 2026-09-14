import { levelFromXp } from "@gamesweb/config";
import {
  computeRunRewards,
  lowerIsBetter,
  mergeGuestIntoAccount,
  PRESENCE_STALE_MS,
  type GuestSnapshot,
  type LeaderboardEntry,
  type VerifiedStatus,
} from "@gamesweb/database";
import { utcDayKey } from "@gamesweb/game-sdk";
import type { Identity } from "@/lib/api/identity";
import type {
  BackendStore,
  ScoreWriteResult,
  StoredFriend,
  StoredPresence,
  StoredProfile,
  StoredSave,
  StoredScore,
  StoredSession,
} from "@/lib/backend/types";

function utcDaySafeLocal(ms = Date.now()) {
  return new Date(ms).toISOString().slice(0, 10);
}

type G = typeof globalThis & { __gw_memory?: MemoryBackend };

export class MemoryBackend implements BackendStore {
  kind = "memory" as const;
  sessions = new Map<string, StoredSession>();
  scores = new Map<string, StoredScore>();
  profiles = new Map<string, StoredProfile>();
  friends: StoredFriend[] = [];
  presence = new Map<string, StoredPresence>();
  saves = new Map<string, StoredSave>();
  migrations = new Map<string, string>();
  idempotency = new Map<string, { status: number; response: unknown }>();
  usernameIndex = new Map<string, string>();

  async startSession(input: {
    identity: Identity;
    gameId: string;
    gameVersion: string;
    device: StoredSession["device"];
  }): Promise<StoredSession> {
    const row: StoredSession = {
      id: crypto.randomUUID(),
      userId: input.identity.userId,
      anonymousId: input.identity.anonymousId,
      gameId: input.gameId,
      gameVersion: input.gameVersion,
      device: input.device,
      startedAt: Date.now(),
      endedAt: null,
      durationMs: null,
      score: null,
      result: null,
      metadata: {},
    };
    this.sessions.set(row.id, row);
    return row;
  }

  async getSession(id: string) {
    return this.sessions.get(id) ?? null;
  }

  private profileKey(identity: Identity) {
    return identity.userId ?? `guest:${identity.anonymousId}`;
  }

  async getOrCreateProfile(identity: Identity): Promise<StoredProfile> {
    const key = this.profileKey(identity);
    const existing = this.profiles.get(key);
    if (existing) return existing;
    const username = identity.userId
      ? `player_${identity.userId.replace(/-/g, "").slice(0, 8)}`
      : `guest_${identity.anonymousId.replace(/-/g, "").slice(0, 6)}`;
    const row: StoredProfile = {
      userId: key,
      anonymousId: identity.anonymousId,
      username,
      displayName: "Player",
      avatar: "orb-0",
      xp: 0,
      streak: 1,
      isGuest: !identity.userId,
      shareActivity: true,
      achievements: [],
      questProgress: {},
      questCompleted: [],
      stats: {},
      pbCount: 0,
      uniqueGamesToday: [],
      gamesPlayedToday: 0,
      dayKey: utcDayKey(),
      playedGameIds: [],
    };
    this.profiles.set(key, row);
    this.usernameIndex.set(username.toLowerCase(), key);
    return row;
  }

  async submitScore(input: {
    identity: Identity;
    session: StoredSession;
    mode: string;
    score: number;
    durationMs: number;
    result?: string;
    metadata: Record<string, number | string | boolean>;
    verified: VerifiedStatus;
    offline?: boolean;
  }): Promise<ScoreWriteResult> {
    const existing = [...this.scores.values()].find((s) => s.sessionId === input.session.id);
    if (existing) {
      const profile = await this.getOrCreateProfile(input.identity);
      return {
        score: existing,
        alreadyApplied: true,
        progression: {
          xpEarned: 0,
          newLevel: levelFromXp(profile.xp).level,
          newXp: profile.xp,
          achievements: [],
          questsCompleted: [],
        },
      };
    }

    const profile = await this.getOrCreateProfile(input.identity);
    this.rollDay(profile);
    const lower = lowerIsBetter(input.session.gameId);
    const prevScores = [...this.scores.values()].filter(
      (s) => s.gameId === input.session.gameId && s.mode === input.mode && (s.userId === profile.userId || s.anonymousId === input.identity.anonymousId),
    );
    const pbBefore = prevScores.length
      ? lower
        ? Math.min(...prevScores.map((s) => s.score))
        : Math.max(...prevScores.map((s) => s.score))
      : lower
        ? Number.POSITIVE_INFINITY
        : 0;

    const rewards = computeRunRewards({
      gameId: input.session.gameId,
      mode: input.mode,
      score: input.score,
      durationMs: input.durationMs,
      result: input.result ?? "finish",
      metadata: input.metadata,
      verified: input.verified,
      existingAchievements: profile.achievements,
      existingXp: profile.xp,
      gamesPlayedToday: profile.gamesPlayedToday,
      uniqueGamesToday: profile.uniqueGamesToday,
      playedGameIds: profile.playedGameIds,
      pbBefore,
      pbCount: profile.pbCount,
      dayKey: profile.dayKey,
      hourUtc: new Date().getUTCHours(),
      questProgress: profile.questProgress,
      questCompleted: profile.questCompleted,
    });

    profile.xp = rewards.newXp;
    profile.achievements = [...new Set([...profile.achievements, ...rewards.achievements])];
    profile.questProgress = rewards.questProgress;
    profile.questCompleted = [...new Set([...profile.questCompleted, ...rewards.questsCompleted])];
    profile.gamesPlayedToday += 1;
    if (!profile.uniqueGamesToday.includes(input.session.gameId)) {
      profile.uniqueGamesToday.push(input.session.gameId);
    }
    if (!profile.playedGameIds.includes(input.session.gameId)) profile.playedGameIds.push(input.session.gameId);
    if (rewards.pbImproved) profile.pbCount += 1;

    const score: StoredScore = {
      id: crypto.randomUUID(),
      sessionId: input.session.id,
      userId: input.identity.userId,
      anonymousId: input.identity.anonymousId,
      gameId: input.session.gameId,
      mode: input.mode,
      score: input.score,
      metadata: input.metadata,
      createdAt: Date.now(),
      verified: input.verified,
    };
    this.scores.set(score.id, score);

    input.session.endedAt = Date.now();
    input.session.durationMs = input.durationMs;
    input.session.score = input.score;
    input.session.result = input.result ?? "finish";
    this.sessions.set(input.session.id, input.session);

    return {
      score,
      alreadyApplied: false,
      progression: {
        xpEarned: rewards.xpEarned,
        newLevel: rewards.newLevel,
        newXp: rewards.newXp,
        achievements: rewards.achievements,
        questsCompleted: rewards.questsCompleted,
      },
    };
  }

  private rollDay(profile: StoredProfile) {
    const day = utcDaySafeLocal();
    if (profile.dayKey === day) return;
    profile.dayKey = day;
    profile.uniqueGamesToday = [];
    profile.gamesPlayedToday = 0;
  }

  async leaderboard(gameId: string, mode: string, limit: number): Promise<LeaderboardEntry[]> {
    const lower = lowerIsBetter(gameId);
    const rows = [...this.scores.values()].filter(
      (s) => s.gameId === gameId && s.mode === mode && s.verified === "verified" && s.userId,
    );
    const best = new Map<string, StoredScore>();
    for (const row of rows) {
      const key = row.userId!;
      const cur = best.get(key);
      if (!cur || (lower ? row.score < cur.score : row.score > cur.score)) best.set(key, row);
    }
    const ranked = [...best.entries()]
      .map(([, row]) => row)
      .sort((a, b) => (lower ? a.score - b.score : b.score - a.score))
      .slice(0, limit);
    return ranked.map((row, i) => {
      const profile = this.profiles.get(row.userId ?? "") ?? this.profiles.get(`guest:${row.anonymousId}`);
      return {
        rank: i + 1,
        displayName: profile?.displayName ?? "Player",
        username: profile?.username ?? "player",
        avatar: profile?.avatar ?? "orb-0",
        score: row.score,
        verified: true,
        timestamp: new Date(row.createdAt).toISOString(),
      };
    });
  }

  async personalRank(identity: Identity, gameId: string, mode: string) {
    const board = await this.leaderboard(gameId, mode, 100);
    const profile = await this.getOrCreateProfile(identity);
    const hit = board.find((r) => r.username === profile.username);
    return hit?.rank ?? null;
  }

  async upsertPresence(identity: Identity, status: StoredPresence["status"], gameId: string | null) {
    const profile = await this.getOrCreateProfile(identity);
    this.presence.set(profile.userId, {
      userId: profile.userId,
      status,
      gameId,
      updatedAt: Date.now(),
    });
  }

  async listPresence(identity: Identity) {
    const friends = await this.listFriends(identity);
    const accepted = new Set(friends.filter((f) => f.status === "accepted").map((f) => f.userId));
    const out = [];
    for (const row of this.presence.values()) {
      if (!accepted.has(row.userId)) continue;
      const profile = this.profiles.get(row.userId);
      if (!profile?.shareActivity) continue;
      const stale = Date.now() - row.updatedAt > PRESENCE_STALE_MS;
      out.push({
        ...row,
        status: stale ? ("offline" as const) : row.status,
        username: profile.username,
        displayName: profile.displayName,
        avatar: profile.avatar,
      });
    }
    return out;
  }

  async sendFriendRequest(identity: Identity, username: string) {
    const me = await this.getOrCreateProfile(identity);
    if (!identity.userId) return { error: "auth_required" };
    const otherId = this.usernameIndex.get(username.toLowerCase());
    if (!otherId) return { error: "not_found" };
    if (otherId === me.userId) return { error: "self" };
    const blocked = this.friends.some(
      (f) =>
        f.status === "blocked" &&
        ((f.requesterId === me.userId && f.addresseeId === otherId) ||
          (f.addresseeId === me.userId && f.requesterId === otherId)),
    );
    if (blocked) return { error: "blocked" };
    const existing = this.friends.find(
      (f) =>
        (f.requesterId === me.userId && f.addresseeId === otherId) ||
        (f.requesterId === otherId && f.addresseeId === me.userId),
    );
    if (existing) return { error: "duplicate" };
    this.friends.push({
      requesterId: me.userId,
      addresseeId: otherId,
      status: "pending",
      createdAt: Date.now(),
    });
    return { ok: true as const };
  }

  async friendAction(identity: Identity, userId: string, action: "accept" | "decline" | "remove" | "block") {
    const me = await this.getOrCreateProfile(identity);
    if (action === "block") {
      this.friends = this.friends.filter(
        (f) => !(f.requesterId === me.userId && f.addresseeId === userId) && !(f.requesterId === userId && f.addresseeId === me.userId),
      );
      this.friends.push({ requesterId: me.userId, addresseeId: userId, status: "blocked", createdAt: Date.now() });
      return { ok: true as const };
    }
    const row = this.friends.find(
      (f) =>
        (f.requesterId === me.userId && f.addresseeId === userId) ||
        (f.requesterId === userId && f.addresseeId === me.userId),
    );
    if (!row) return { error: "not_found" };
    if (action === "accept") {
      if (row.addresseeId !== me.userId) return { error: "forbidden" };
      row.status = "accepted";
      return { ok: true as const };
    }
    if (action === "decline" || action === "remove") {
      this.friends = this.friends.filter((f) => f !== row);
      return { ok: true as const };
    }
    return { error: "invalid" };
  }

  async listFriends(identity: Identity) {
    const me = await this.getOrCreateProfile(identity);
    const rows = this.friends.filter((f) => f.requesterId === me.userId || f.addresseeId === me.userId);
    return rows
      .filter((f) => f.status !== "blocked" || f.requesterId === me.userId)
      .map((f) => {
        const otherId = f.requesterId === me.userId ? f.addresseeId : f.requesterId;
        const other = this.profiles.get(otherId);
        const presence = this.presence.get(otherId);
        const stale = !presence || Date.now() - presence.updatedAt > PRESENCE_STALE_MS;
        const status =
          f.status === "blocked"
            ? ("blocked" as const)
            : f.status === "accepted"
              ? ("accepted" as const)
              : f.requesterId === me.userId
                ? ("pending-out" as const)
                : ("pending-in" as const);
        return {
          userId: otherId,
          username: other?.username ?? "player",
          displayName: other?.displayName ?? "Player",
          avatar: other?.avatar ?? "orb-0",
          status,
          presence: (stale ? "offline" : presence?.status) ?? "offline",
          gameId: stale || !other?.shareActivity ? undefined : (presence?.gameId ?? undefined),
        };
      });
  }

  async searchUsers(identity: Identity, q: string) {
    const me = await this.getOrCreateProfile(identity);
    const n = q.toLowerCase();
    return [...this.profiles.values()]
      .filter((p) => p.userId !== me.userId && p.username.toLowerCase().includes(n) && !p.isGuest)
      .slice(0, 8)
      .map((p) => ({ username: p.username, displayName: p.displayName, avatar: p.avatar }));
  }

  async getSave(identity: Identity, gameId: string) {
    const me = await this.getOrCreateProfile(identity);
    return this.saves.get(`${me.userId}:${gameId}`) ?? null;
  }

  async putSave(identity: Identity, save: Omit<StoredSave, "userId"> & { userId?: string }) {
    const me = await this.getOrCreateProfile(identity);
    if (me.isGuest) return { error: "auth_required" };
    const row: StoredSave = {
      userId: me.userId,
      gameId: save.gameId,
      version: save.version,
      payload: save.payload,
      updatedAt: save.updatedAt ?? Date.now(),
    };
    const current = this.saves.get(`${me.userId}:${save.gameId}`);
    if (current && current.updatedAt > row.updatedAt) return current;
    this.saves.set(`${me.userId}:${save.gameId}`, row);
    return row;
  }

  async updateProfile(identity: Identity, patch: Partial<Pick<StoredProfile, "username" | "displayName" | "avatar" | "shareActivity">>) {
    const me = await this.getOrCreateProfile(identity);
    if (patch.username) {
      const taken = this.usernameIndex.get(patch.username.toLowerCase());
      if (taken && taken !== me.userId) return { error: "username_taken" };
      this.usernameIndex.delete(me.username.toLowerCase());
      me.username = patch.username;
      this.usernameIndex.set(me.username.toLowerCase(), me.userId);
    }
    if (patch.displayName) me.displayName = patch.displayName;
    if (patch.avatar) me.avatar = patch.avatar;
    if (typeof patch.shareActivity === "boolean") me.shareActivity = patch.shareActivity;
    return me;
  }

  async mergeGuest(identity: Identity, anonymousId: string, snapshot: GuestSnapshot) {
    if (!identity.userId) return { error: "auth_required" };
    if (this.migrations.has(anonymousId)) {
      return { ok: true as const, alreadyMerged: true, profile: await this.getOrCreateProfile(identity) };
    }
    const profile = await this.getOrCreateProfile(identity);
    const guestKey = `guest:${anonymousId}`;
    const guestProfile = this.profiles.get(guestKey);
    const merged = mergeGuestIntoAccount(
      {
        xp: profile.xp,
        achievements: profile.achievements,
        scores: [...this.scores.values()]
          .filter((s) => s.userId === identity.userId)
          .map((s) => ({
            id: s.id,
            gameId: s.gameId,
            mode: s.mode,
            score: s.score,
            at: s.createdAt,
            verified: s.verified,
            metadata: s.metadata,
          })),
        saves: Object.fromEntries(
          [...this.saves.values()]
            .filter((s) => s.userId === profile.userId)
            .map((s) => [s.gameId, { version: s.version, payload: s.payload, updatedAt: s.updatedAt }]),
        ),
        questProgress: profile.questProgress,
        questCompleted: profile.questCompleted,
        stats: profile.stats,
        streak: profile.streak,
      },
      snapshot,
    );
    profile.xp = merged.xp;
    profile.achievements = merged.achievements;
    profile.questProgress = merged.questProgress;
    profile.questCompleted = merged.questCompleted;
    profile.stats = merged.stats;
    profile.streak = merged.streak;
    profile.isGuest = false;
    profile.anonymousId = anonymousId;

    for (const row of merged.scores) {
      if ([...this.scores.values()].some((s) => s.id === row.id)) continue;
      this.scores.set(row.id, {
        id: row.id,
        sessionId: crypto.randomUUID(),
        userId: identity.userId,
        anonymousId,
        gameId: row.gameId,
        mode: row.mode,
        score: row.score,
        metadata: row.metadata,
        createdAt: row.at,
        verified: row.verified === "verified" ? "unverified" : row.verified,
      });
    }
    for (const [gameId, save] of Object.entries(merged.saves)) {
      this.saves.set(`${profile.userId}:${gameId}`, {
        userId: profile.userId,
        gameId,
        version: save.version,
        payload: save.payload,
        updatedAt: save.updatedAt ?? Date.now(),
      });
    }
    if (guestProfile) this.profiles.delete(guestKey);
    this.migrations.set(anonymousId, identity.userId);
    return { ok: true as const, alreadyMerged: false, profile };
  }

  async getIdempotency(key: string) {
    return this.idempotency.get(key) ?? null;
  }

  async putIdempotency(key: string, status: number, response: unknown) {
    this.idempotency.set(key, { status, response });
  }

  async accountProgress(userId: string) {
    const profile = this.profiles.get(userId);
    return {
      xp: profile?.xp ?? 0,
      achievements: profile?.achievements ?? [],
      scores: [...this.scores.values()]
        .filter((s) => s.userId === userId)
        .map((s) => ({
          id: s.id,
          gameId: s.gameId,
          mode: s.mode,
          score: s.score,
          at: s.createdAt,
          verified: s.verified,
          metadata: s.metadata,
        })),
      saves: Object.fromEntries(
        [...this.saves.values()]
          .filter((s) => s.userId === userId)
          .map((s) => [s.gameId, { version: s.version, payload: s.payload, updatedAt: s.updatedAt }]),
      ),
      questProgress: profile?.questProgress ?? {},
      questCompleted: profile?.questCompleted ?? [],
      stats: profile?.stats ?? {},
      streak: profile?.streak ?? 0,
    };
  }
}

export function memoryStore(): MemoryBackend {
  const g = globalThis as G;
  if (!g.__gw_memory) g.__gw_memory = new MemoryBackend();
  return g.__gw_memory;
}

export function resetMemoryStore() {
  const g = globalThis as G;
  g.__gw_memory = new MemoryBackend();
  return g.__gw_memory;
}
