import { levelFromXp } from "@gamesweb/config";
import {
  assertSessionOwnership,
  computeRunRewards,
  lowerIsBetter,
  mergeGuestIntoAccount,
  PRESENCE_STALE_MS,
  type LeaderboardEntry,
} from "@gamesweb/database";
import { utcDayKey } from "@gamesweb/game-sdk";
import { actorId } from "@/lib/api/actor";
import type { Identity } from "@/lib/api/identity";
import { competitiveTrust, loadCompetitiveRun } from "@/lib/backend/competitive-run";
import {
  applyRoundPoints,
  rankPartyRound,
  resolveChallengeType,
  rivalsFromChallenges,
  validateCompetitiveRunTarget,
} from "@/lib/backend/competitive-contract";
import type {
  BackendStore,
  OfflineRun,
  PublicPlayerPayload,
  ScoreWriteResult,
  StoredFriend,
  StoredInbox,
  StoredParty,
  StoredPresence,
  StoredProfile,
  StoredRival,
  StoredSave,
  StoredScore,
  StoredSession,
  SubmitScoreInput,
} from "@/lib/backend/types";
import { applyChallengeAttempt, getManifest, makePublicCode, QUICK_PARTY_PLAYLIST, type ChallengeRecord } from "@gamesweb/game-sdk";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

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
  parties = new Map<string, StoredParty>();
  challenges = new Map<string, ChallengeRecord>();
  inbox: StoredInbox[] = [];
  rivals: StoredRival[] = [];
  usedRuns = new Set<string>();
  partyAttempts: Array<{
    partyCode: string;
    round: number;
    actorId: string;
    name: string;
    runId: string;
    score: number;
    trust: string;
    submittedAt: number;
  }> = [];
  private locks = new Map<string, Promise<void>>();
  private persistPath = process.env.GAMESWEB_MEMORY_FILE ?? "";

  private async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(key, prev.then(() => next));
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  async startSession(input: {
    identity: Identity;
    gameId: string;
    gameVersion: string;
    device: StoredSession["device"];
    buildSha?: string;
    appVersion?: string;
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
      metadata: {
        buildSha: input.buildSha ?? "dev",
        appVersion: input.appVersion ?? "0.3.0",
      },
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

  async getGuestProgress(anonymousId: string): Promise<StoredProfile> {
    return this.getOrCreateProfile({ userId: null, anonymousId, email: null });
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
      sharePresence: true,
      sharePublicActivity: true,
      achievements: [],
      achievementUnlocks: {},
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

  async submitScore(input: SubmitScoreInput): Promise<ScoreWriteResult> {
    const progressKey = `profile:${this.profileKey(input.identity)}`;
    return this.withLock(progressKey, () => this.submitScoreLocked(input));
  }

  private async submitScoreLocked(input: SubmitScoreInput): Promise<ScoreWriteResult> {
    if (input.localSessionId) {
      const existingLocal = [...this.scores.values()].find(
        (s) =>
          s.localSessionId === input.localSessionId &&
          (input.identity.userId ? s.userId === input.identity.userId : s.anonymousId === input.identity.anonymousId),
      );
      if (existingLocal) {
        const profile = await this.getOrCreateProfile(input.identity);
        return {
          score: existingLocal,
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
    }
    if (input.session) {
      if (assertSessionOwnership(input.session, input.identity) !== "ok") {
        throw Object.assign(new Error("forbidden"), { code: "FORBIDDEN" });
      }
      const existing = [...this.scores.values()].find((s) => s.sessionId === input.session!.id);
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
    }

    const profile = await this.getOrCreateProfile(input.identity);
    this.rollDay(profile);
    const resolvedGameId = input.session?.gameId ?? input.gameId;
    if (!resolvedGameId) throw Object.assign(new Error("invalid_score"), { code: "INVALID_SCORE" });
    const lower = lowerIsBetter(resolvedGameId);
    const prevScores = [...this.scores.values()].filter(
      (s) =>
        s.gameId === resolvedGameId &&
        s.mode === input.mode &&
        s.verified === "verified" &&
        (input.identity.userId ? s.userId === input.identity.userId : s.anonymousId === input.identity.anonymousId),
    );
    const pbBefore = prevScores.length
      ? lower
        ? Math.min(...prevScores.map((s) => s.score))
        : Math.max(...prevScores.map((s) => s.score))
      : lower
        ? Number.POSITIVE_INFINITY
        : 0;

    const proposed = computeRunRewards({
      gameId: resolvedGameId,
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

    const xpEarned = Math.max(0, Math.min(2500, proposed.xpEarned));
    profile.xp += xpEarned;
    const newLevel = levelFromXp(profile.xp).level;
    profile.achievements = [...new Set([...profile.achievements, ...proposed.achievements])];
    profile.achievementUnlocks = { ...profile.achievementUnlocks };
    const now = Date.now();
    for (const id of proposed.achievements) {
      if (!profile.achievementUnlocks[id]) profile.achievementUnlocks[id] = now;
    }
    profile.questProgress = proposed.questProgress;
    profile.questCompleted = [...new Set([...profile.questCompleted, ...proposed.questsCompleted])];
    if (input.verified === "verified") {
      profile.gamesPlayedToday += 1;
      if (!profile.uniqueGamesToday.includes(resolvedGameId)) {
        profile.uniqueGamesToday.push(resolvedGameId);
      }
      if (!profile.playedGameIds.includes(resolvedGameId)) profile.playedGameIds.push(resolvedGameId);
      if (proposed.pbImproved) profile.pbCount += 1;
      profile.stats = {
        ...profile.stats,
        gamesPlayed: (profile.stats.gamesPlayed ?? 0) + 1,
        pbCount: profile.pbCount,
      };
    }

    const score: StoredScore = {
      id: crypto.randomUUID(),
      sessionId: input.session?.id ?? null,
      userId: input.identity.userId,
      anonymousId: input.identity.anonymousId,
      gameId: resolvedGameId,
      mode: input.mode,
      score: input.score,
      metadata: input.metadata,
      createdAt: Date.now(),
      verified: input.verified,
      offlineSubmission: Boolean(input.offline),
      localSessionId: input.localSessionId,
    };
    this.scores.set(score.id, score);

    if (input.session) {
      input.session.endedAt = Date.now();
      input.session.durationMs = input.durationMs;
      input.session.score = input.score;
      input.session.result = input.result ?? "finish";
      this.sessions.set(input.session.id, input.session);
    }

    const result = {
      score,
      alreadyApplied: false,
      progression: {
        xpEarned,
        newLevel,
        newXp: profile.xp,
        achievements: proposed.achievements,
        questsCompleted: proposed.questsCompleted,
      },
    };
    this.persist();
    return result;
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
    if (!identity.userId) return null;
    const board = await this.leaderboard(gameId, mode, 500);
    const profile = await this.getOrCreateProfile(identity);
    const hit = board.find((r) => r.username === profile.username);
    return hit?.rank ?? null;
  }

  async upsertPresence(identity: Identity, status: StoredPresence["status"], gameId: string | null) {
    if (!identity.userId) return;
    const profile = await this.getOrCreateProfile(identity);
    this.presence.set(profile.userId, {
      userId: profile.userId,
      status,
      gameId: profile.sharePresence ? gameId : null,
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
      if (!profile?.sharePresence) continue;
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

  private isBlocked(a: string, b: string) {
    return this.friends.some(
      (f) =>
        f.status === "blocked" &&
        ((f.requesterId === a && f.addresseeId === b) || (f.addresseeId === a && f.requesterId === b)),
    );
  }

  async sendFriendRequest(identity: Identity, username: string) {
    const me = await this.getOrCreateProfile(identity);
    if (!identity.userId) return { error: "auth_required" };
    const otherId = this.usernameIndex.get(username.toLowerCase());
    if (!otherId) return { error: "not_found" };
    if (otherId === me.userId) return { error: "self" };
    if (this.isBlocked(me.userId, otherId)) return { error: "blocked" };
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

  async friendAction(
    identity: Identity,
    userId: string,
    action: "accept" | "decline" | "remove" | "block" | "unblock",
  ) {
    if (!identity.userId) return { error: "auth_required" };
    const me = await this.getOrCreateProfile(identity);
    const pair = (f: StoredFriend) =>
      (f.requesterId === me.userId && f.addresseeId === userId) ||
      (f.requesterId === userId && f.addresseeId === me.userId);

    if (action === "block") {
      this.friends = this.friends.filter((f) => !(pair(f) && (f.status === "pending" || f.status === "accepted")));
      const mine = this.friends.find((f) => f.requesterId === me.userId && f.addresseeId === userId && f.status === "blocked");
      if (!mine) {
        this.friends.push({ requesterId: me.userId, addresseeId: userId, status: "blocked", createdAt: Date.now() });
      }
      return { ok: true as const };
    }

    if (action === "unblock") {
      const mine = this.friends.find((f) => f.requesterId === me.userId && f.addresseeId === userId && f.status === "blocked");
      if (!mine) return { error: "not_found" };
      this.friends = this.friends.filter((f) => f !== mine);
      return { ok: true as const };
    }

    const row = this.friends.find(pair);
    if (!row) return { error: "not_found" };
    if (row.status === "blocked") return { error: "blocked" };

    if (action === "accept") {
      if (row.status !== "pending" || row.requesterId !== userId || row.addresseeId !== me.userId) {
        return { error: "forbidden" };
      }
      row.status = "accepted";
      return { ok: true as const };
    }
    if (action === "decline") {
      if (row.status !== "pending" || row.addresseeId !== me.userId) return { error: "forbidden" };
      this.friends = this.friends.filter((f) => f !== row);
      return { ok: true as const };
    }
    if (action === "remove") {
      if (row.status !== "accepted") return { error: "forbidden" };
      this.friends = this.friends.filter((f) => f !== row);
      return { ok: true as const };
    }
    return { error: "invalid" };
  }

  async listFriends(identity: Identity) {
    const me = await this.getOrCreateProfile(identity);
    const rows = this.friends.filter((f) => f.requesterId === me.userId || f.addresseeId === me.userId);
    return rows
      .filter((f) => f.status !== "blocked")
      .map((f) => {
        const otherId = f.requesterId === me.userId ? f.addresseeId : f.requesterId;
        const other = this.profiles.get(otherId);
        const presence = this.presence.get(otherId);
        const stale = !presence || Date.now() - presence.updatedAt > PRESENCE_STALE_MS;
        const status =
          f.status === "accepted"
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
          presence: (stale || !other?.sharePresence ? "offline" : presence?.status) ?? "offline",
          gameId: stale || !other?.sharePresence ? undefined : (presence?.gameId ?? undefined),
        };
      });
  }

  async searchUsers(identity: Identity, q: string) {
    const me = await this.getOrCreateProfile(identity);
    const n = q.toLowerCase();
    return [...this.profiles.values()]
      .filter(
        (p) =>
          p.userId !== me.userId &&
          p.userId !== identity.userId &&
          p.username.toLowerCase() !== me.username.toLowerCase() &&
          p.username.toLowerCase().includes(n) &&
          !p.isGuest &&
          !this.isBlocked(me.userId, p.userId),
      )
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

  async updateProfile(identity: Identity, patch: Partial<Pick<StoredProfile, "username" | "displayName" | "avatar" | "shareActivity" | "sharePresence" | "sharePublicActivity">>) {
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
    if (typeof patch.shareActivity === "boolean") {
      me.shareActivity = patch.shareActivity;
      me.sharePresence = patch.shareActivity;
      me.sharePublicActivity = patch.shareActivity;
    }
    if (typeof patch.sharePresence === "boolean") me.sharePresence = patch.sharePresence;
    if (typeof patch.sharePublicActivity === "boolean") me.sharePublicActivity = patch.sharePublicActivity;
    return me;
  }

  async mergeGuest(identity: Identity, input: { offlineRuns?: OfflineRun[] } = {}) {
    if (!identity.userId) return { error: "auth_required" };
    const anonymousId = identity.anonymousId;
    return this.withLock(`profile:${identity.userId}`, () =>
      this.withLock(`profile:guest:${anonymousId}`, () => this.mergeGuestLocked(identity, input)),
    );
  }

  private async mergeGuestLocked(identity: Identity, input: { offlineRuns?: OfflineRun[] } = {}) {
    if (!identity.userId) return { error: "auth_required" };
    const userId = identity.userId;
    const anonymousId = identity.anonymousId;
    if (this.migrations.has(anonymousId)) {
      return { ok: true as const, alreadyMerged: true, profile: await this.getOrCreateProfile(identity) };
    }
    const profile = await this.getOrCreateProfile(identity);
    const guestKey = `guest:${anonymousId}`;
    const guestProfile = this.profiles.get(guestKey);

    const guestScores = [...this.scores.values()].filter((s) => s.anonymousId === anonymousId && !s.userId);
    const guestSaves = [...this.saves.values()].filter((s) => s.userId === guestKey);

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
      {
        xp: guestProfile?.xp ?? 0,
        achievements: guestProfile?.achievements ?? [],
        scores: guestScores.map((s) => ({
          id: s.id,
          gameId: s.gameId,
          mode: s.mode,
          score: s.score,
          at: s.createdAt,
          verified: s.verified,
          metadata: s.metadata,
        })),
        saves: Object.fromEntries(guestSaves.map((s) => [s.gameId, { version: s.version, payload: s.payload, updatedAt: s.updatedAt }])),
        questProgress: guestProfile?.questProgress,
        questCompleted: guestProfile?.questCompleted,
        stats: guestProfile?.stats,
        streak: guestProfile?.streak,
      },
    );

    profile.xp = merged.xp;
    profile.achievements = merged.achievements;
    profile.achievementUnlocks = {
      ...profile.achievementUnlocks,
      ...(guestProfile?.achievementUnlocks ?? {}),
    };
    profile.questProgress = merged.questProgress;
    profile.questCompleted = merged.questCompleted;
    profile.stats = merged.stats;
    profile.streak = merged.streak;
    profile.isGuest = false;
    profile.anonymousId = anonymousId;

    for (const row of guestScores) {
      row.userId = identity.userId;
      this.scores.set(row.id, row);
    }
    for (const session of this.sessions.values()) {
      if (session.anonymousId === anonymousId && !session.userId) {
        session.userId = identity.userId;
      }
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
    for (const run of input.offlineRuns ?? []) {
      const localId = run.localSessionId;
      const dup = [...this.scores.values()].some(
        (s) =>
          (localId && s.localSessionId === localId) ||
          (s.userId === identity.userId &&
            s.gameId === run.gameId &&
            s.mode === run.mode &&
            s.score === run.score &&
            Math.abs(s.createdAt - run.endedAt) < 5_000),
      );
      if (dup) continue;
      const id = crypto.randomUUID();
      this.scores.set(id, {
        id,
        sessionId: null,
        userId,
        anonymousId,
        gameId: run.gameId,
        mode: run.mode,
        score: run.score,
        metadata: run.metadata,
        createdAt: run.endedAt,
        verified: "unverified",
        offlineSubmission: true,
        localSessionId: localId,
      });
    }

    if (guestProfile) this.profiles.delete(guestKey);
    this.migrations.set(anonymousId, userId);
    return { ok: true as const, alreadyMerged: false, profile };
  }

  async getIdempotency(scope: string, key: string) {
    return this.idempotency.get(`${scope}::${key}`) ?? null;
  }

  async putIdempotency(scope: string, key: string, _endpoint: string, status: number, response: unknown, _identity: Identity) {
    this.idempotency.set(`${scope}::${key}`, { status, response });
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

  async getPublicProfile(username: string): Promise<PublicPlayerPayload | null> {
    const key = this.usernameIndex.get(username.toLowerCase());
    if (!key) return null;
    const profile = this.profiles.get(key);
    if (!profile) return null;
    const mine = [...this.scores.values()].filter((s) => s.userId === profile.userId && s.verified === "verified");
    const best = new Map<string, { gameId: string; mode: string; score: number }>();
    for (const row of mine) {
      const id = `${row.gameId}:${row.mode}`;
      const cur = best.get(id);
      const lower = lowerIsBetter(row.gameId);
      if (!cur || (lower ? row.score < cur.score : row.score > cur.score)) {
        best.set(id, { gameId: row.gameId, mode: row.mode, score: row.score });
      }
    }
    const counts = new Map<string, number>();
    for (const row of mine) counts.set(row.gameId, (counts.get(row.gameId) ?? 0) + 1);
    let favoriteGameId: string | null = profile.playedGameIds[0] ?? null;
    let n = 0;
    for (const [id, c] of counts) {
      if (c > n) {
        favoriteGameId = id;
        n = c;
      }
    }
    const activity = profile.sharePublicActivity
      ? mine
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 8)
          .map((s) => ({ gameId: s.gameId, event: "Played", score: s.score, at: s.createdAt }))
      : null;
    return {
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.avatar,
      level: levelFromXp(profile.xp).level,
      favoriteGameId,
      records: [...best.values()],
      achievements: profile.achievements,
      activity,
    };
  }

  async getScore(id: string) {
    return this.scores.get(id) ?? null;
  }

  private persist() {
    if (!this.persistPath) return;
    try {
      mkdirSync(dirname(this.persistPath), { recursive: true });
      writeFileSync(
        this.persistPath,
        JSON.stringify({
          sessions: [...this.sessions.entries()],
          scores: [...this.scores.entries()],
          profiles: [...this.profiles.entries()],
          friends: this.friends,
          parties: [...this.parties.entries()],
          challenges: [...this.challenges.entries()],
          inbox: this.inbox,
          rivals: this.rivals,
          usedRuns: [...this.usedRuns],
          partyAttempts: this.partyAttempts,
        }),
      );
    } catch {
      /* private / read-only */
    }
  }

  hydrateFromFile(path = this.persistPath) {
    if (!path || !existsSync(path)) return this;
    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as {
        sessions?: Array<[string, StoredSession]>;
        scores?: Array<[string, StoredScore]>;
        profiles?: Array<[string, StoredProfile]>;
        friends?: StoredFriend[];
        parties?: Array<[string, StoredParty]>;
        challenges?: Array<[string, ChallengeRecord]>;
        inbox?: StoredInbox[];
        rivals?: StoredRival[];
        usedRuns?: string[];
        partyAttempts?: MemoryBackend["partyAttempts"];
      };
      this.sessions = new Map(raw.sessions ?? []);
      this.scores = new Map(raw.scores ?? []);
      this.profiles = new Map(raw.profiles ?? []);
      this.friends = raw.friends ?? [];
      this.parties = new Map(raw.parties ?? []);
      this.challenges = new Map(raw.challenges ?? []);
      this.inbox = raw.inbox ?? [];
      this.rivals = raw.rivals ?? [];
      this.usedRuns = new Set(raw.usedRuns ?? []);
      this.partyAttempts = raw.partyAttempts ?? [];
    } catch {
      /* corrupt snapshot */
    }
    return this;
  }

  private pushInbox(userId: string, item: Omit<StoredInbox, "id" | "at" | "read" | "userId">) {
    this.inbox.unshift({ id: crypto.randomUUID(), userId, at: Date.now(), read: false, ...item });
    this.inbox = this.inbox.slice(0, 200);
  }

  async createParty(identity: Identity, hostName: string): Promise<StoredParty> {
    const id = actorId(identity);
    const party: StoredParty = {
      id: crypto.randomUUID(),
      code: makePublicCode(),
      host: id,
      members: [{ id, name: hostName, ready: true, score: 0, joinedAt: Date.now() }],
      playlist: QUICK_PARTY_PLAYLIST.map((r) => ({ ...r })),
      round: 0,
      state: "lobby",
      standings: [],
      createdAt: Date.now(),
      persistence: "server",
      roundRoster: [],
      submitted: [],
    };
    this.parties.set(party.code, party);
    this.persist();
    return structuredClone(party);
  }

  async getParty(code: string) {
    const hit = this.parties.get(code.toUpperCase());
    return hit ? structuredClone(hit) : null;
  }

  async joinParty(identity: Identity, code: string, name: string) {
    const party = this.parties.get(code.toUpperCase());
    if (!party) return { ok: false as const, error: "not_found" as const };
    const id = actorId(identity);
    if (party.members.some((m) => m.id === id)) return { ok: true as const, duplicate: true, party: structuredClone(party) };
    if (party.state !== "lobby") return { ok: false as const, error: "closed" as const };
    if (party.members.length >= 6) return { ok: false as const, error: "full" as const };
    party.members.push({ id, name, ready: false, score: 0, joinedAt: Date.now() });
    this.persist();
    return { ok: true as const, duplicate: false, party: structuredClone(party) };
  }

  async setPartyReady(identity: Identity, code: string, ready: boolean) {
    const party = this.parties.get(code.toUpperCase());
    if (!party) return null;
    const m = party.members.find((row) => row.id === actorId(identity));
    if (!m) return null;
    m.ready = ready;
    this.persist();
    return structuredClone(party);
  }

  async startParty(identity: Identity, code: string) {
    const party = this.parties.get(code.toUpperCase());
    if (!party) return { error: "not_found" };
    if (party.host !== actorId(identity)) return { error: "host_only" };
    if (party.state !== "lobby" && party.state !== "results") return { error: "bad_state" };
    const roster = party.members.filter((m) => m.ready);
    if (!roster.length) return { error: "no_ready" };
    party.roundRoster = roster.map((m) => m.id);
    party.submitted = [];
    party.state = "playing";
    this.persist();
    return structuredClone(party);
  }

  async advanceParty(identity: Identity, code: string) {
    const party = this.parties.get(code.toUpperCase());
    if (!party) return { error: "not_found" };
    if (party.host !== actorId(identity)) return { error: "host_only" };
    if (party.state !== "results") return { error: "bad_state" };
    party.round += 1;
    if (party.round >= party.playlist.length) {
      party.state = "done";
    } else {
      party.state = "playing";
      party.submitted = [];
      party.roundRoster = party.members.filter((m) => m.ready).map((m) => m.id);
      if (!party.roundRoster.length) party.roundRoster = party.members.map((m) => m.id);
    }
    this.persist();
    return structuredClone(party);
  }

  async submitPartyRound(identity: Identity, code: string, runId: string) {
    return this.withLock(`party:${code.toUpperCase()}`, async () => {
      const party = this.parties.get(code.toUpperCase());
      if (!party) return { error: "not_found" };
      const id = actorId(identity);
      if (!party.members.some((m) => m.id === id)) return { error: "not_member" };
      if (party.state !== "playing") return { error: "bad_state" };
      if (!party.roundRoster.includes(id)) return { error: "not_in_round" };
      const roundAttempts = this.partyAttempts.filter((row) => row.partyCode === party.code && row.round === party.round);
      if (roundAttempts.some((row) => row.actorId === id) || party.submitted.includes(id)) return { error: "duplicate" };
      const usedKey = `party:${party.code}:${party.round}:${runId}`;
      if (this.usedRuns.has(usedKey) || this.usedRuns.has(`run:${runId}:party`) || this.partyAttempts.some((row) => row.runId === runId)) {
        return { error: "run_reuse" };
      }
      const run = await loadCompetitiveRun(this, identity, runId);
      if ("error" in run) return { error: run.error };
      const slot = party.playlist[party.round];
      if (!slot) return { error: "game_mismatch" };
      const target = validateCompetitiveRunTarget(run, slot);
      if (!target.ok) return { error: target.error };
      if (run.verificationStatus === "flagged") return { error: "invalid_score" };
      const name = party.members.find((m) => m.id === id)?.name ?? "Player";
      this.partyAttempts.push({
        partyCode: party.code,
        round: party.round,
        actorId: id,
        name,
        runId: run.runId,
        score: run.score,
        trust: competitiveTrust(run.verificationStatus),
        submittedAt: Date.now(),
      });
      this.usedRuns.add(usedKey);
      this.usedRuns.add(`run:${runId}:party`);
      const attempts = this.partyAttempts.filter((row) => row.partyCode === party.code && row.round === party.round);
      party.submitted = attempts.map((row) => row.actorId);
      if (party.roundRoster.every((rid) => attempts.some((row) => row.actorId === rid))) {
        const ranked = rankPartyRound(
          attempts.map((row) => ({ id: row.actorId, name: row.name, score: row.score, submittedAt: row.submittedAt })),
          slot.gameId,
        );
        party.standings = applyRoundPoints(party.standings, ranked);
        for (const row of ranked) {
          const member = party.members.find((m) => m.id === row.id);
          if (member) member.score = row.score;
        }
        party.state = "results";
      }
      this.persist();
      return structuredClone(party);
    });
  }

  async createChallengeFromRun(identity: Identity, runId: string, type?: string) {
    const run = await loadCompetitiveRun(this, identity, runId);
    if ("error" in run) return { error: run.error };
    const usedKey = `run:${runId}:challenge-create`;
    if (this.usedRuns.has(usedKey)) return { error: "run_reuse" };
    if (run.verificationStatus === "flagged") return { error: "invalid_score" };
    const resolved = resolveChallengeType(run.gameId, type);
    if (!resolved.ok) return { error: resolved.error };
    const profile = await this.getOrCreateProfile(identity);
    const publicCode = makePublicCode();
    const challenge: ChallengeRecord = {
      id: crypto.randomUUID(),
      publicCode,
      gameId: run.gameId,
      mode: run.mode,
      seed: `${run.gameId}:${run.runId}`,
      type: resolved.type,
      challengerId: actorId(identity),
      challengerName: profile.displayName || "Player",
      targetId: null,
      targetName: null,
      challengerRunId: run.runId,
      challengerScore: run.score,
      challengerGhostId: null,
      challengerMeta: {},
      status: "open",
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
      metadata: { durationMs: run.durationMs },
      winnerId: null,
      targetScore: null,
      trust: competitiveTrust(run.verificationStatus),
      gameVersion: run.gameVersion,
      attempts: [],
    };
    this.challenges.set(publicCode, challenge);
    this.usedRuns.add(usedKey);
    this.persist();
    return { challenge: structuredClone(challenge), url: `/c/${publicCode}` };
  }

  async getChallenge(code: string) {
    const hit = this.challenges.get(code.toUpperCase());
    if (hit && hit.expiresAt < Date.now()) {
      hit.status = "expired";
    }
    return hit ? structuredClone(hit) : null;
  }

  async putChallenge(challenge: ChallengeRecord) {
    const next = { ...challenge, trust: challenge.trust === "verified" ? "unverified" : challenge.trust };
    this.challenges.set(next.publicCode.toUpperCase(), next);
    this.persist();
  }

  async attemptChallengeFromRun(identity: Identity, code: string, runId: string) {
    const current = this.challenges.get(code.toUpperCase());
    if (!current) return { ok: false as const, error: "not_found" };
    if (current.expiresAt < Date.now()) {
      current.status = "expired";
      return { ok: false as const, error: "expired" };
    }
    const usedKey = `run:${runId}:challenge-attempt`;
    if (this.usedRuns.has(usedKey)) return { ok: false as const, error: "run_reuse" };
    const run = await loadCompetitiveRun(this, identity, runId);
    if ("error" in run) return { ok: false as const, error: run.error };
    const target = validateCompetitiveRunTarget(run, { gameId: current.gameId, mode: current.mode });
    if (!target.ok) return { ok: false as const, error: target.error };
    if (run.verificationStatus === "flagged") return { ok: false as const, error: "invalid_score" };
    const profile = await this.getOrCreateProfile(identity);
    const applied = applyChallengeAttempt(current, {
      id: crypto.randomUUID(),
      challengeId: current.id,
      playerId: actorId(identity),
      playerName: profile.displayName || "Player",
      score: run.score,
      runId: run.runId,
      trust: competitiveTrust(run.verificationStatus),
      createdAt: Date.now(),
      metadata: { durationMs: run.durationMs },
    });
    this.challenges.set(code.toUpperCase(), applied.challenge);
    this.usedRuns.add(usedKey);
    if (!applied.duplicate && applied.outcome !== "pending") {
      this.pushInbox(current.challengerId, {
        type: "challenge",
        title: applied.outcome === "win" ? `${profile.displayName || "Player"} beat your score` : applied.outcome === "draw" ? "Challenge draw" : `${profile.displayName || "Player"} tried your challenge`,
        body: getManifest(current.gameId)?.title ?? current.gameId,
        href: `/c/${code.toUpperCase()}`,
      });
      this.pushInbox(actorId(identity), {
        type: "challenge",
        title: applied.outcome === "win" ? "You won the challenge" : applied.outcome === "draw" ? "Draw" : `${current.challengerName} still leads`,
        body: getManifest(current.gameId)?.title ?? current.gameId,
        href: `/c/${code.toUpperCase()}`,
      });
    }
    this.persist();
    return { ok: true as const, ...applied };
  }

  async listInbox(identity: Identity) {
    const id = actorId(identity);
    return this.inbox.filter((i) => i.userId === id).map((i) => ({ ...i }));
  }

  async markInboxRead(identity: Identity, id: string) {
    const hit = this.inbox.find((i) => i.id === id && i.userId === actorId(identity));
    if (hit) hit.read = true;
    this.persist();
    return hit ? { ...hit } : null;
  }

  async listRivals(identity: Identity) {
    return rivalsFromChallenges(actorId(identity), [...this.challenges.values()]);
  }
}

export function memoryStore(): MemoryBackend {
  const g = globalThis as G;
  if (!g.__gw_memory) {
    const store = new MemoryBackend();
    store.hydrateFromFile();
    g.__gw_memory = store;
  }
  return g.__gw_memory;
}

export function resetMemoryStore() {
  const g = globalThis as G;
  g.__gw_memory = new MemoryBackend();
  return g.__gw_memory;
}
