import { analytics, setAnalyticsContext } from "@gamesweb/analytics";
import { brand, levelFromXp, storageKeys, xpRewards } from "@gamesweb/config";
import { GAME_MODES, validateScore, type VerifiedStatus } from "@gamesweb/database";
import { applyServerProgression } from "./player/progression-client";
import { isValidInviteRef } from "./player/invite";
import {
  allAchievements,
  dailyQuests,
  GAME_MANIFESTS,
  getManifest,
  utcDayKey,
  type AudioSettings,
  type GameManifest,
  type PlatformSDK,
  type PlayerView,
  type ScorePayload,
} from "@gamesweb/game-sdk";
import { playerApi } from "./player-api";
import { writeGameplayPrefs } from "./platform/prefs";

export type StoredScore = {
  id: string;
  gameId: string;
  mode: string;
  score: number;
  at: number;
  verified: VerifiedStatus;
  metadata: Record<string, number | string | boolean>;
  localSessionId?: string;
};

export type PlayRecord = {
  gameId: string;
  at: number;
  durationMs: number;
  score: number;
  result: string;
  metadata?: Record<string, number | string | boolean>;
};

export type Friend = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  status: "pending-out" | "pending-in" | "accepted";
  presence: "online" | "playing" | "offline";
  gameId?: string;
};

export type Toast = {
  id: string;
  kind: "achievement" | "level" | "quest" | "pb" | "info";
  title: string;
  body?: string;
};

export type PlayerSnapshot = {
  id: string;
  authId: string | null;
  isGuest: boolean;
  username: string;
  displayName: string;
  avatar: string;
  xp: number;
  streak: number;
  lastSeenDay: string;
  createdAt: number;
  achievements: string[];
  questProgress: Record<string, number>;
  questCompleted: string[];
  stats: Record<string, number>;
  saves: Record<string, { version: string; payload: Record<string, unknown> }>;
  scores: StoredScore[];
  history: PlayRecord[];
  achievementUnlocks: Record<string, number>;
  settings: AudioSettings & {
    reducedMotion: boolean;
    shareActivity: boolean;
    sharePresence: boolean;
    sharePublicActivity: boolean;
    ghost: boolean;
    haptics: boolean;
    shake: number;
  };
  friends: Friend[];
  pbCount: number;
  sessionGames: string[];
  uniqueGamesToday: string[];
  dayKey: string;
  gamesPlayedToday: number;
  pendingSavePrompt: boolean;
  backend: "local" | "supabase";
  pendingInvite: string | null;
  syncStatus: "idle" | "saving" | "saved" | "offline" | "review";
};

const defaultAudio: AudioSettings = { master: 0.8, music: 0.45, sfx: 0.7, muted: false };

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `g-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function migrateSettings(
  defaults: PlayerSnapshot["settings"],
  incoming: Partial<PlayerSnapshot["settings"]> | undefined,
): PlayerSnapshot["settings"] {
  const merged = { ...defaults, ...incoming };
  const hadSplit = Boolean(
    incoming &&
      (Object.prototype.hasOwnProperty.call(incoming, "sharePresence") ||
        Object.prototype.hasOwnProperty.call(incoming, "sharePublicActivity")),
  );
  if (!hadSplit && typeof incoming?.shareActivity === "boolean") {
    merged.sharePresence = incoming.shareActivity;
    merged.sharePublicActivity = incoming.shareActivity;
  }
  return merged;
}

function guestName(id: string) {
  return `guest-${id.slice(0, 4)}`;
}

function emptyPlayer(id?: string): PlayerSnapshot {
  const pid = id ?? uid();
  const day = utcDayKey();
  return {
    id: pid,
    authId: null,
    isGuest: true,
    username: guestName(pid),
    displayName: "Player",
    avatar: `orb-${Number.parseInt(pid.replace(/\D/g, "0").slice(0, 2) || "0", 10) % 8}`,
    xp: 0,
    streak: 0,
    lastSeenDay: day,
    createdAt: Date.now(),
    achievements: [],
    questProgress: {},
    questCompleted: [],
    stats: {},
    saves: {},
    scores: [],
    history: [],
    achievementUnlocks: {},
    settings: { ...defaultAudio, reducedMotion: false, shareActivity: true, sharePresence: true, sharePublicActivity: true, ghost: true, haptics: true, shake: 1 },
    friends: [],
    pbCount: 0,
    sessionGames: [],
    uniqueGamesToday: [],
    dayKey: day,
    gamesPlayedToday: 0,
    pendingSavePrompt: false,
    backend: "local",
    pendingInvite: null,
    syncStatus: "idle",
  };
}

export const SSR_PLAYER: PlayerSnapshot = {
  id: "ssr",
  authId: null,
  isGuest: true,
  username: "guest",
  displayName: "Player",
  avatar: "orb-0",
  xp: 0,
  streak: 0,
  lastSeenDay: "1970-01-01",
  createdAt: 0,
  achievements: [],
  questProgress: {},
  questCompleted: [],
  stats: {},
  saves: {},
  scores: [],
  history: [],
  achievementUnlocks: {},
  settings: { ...defaultAudio, reducedMotion: false, shareActivity: true, sharePresence: true, sharePublicActivity: true, ghost: true, haptics: true, shake: 1 },
  friends: [],
  pbCount: 0,
  sessionGames: [],
  uniqueGamesToday: [],
  dayKey: "1970-01-01",
  gamesPlayedToday: 0,
  pendingSavePrompt: false,
  backend: "local",
  pendingInvite: null,
  syncStatus: "idle",
};

type Listener = () => void;

type SyncOp = {
  opId: string;
  type: string;
  payload: Record<string, unknown>;
  retryCount: number;
  ts: number;
  idempotencyKey: string;
};

class PlayerStore {
  snapshot: PlayerSnapshot = SSR_PLAYER;
  toasts: Toast[] = [];
  remoteBoards: Record<string, Array<{ name: string; username?: string; score: number; isYou: boolean; verified?: boolean }>> = {};
  remoteRanks: Record<string, number | null> = {};
  boardStatus: Record<string, "ok" | "error" | "loading"> = {};
  private listeners = new Set<Listener>();
  private sessionId = uid();
  private ready = false;
  private queue: SyncOp[] = [];
  private presenceTimer: number | null = null;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  private persist() {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKeys.player, JSON.stringify(this.snapshot));
    localStorage.setItem(storageKeys.syncQueue, JSON.stringify(this.queue));
  }

  hydrate() {
    if (this.ready || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKeys.player);
      if (raw) {
        const parsed = JSON.parse(raw) as PlayerSnapshot;
        this.snapshot = {
          ...emptyPlayer(),
          ...parsed,
          achievementUnlocks: {
            ...emptyPlayer().achievementUnlocks,
            ...(parsed as PlayerSnapshot & { achievementUnlocks?: Record<string, number> }).achievementUnlocks,
          },
          settings: migrateSettings(emptyPlayer().settings, parsed.settings),
        };
      } else {
        this.snapshot = emptyPlayer();
      }
      const q = localStorage.getItem(storageKeys.syncQueue);
      if (q) this.queue = JSON.parse(q) as SyncOp[];
    } catch {
      this.snapshot = emptyPlayer();
    }
    this.rollDay();
    this.ready = true;
    writeGameplayPrefs(this.snapshot.settings);
    analytics.identify(this.snapshot.authId ?? this.snapshot.id, {
      guest: this.snapshot.isGuest,
      level: levelFromXp(this.snapshot.xp).level,
    });
    setAnalyticsContext({ player_session_id: this.sessionId, device: deviceClass() });
    analytics.track("platform_loaded", { device: deviceClass(), player_session_id: this.sessionId });
    this.emit();
    void this.flush();
    void this.hydrateRemote();
    this.startPresenceHeartbeat();
  }

  private rollDay() {
    const day = utcDayKey();
    if (this.snapshot.dayKey === day) {
      this.touchStreak();
      return;
    }
    const prev = new Date(this.snapshot.dayKey + "T00:00:00Z");
    const cur = new Date(day + "T00:00:00Z");
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) this.snapshot.streak += 1;
    else if (diff > 1) this.snapshot.streak = 1;
    this.snapshot.dayKey = day;
    this.snapshot.lastSeenDay = day;
    this.snapshot.uniqueGamesToday = [];
    this.snapshot.gamesPlayedToday = 0;
    this.snapshot.questProgress = {};
    if (this.snapshot.streak >= 2) void this.unlock("return-tomorrow");
    if (this.snapshot.streak >= 7) void this.unlock("weekender");
    this.persist();
  }

  private touchStreak() {
    if (this.snapshot.streak === 0) this.snapshot.streak = 1;
  }

  update(partial: Partial<PlayerSnapshot>) {
    this.snapshot = { ...this.snapshot, ...partial };
    if (partial.settings) writeGameplayPrefs(this.snapshot.settings);
    this.persist();
    this.emit();
  }

  toast(t: Omit<Toast, "id">) {
    const item = { ...t, id: uid() };
    this.toasts = [...this.toasts.slice(-4), item];
    this.emit();
    setTimeout(() => {
      this.toasts = this.toasts.filter((x) => x.id !== item.id);
      this.emit();
    }, 4200);
  }

  view(): PlayerView {
    const lv = levelFromXp(this.snapshot.xp);
    return {
      id: this.snapshot.id,
      isGuest: this.snapshot.isGuest,
      username: this.snapshot.username,
      displayName: this.snapshot.displayName,
      avatar: this.snapshot.avatar,
      level: lv.level,
      xp: this.snapshot.xp,
      streak: this.snapshot.streak,
    };
  }

  async addXp(amount: number, reason: string) {
    const before = levelFromXp(this.snapshot.xp);
    this.snapshot.xp += Math.max(0, Math.round(amount));
    const after = levelFromXp(this.snapshot.xp);
    analytics.track("xp_earned", { amount, reason, level: after.level });
    if (after.level > before.level) {
      analytics.track("level_up", { level: after.level });
      this.toast({ kind: "level", title: `Level ${after.level}`, body: "The arcade noticed." });
      if (this.snapshot.isGuest) this.snapshot.pendingSavePrompt = true;
    }
    this.persist();
    this.emit();
    return { level: after.level, leveledUp: after.level > before.level };
  }

  personalBest(gameId: string, mode: string, lowerIsBetter = false): number {
    const rows = this.snapshot.scores.filter((s) => s.gameId === gameId && s.mode === mode);
    if (!rows.length) return lowerIsBetter ? Number.POSITIVE_INFINITY : 0;
    return lowerIsBetter ? Math.min(...rows.map((r) => r.score)) : Math.max(...rows.map((r) => r.score));
  }

  async submitScore(gameId: string, payload: ScorePayload, sessionId: string, durationMs: number) {
    const validation = validateScore({
      sessionId,
      gameId,
      gameVersion: getManifest(gameId)?.version ?? "1.0.0",
      mode: payload.mode,
      score: payload.score,
      durationMs,
      startedAt: Date.now() - durationMs,
      endedAt: Date.now(),
      metadata: payload.metadata,
    });
    const lower = Boolean(payload.metadata.lowerIsBetter);
    const prev = this.personalBest(gameId, payload.mode, lower);
    const improved = lower ? payload.score < prev : payload.score > prev;
    const row: StoredScore = {
      id: uid(),
      gameId,
      mode: payload.mode,
      score: payload.score,
      at: Date.now(),
      verified: validation.status,
      metadata: payload.metadata,
      localSessionId: sessionId,
    };
    this.snapshot.scores = [row, ...this.snapshot.scores].slice(0, 400);
    analytics.track("score_submitted", { gameId, score: payload.score, status: validation.status });
    if (improved && Number.isFinite(prev)) {
      this.snapshot.pbCount += 1;
      analytics.track("personal_best", { gameId, score: payload.score });
      this.toast({ kind: "pb", title: "New record", body: formatScore(gameId, payload.score) });
      await this.addXp(xpRewards.personalBest, "personal_best");
      this.progressQuest("platform:pbCountToday", 1);
      if (this.snapshot.pbCount >= 3) await this.unlock("on-fire");
      if (this.snapshot.isGuest) this.snapshot.pendingSavePrompt = true;
    }
    this.enqueue("score", { row, sessionId, gameId, payload, durationMs });
    this.snapshot.syncStatus = typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "saving";
    this.persist();
    this.emit();
    void this.pushScore(gameId, payload, sessionId, durationMs, row);
    return { personalBest: improved, previous: Number.isFinite(prev) ? prev : 0 };
  }

  private async pushScore(
    gameId: string,
    payload: ScorePayload,
    sessionId: string,
    durationMs: number,
    row: StoredScore,
  ) {
    try {
      const res = await playerApi.submitScore({
        sessionId,
        gameId,
        gameVersion: getManifest(gameId)?.version ?? "1.0.0",
        mode: payload.mode,
        score: payload.score,
        durationMs,
        startedAt: Date.now() - durationMs,
        endedAt: Date.now(),
        metadata: payload.metadata,
        offline: typeof navigator !== "undefined" && !navigator.onLine,
        idempotencyKey: `score:${sessionId}`,
      });
      if (!res.ok) {
        analytics.track("score_rejected", { gameId, code: res.error.code });
        if (res.status === 503) {
          this.snapshot.backend = "local";
          this.snapshot.syncStatus = "offline";
          this.toast({ kind: "info", title: "Saved locally" });
        }
        if (res.error.code === "SESSION_MISSING") {
          const retry = await playerApi.submitScore({
            gameId,
            gameVersion: getManifest(gameId)?.version ?? "1.0.0",
            mode: payload.mode,
            score: payload.score,
            durationMs,
            startedAt: Date.now() - durationMs,
            endedAt: Date.now(),
            metadata: payload.metadata,
            offline: true,
            offlineSubmission: true,
            localSessionId: sessionId,
            idempotencyKey: `score-offline:${sessionId}`,
          });
          if (retry.ok) {
            row.verified = retry.data.verification.status as VerifiedStatus;
            this.applyServerProgression(retry.data.progressionDiff);
            this.snapshot.syncStatus = retry.data.verification.status === "unverified" ? "review" : "saved";
          }
        }
        this.persist();
        this.emit();
        return;
      }
      row.verified = res.data.verification.status as VerifiedStatus;
      if (res.data.verification.status === "flagged") {
        analytics.track("score_flagged", { gameId });
        this.snapshot.syncStatus = "review";
      } else if (res.data.verification.status === "unverified") {
        this.snapshot.syncStatus = "review";
      } else {
        this.snapshot.syncStatus = "saved";
      }
      this.applyServerProgression(res.data.progressionDiff);
      this.persist();
      this.emit();
    } catch {
      analytics.track("sync_failed", { kind: "score" });
      this.snapshot.syncStatus = "offline";
      this.toast({ kind: "info", title: "Saved locally" });
      this.persist();
      this.emit();
    }
  }

  applyServerProgression(diff: { newXp: number; newLevel: number; achievements: string[]; questsCompleted: string[]; xpEarned: number }) {
    this.snapshot = applyServerProgression(this.snapshot, diff);
  }

  async unlock(key: string) {
    const def = allAchievements().find((a) => a.key === key);
    const id = `${def?.gameId ?? "platform"}:${key}`;
    if (!def || this.snapshot.achievements.includes(id)) return false;
    this.snapshot.achievements = [...this.snapshot.achievements, id];
    this.snapshot.achievementUnlocks = { ...this.snapshot.achievementUnlocks, [id]: Date.now() };
    analytics.track("achievement_unlocked", { key, gameId: def.gameId });
    const gameTitle = def.gameId ? getManifest(def.gameId)?.title : "Gamesweb";
    this.toast({ kind: "achievement", title: def.name, body: `${def.xp} XP · ${gameTitle}` });
    await this.addXp(def.xp, "achievement");
    this.persist();
    this.emit();
    return true;
  }

  progressQuest(stat: string, value: number) {
    const quests = dailyQuests(this.snapshot.dayKey);
    for (const q of quests) {
      if (q.stat !== stat) continue;
      const cur = this.snapshot.questProgress[q.id] ?? 0;
      const next = q.stat.endsWith("-under") ? Math.max(cur, value === q.target ? q.target : cur) : Math.max(cur, value);
      const mapped = q.stat.includes("score") || q.stat.includes("survive") || q.stat.includes("kills") || q.stat.includes("maxCombo")
        ? Math.max(cur, value)
        : next;
      this.snapshot.questProgress[q.id] = mapped;
      analytics.track("quest_progressed", { questId: q.id, progress: mapped });
      if (mapped >= q.target && !this.snapshot.questCompleted.includes(q.id)) {
        this.snapshot.questCompleted = [...this.snapshot.questCompleted, q.id];
        analytics.track("quest_completed", { questId: q.id });
        this.toast({ kind: "quest", title: "Challenge complete", body: q.title });
        void this.addXp(q.xp, "challenge");
      }
    }
    this.persist();
    this.emit();
  }

  onRunEnd(opts: {
    gameId: string;
    durationMs: number;
    score: number;
    result: string;
    payload: ScorePayload;
    sessionId: string;
  }) {
    const firstToday = this.snapshot.gamesPlayedToday === 0;
    this.snapshot.gamesPlayedToday += 1;
    if (!this.snapshot.sessionGames.includes(opts.gameId)) {
      this.snapshot.sessionGames = [...this.snapshot.sessionGames, opts.gameId];
    }
    if (!this.snapshot.uniqueGamesToday.includes(opts.gameId)) {
      this.snapshot.uniqueGamesToday = [...this.snapshot.uniqueGamesToday, opts.gameId];
    }
    this.snapshot.history = [
      {
        gameId: opts.gameId,
        at: Date.now(),
        durationMs: opts.durationMs,
        score: opts.score,
        result: opts.result,
        metadata: opts.payload.metadata,
      },
      ...this.snapshot.history,
    ].slice(0, 80);

    const hour = new Date().getHours();
    if (hour < 5) void this.unlock("night-shift");
    void this.unlock("first-run");
    if (this.snapshot.sessionGames.length >= 2) {
      const genres = new Set(
        this.snapshot.sessionGames.map((id) => getManifest(id)?.genre).filter(Boolean),
      );
      if (genres.size >= 2) void this.unlock("explorer");
    }
    if (GAME_MANIFESTS.every((g) => this.playedIds().includes(g.id))) void this.unlock("three-worlds");

    this.progressQuest("platform:uniqueGamesToday", this.snapshot.uniqueGamesToday.length);
    if (opts.gameId === "neon-drift") {
      this.progressQuest("neon-drift:score", opts.score);
      this.progressQuest("neon-drift:maxCombo", Number(opts.payload.metadata.combo ?? 1));
    }
    if (opts.gameId === "swarm-protocol") {
      this.progressQuest("swarm-protocol:surviveMs", Number(opts.payload.metadata.surviveMs ?? opts.durationMs));
      this.progressQuest("swarm-protocol:kills", Number(opts.payload.metadata.kills ?? 0));
    }

    const scale = Math.min(1, opts.durationMs / (xpRewards.minRunSecondsForFullXp * 1000));
    void this.addXp(Math.round(xpRewards.runComplete * scale + (opts.durationMs / 60000) * xpRewards.runCompletePerMinute), "run");
    if (firstToday) void this.addXp(xpRewards.firstPlayOfDay, "first_of_day");
    const tried = this.playedIds().length;
    if (tried === this.snapshot.sessionGames.length && this.snapshot.history.filter((h) => h.gameId === opts.gameId).length === 1) {
      void this.addXp(xpRewards.newGameTried, "new_game");
    }

    if (this.snapshot.sessionGames.length >= 2 && this.snapshot.isGuest) {
      this.snapshot.pendingSavePrompt = true;
    }

    analytics.track("gameplay_ended", {
      gameId: opts.gameId,
      durationMs: opts.durationMs,
      score: opts.score,
      result: opts.result,
    });

    void this.submitScore(opts.gameId, opts.payload, opts.sessionId, opts.durationMs);
    this.persist();
    this.emit();
  }

  playedIds() {
    return [...new Set(this.snapshot.history.map((h) => h.gameId))];
  }

  continuePlaying(): GameManifest[] {
    const ids = this.playedIds();
    return ids.map((id) => getManifest(id)).filter((g): g is GameManifest => Boolean(g));
  }

  createPlatform(gameId: string, hooks: { onPause: () => void; onHud?: (p: Record<string, number>) => void; onReady?: () => void }): PlatformSDK {
    let session = { id: uid(), gameId, startedAt: Date.now(), version: getManifest(gameId)?.version ?? "1.0.0" };
    let sessionReady: Promise<void> = Promise.resolve();
    return {
      init: () => undefined,
      session: {
        start: () => {
          session = { id: uid(), gameId, startedAt: Date.now(), version: getManifest(gameId)?.version ?? "1.0.0" };
          analytics.track("gameplay_started", { gameId, sessionId: session.id });
          void this.presencePlaying(gameId);
          sessionReady = playerApi
            .startSession({ gameId, gameVersion: session.version, device: deviceClass() })
            .then((res) => {
              if (res.ok) {
                session = {
                  id: res.data.sessionId,
                  gameId,
                  startedAt: Date.parse(res.data.startedAt) || Date.now(),
                  version: res.data.gameVersion,
                };
              } else if (res.status === 503) {
                this.snapshot.backend = "local";
              }
            })
            .catch(() => {
              this.snapshot.backend = "local";
            });
          return session;
        },
        end: async (result) => {
          try {
            await sessionReady;
          } catch {
            /* local session */
          }
          const durationMs = Date.now() - session.startedAt;
          this.onRunEnd({
            gameId,
            durationMs,
            score: result.score,
            result: result.result,
            payload: result,
            sessionId: session.id,
          });
        },
      },
      score: {
        submit: (payload) => this.submitScore(gameId, payload, session.id, Date.now() - session.startedAt),
      },
      achievement: {
        unlock: (key) => this.unlock(key),
      },
      quest: {
        progress: async (stat, amount) => this.progressQuest(stat, amount),
      },
      xp: {
        add: (amount, reason) => this.addXp(amount, reason),
      },
      save: {
        get: async () => this.snapshot.saves[gameId] ?? null,
        set: async (save) => {
          this.snapshot.saves[gameId] = save;
          this.persist();
          if (!this.snapshot.isGuest) {
            void playerApi.putSave(gameId, save.version, save.payload);
          }
        },
      },
      player: { get: () => this.view() },
      leaderboard: {
        get: async (mode) => this.leaderboard(gameId, mode),
      },
      audio: {
        getSettings: () => this.snapshot.settings,
      },
      events: {
        emit: (event) => {
          if (event.name === "game_ready") {
            hooks.onReady?.();
            analytics.track("game_ready", { gameId, ...event.props });
          }
          if (event.name === "hud" && hooks.onHud && event.props) {
            const nums: Record<string, number> = {};
            for (const [k, v] of Object.entries(event.props)) {
              if (typeof v === "number") nums[k] = v;
            }
            hooks.onHud(nums);
          }
          if (
            event.name === "game_retry" ||
            event.name === "death" ||
            event.name === "finish" ||
            event.name === "personal_best" ||
            event.name === "medal_earned" ||
            event.name === "upgrade_selected" ||
            event.name === "boss_defeated"
          ) {
            analytics.track(event.name, { gameId, ...event.props });
          }
        },
      },
      pause: { request: () => hooks.onPause() },
    };
  }

  personalRank(gameId: string, mode: string) {
    return this.remoteRanks[`${gameId}:${mode}`] ?? null;
  }

  boardError(gameId: string, mode: string) {
    return this.boardStatus[`${gameId}:${mode}`] === "error";
  }

  async ensureBoard(gameId: string, mode: string, force = false) {
    const key = `${gameId}:${mode}`;
    if (!force && (this.boardStatus[key] === "ok" || this.boardStatus[key] === "loading")) return;
    this.boardStatus[key] = "loading";
    try {
      const board = await playerApi.leaderboard(gameId, mode);
      if (board.ok) {
        this.remoteBoards[key] = board.data.rows.map((r) => ({
          name: r.displayName,
          username: r.username,
          score: r.score,
          isYou: r.username === this.snapshot.username,
          verified: r.verified,
        }));
        this.boardStatus[key] = "ok";
      } else {
        this.boardStatus[key] = "error";
        if (board.status === 503) this.snapshot.backend = "local";
      }
      const rank = await playerApi.myRank(gameId, mode);
      if (rank.ok) this.remoteRanks[key] = rank.data.personalRank;
      this.emit();
    } catch {
      this.boardStatus[key] = "error";
      this.emit();
    }
  }

  leaderboard(gameId: string, mode?: string) {
    const lower = gameId === "velocity-run";
    const rows = this.snapshot.scores.filter((s) => s.gameId === gameId && (!mode || s.mode === mode) && s.verified !== "flagged");
    const best = new Map<string, StoredScore>();
    for (const r of rows) {
      const cur = best.get("you");
      if (!cur || (lower ? r.score < cur.score : r.score > cur.score)) best.set("you", r);
    }
    const you = best.get("you");
    const local = you ? [{ name: this.snapshot.displayName, username: this.snapshot.username, score: you.score, isYou: true }] : [];
    const remote = this.remoteBoards[`${gameId}:${mode ?? ""}`] ?? [];
    const merged = [...remote.filter((r) => !r.isYou), ...local];
    merged.sort((a, b) => (lower ? a.score - b.score : b.score - a.score));
    return merged.slice(0, 20);
  }

  search(q: string) {
    const n = q.trim().toLowerCase();
    if (!n) return GAME_MANIFESTS;
    return GAME_MANIFESTS.filter(
      (g) =>
        g.title.toLowerCase().includes(n) ||
        g.genre.toLowerCase().includes(n) ||
        g.tags.some((t) => t.includes(n)) ||
        g.description.toLowerCase().includes(n),
    );
  }

  inviteLink(slug?: string) {
    const origin = window.location.origin;
    const ref = this.snapshot.username;
    return slug ? `${origin}/play/${slug}?ref=${encodeURIComponent(ref)}` : `${origin}/?ref=${encodeURIComponent(ref)}`;
  }

  markInvite() {
    analytics.track("friend_invited", { from: this.snapshot.username });
    void this.unlock("social-spark");
  }

  consumeRef(ref: string) {
    if (!isValidInviteRef(ref, this.snapshot.username)) return;
    this.snapshot.pendingInvite = ref;
    this.persist();
    this.emit();
  }

  async addPendingFriend() {
    const ref = this.snapshot.pendingInvite;
    if (!ref || this.snapshot.isGuest) return;
    const res = await playerApi.friendRequest(ref);
    if (res.ok) {
      this.snapshot.pendingInvite = null;
      this.persist();
      this.emit();
      void this.hydrateRemote();
    }
  }

  acceptFriend(id: string) {
    const friend = this.snapshot.friends.find((f) => f.id === id);
    this.snapshot.friends = this.snapshot.friends.map((f) =>
      f.id === id ? { ...f, status: "accepted" as const, presence: "online" as const } : f,
    );
    analytics.track("friend_added");
    this.toast({ kind: "info", title: "Friend accepted", body: friend?.displayName });
    this.persist();
    this.emit();
    if (friend && !this.snapshot.isGuest) void playerApi.friendAction(friend.id, "accept");
  }

  declineFriend(id: string) {
    const friend = this.snapshot.friends.find((f) => f.id === id);
    this.snapshot.friends = this.snapshot.friends.filter((f) => f.id !== id);
    this.persist();
    this.emit();
    if (friend && !this.snapshot.isGuest) void playerApi.friendAction(friend.id, "decline");
  }

  removeFriend(id: string) {
    const friend = this.snapshot.friends.find((f) => f.id === id);
    this.snapshot.friends = this.snapshot.friends.filter((f) => f.id !== id);
    this.persist();
    this.emit();
    if (friend && !this.snapshot.isGuest) void playerApi.friendAction(friend.id, "remove");
  }

  dismissSavePrompt() {
    this.snapshot.pendingSavePrompt = false;
    this.persist();
    this.emit();
  }

  async updateProfileRemote(patch?: { sharePresence?: boolean; sharePublicActivity?: boolean; displayName?: string }) {
    await playerApi.updateProfile({
      displayName: patch?.displayName ?? this.snapshot.displayName,
      sharePresence: patch?.sharePresence ?? this.snapshot.settings.sharePresence,
      sharePublicActivity: patch?.sharePublicActivity ?? this.snapshot.settings.sharePublicActivity,
    });
  }

  async completeAuth() {
    const me = await playerApi.me();
    if (!me.ok) throw new Error("me");
    analytics.track("guest_merge_started");
    const offlineRuns = this.snapshot.scores
      .filter((s) => s.verified === "unverified")
      .slice(0, 40)
      .map((s) => ({
        gameId: s.gameId,
        mode: s.mode,
        score: s.score,
        durationMs: 0,
        startedAt: s.at,
        endedAt: s.at,
        metadata: s.metadata,
        localSessionId: s.localSessionId ?? s.id,
      }));
    const merge = await playerApi.merge({ offlineRuns });
    if (!merge.ok && merge.status !== 503) throw new Error("merge");
    this.snapshot = {
      ...this.snapshot,
      authId: me.data.id,
      isGuest: false,
      username: me.data.username,
      displayName: me.data.displayName,
      avatar: me.data.avatar,
      pendingSavePrompt: false,
    };
    if (merge.ok) this.snapshot.xp = merge.data.xp;
    analytics.identify(me.data.id, { username: me.data.username, guest: false });
    analytics.track("signup_completed");
    analytics.track("guest_merged");
    this.persist();
    this.emit();
    void this.hydrateRemote();
  }

  async mergeAccount(authId: string, username: string) {
    this.snapshot = {
      ...this.snapshot,
      authId,
      isGuest: false,
      username,
      displayName: username,
      pendingSavePrompt: false,
    };
    analytics.track("guest_merged", { authId });
    analytics.identify(authId, { username });
    this.persist();
    this.emit();
  }

  private enqueue(type: string, payload: Record<string, unknown>) {
    const opId = uid();
    this.queue.push({
      opId,
      type,
      payload,
      retryCount: 0,
      ts: Date.now(),
      idempotencyKey: `${type}:${String(payload.sessionId ?? opId)}`,
    });
    this.persist();
    void this.flush();
  }

  async hydrateRemote() {
    try {
      const health = await fetch("/api/health");
      if (health.status === 503) this.snapshot.backend = "local";
      else if (health.ok) {
        const info = (await health.json()) as { persistence?: string };
        this.snapshot.backend = info.persistence === "durable" ? "supabase" : "local";
      }
      for (const g of GAME_MANIFESTS) {
        const modes = GAME_MODES[g.id as keyof typeof GAME_MODES] ?? [g.id === "velocity-run" ? "course-1" : g.id === "swarm-protocol" ? "survival" : "foundation"];
        for (const mode of modes) {
          await this.ensureBoard(g.id, mode);
        }
      }
      const me = await playerApi.me();
      if (me.ok) {
        const serverHasProgress = me.data.xp > 0 || (me.data.achievements?.length ?? 0) > 0;
        if (!me.data.isGuest) {
          this.snapshot.authId = me.data.id;
          this.snapshot.isGuest = false;
          this.snapshot.username = me.data.username;
          this.snapshot.displayName = me.data.displayName;
          this.snapshot.avatar = me.data.avatar;
          this.snapshot.xp = me.data.xp;
          this.snapshot.achievements = me.data.achievements;
          if (me.data.achievementUnlocks) {
            this.snapshot.achievementUnlocks = { ...this.snapshot.achievementUnlocks, ...me.data.achievementUnlocks };
          }
          this.snapshot.questCompleted = me.data.questCompleted ?? this.snapshot.questCompleted;
          this.snapshot.questProgress = me.data.questProgress ?? this.snapshot.questProgress;
          this.snapshot.streak = me.data.streak ?? this.snapshot.streak;
          this.snapshot.settings = {
            ...this.snapshot.settings,
            sharePresence: me.data.sharePresence ?? me.data.shareActivity,
            sharePublicActivity: me.data.sharePublicActivity ?? me.data.shareActivity,
            shareActivity: me.data.sharePublicActivity ?? me.data.shareActivity,
          };
          analytics.identify(me.data.id, { username: me.data.username, guest: false });
          const friends = await playerApi.friends();
          if (friends.ok) {
            this.snapshot.friends = friends.data.rows
              .filter((f) => f.status === "pending-in" || f.status === "pending-out" || f.status === "accepted")
              .map((f) => ({
                id: f.userId,
                username: f.username,
                displayName: f.displayName,
                avatar: f.avatar,
                status: f.status as Friend["status"],
                presence: f.presence === "playing" || f.presence === "online" ? f.presence : "offline",
                gameId: f.gameId,
              }));
          }
        } else if (serverHasProgress) {
          this.snapshot.xp = me.data.xp;
          this.snapshot.achievements = me.data.achievements;
          this.snapshot.questCompleted = me.data.questCompleted ?? this.snapshot.questCompleted;
          this.snapshot.questProgress = me.data.questProgress ?? this.snapshot.questProgress;
          this.snapshot.streak = me.data.streak ?? this.snapshot.streak;
        }
      }
      this.persist();
      this.emit();
    } catch {
      analytics.track("sync_failed", { kind: "hydrate" });
    }
  }

  private startPresenceHeartbeat() {
    if (typeof window === "undefined") return;
    if (this.presenceTimer) window.clearInterval(this.presenceTimer);
    const beat = () => {
      if (this.snapshot.isGuest || !this.snapshot.settings.sharePresence) return;
      void playerApi.presence("online", null);
    };
    this.presenceTimer = window.setInterval(beat, 45_000);
  }

  private async presencePlaying(gameId: string) {
    if (!this.snapshot.settings.sharePresence) return;
    void playerApi.presence("playing", gameId);
  }

  async flush() {
    if (!this.queue.length) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const pending = [...this.queue];
    this.queue = [];
    try {
      const res = await playerApi.sync(pending);
      if (!res.ok) {
        if (res.status === 503) this.snapshot.backend = "local";
        else analytics.track("sync_failed", { kind: "flush" });
        this.queue = [...pending.map((p) => ({ ...p, retryCount: p.retryCount + 1 })), ...this.queue];
      } else {
        /* memory backend still applied ops */
      }
    } catch {
      analytics.track("sync_failed", { kind: "flush" });
      this.queue = [...pending, ...this.queue];
    }
    this.persist();
  }
}

export function deviceClass() {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w <= 430) return "mobile";
  if (w <= 900) return "tablet";
  if (w <= 1440) return "laptop";
  return "desktop";
}

export function formatScore(gameId: string, score: number) {
  if (gameId === "velocity-run") return `${(score / 1000).toFixed(2)}s`;
  return Math.round(score).toLocaleString();
}

export const store = new PlayerStore();
export const productName = brand.productName;
