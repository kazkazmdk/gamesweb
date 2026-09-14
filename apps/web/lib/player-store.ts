import { analytics } from "@gamesweb/analytics";
import { brand, levelFromXp, storageKeys, xpRewards } from "@gamesweb/config";
import { validateScore, type VerifiedStatus } from "@gamesweb/database";
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
  type QuestDefinition,
  type ScorePayload,
} from "@gamesweb/game-sdk";

export type StoredScore = {
  id: string;
  gameId: string;
  mode: string;
  score: number;
  at: number;
  verified: VerifiedStatus;
  metadata: Record<string, number | string | boolean>;
};

export type PlayRecord = {
  gameId: string;
  at: number;
  durationMs: number;
  score: number;
  result: string;
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
  settings: AudioSettings & {
    reducedMotion: boolean;
    shareActivity: boolean;
  };
  friends: Friend[];
  pbCount: number;
  sessionGames: string[];
  uniqueGamesToday: string[];
  dayKey: string;
  gamesPlayedToday: number;
  pendingSavePrompt: boolean;
  backend: "local" | "supabase";
};

const defaultAudio: AudioSettings = { master: 0.8, music: 0.45, sfx: 0.7, muted: false };

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `g-${Math.random().toString(16).slice(2)}-${Date.now()}`;
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
    settings: { ...defaultAudio, reducedMotion: false, shareActivity: true },
    friends: [],
    pbCount: 0,
    sessionGames: [],
    uniqueGamesToday: [],
    dayKey: day,
    gamesPlayedToday: 0,
    pendingSavePrompt: false,
    backend: "local",
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
  settings: { ...defaultAudio, reducedMotion: false, shareActivity: true },
  friends: [],
  pbCount: 0,
  sessionGames: [],
  uniqueGamesToday: [],
  dayKey: "1970-01-01",
  gamesPlayedToday: 0,
  pendingSavePrompt: false,
  backend: "local",
};

type Listener = () => void;

class PlayerStore {
  snapshot: PlayerSnapshot = SSR_PLAYER;
  toasts: Toast[] = [];
  private listeners = new Set<Listener>();
  private sessionId = uid();
  private ready = false;
  private queue: Array<Record<string, unknown>> = [];

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
        this.snapshot = { ...emptyPlayer(), ...parsed };
      } else {
        this.snapshot = emptyPlayer();
      }
      const q = localStorage.getItem(storageKeys.syncQueue);
      if (q) this.queue = JSON.parse(q) as Array<Record<string, unknown>>;
    } catch {
      this.snapshot = emptyPlayer();
    }
    this.rollDay();
    this.ready = true;
    analytics.identify(this.snapshot.authId ?? this.snapshot.id, {
      guest: this.snapshot.isGuest,
      level: levelFromXp(this.snapshot.xp).level,
    });
    analytics.track("platform_loaded", { device: deviceClass() });
    this.emit();
    void this.flush();
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
    this.enqueue({ type: "score", row, sessionId });
    this.persist();
    this.emit();
    return { personalBest: improved, previous: Number.isFinite(prev) ? prev : 0 };
  }

  async unlock(key: string) {
    const def = allAchievements().find((a) => a.key === key);
    const id = `${def?.gameId ?? "platform"}:${key}`;
    if (!def || this.snapshot.achievements.includes(id)) return false;
    this.snapshot.achievements = [...this.snapshot.achievements, id];
    analytics.track("achievement_unlocked", { key, gameId: def.gameId });
    this.toast({ kind: "achievement", title: def.name, body: def.description });
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
      { gameId: opts.gameId, at: Date.now(), durationMs: opts.durationMs, score: opts.score, result: opts.result },
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

  createPlatform(gameId: string, hooks: { onPause: () => void; onHud?: (p: Record<string, number>) => void }): PlatformSDK {
    let session = { id: uid(), gameId, startedAt: Date.now(), version: getManifest(gameId)?.version ?? "1.0.0" };
    return {
      init: () => undefined,
      session: {
        start: () => {
          session = { id: uid(), gameId, startedAt: Date.now(), version: getManifest(gameId)?.version ?? "1.0.0" };
          analytics.track("gameplay_started", { gameId, sessionId: session.id });
          return session;
        },
        end: async (result) => {
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
          if (event.name === "hud" && hooks.onHud && event.props) {
            const nums: Record<string, number> = {};
            for (const [k, v] of Object.entries(event.props)) {
              if (typeof v === "number") nums[k] = v;
            }
            hooks.onHud(nums);
          }
          if (event.name === "game_retry") analytics.track("game_retry", { gameId });
          if (event.name === "gameplay_started") analytics.track("gameplay_started", { gameId });
        },
      },
      pause: { request: () => hooks.onPause() },
    };
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
    const list = you
      ? [{ name: this.snapshot.displayName, score: you.score, isYou: true }]
      : [];
    if (process.env.NEXT_PUBLIC_SHOW_SEED_DATA === "true") {
      list.push(
        { name: "RIVAL_01", score: seedScore(gameId, 1), isYou: false },
        { name: "RIVAL_02", score: seedScore(gameId, 2), isYou: false },
      );
    }
    list.sort((a, b) => (lower ? a.score - b.score : b.score - a.score));
    return list.slice(0, 20);
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
    if (!ref || ref === this.snapshot.username) return;
    if (this.snapshot.friends.some((f) => f.username === ref)) return;
    this.snapshot.friends = [
      ...this.snapshot.friends,
      {
        id: uid(),
        username: ref,
        displayName: ref,
        avatar: "orb-3",
        status: "pending-in",
        presence: "offline",
      },
    ];
    this.persist();
    this.emit();
  }

  acceptFriend(id: string) {
    this.snapshot.friends = this.snapshot.friends.map((f) =>
      f.id === id ? { ...f, status: "accepted" as const, presence: "online" as const } : f,
    );
    analytics.track("friend_added");
    this.persist();
    this.emit();
  }

  removeFriend(id: string) {
    this.snapshot.friends = this.snapshot.friends.filter((f) => f.id !== id);
    this.persist();
    this.emit();
  }

  dismissSavePrompt() {
    this.snapshot.pendingSavePrompt = false;
    this.persist();
    this.emit();
  }

  async mergeAccount(authId: string, username: string) {
    const guest = this.snapshot;
    this.snapshot = {
      ...guest,
      authId,
      isGuest: false,
      username,
      displayName: username,
      pendingSavePrompt: false,
    };
    analytics.track("guest_merged", { authId });
    analytics.track("signup_completed");
    analytics.identify(authId, { username });
    this.persist();
    this.emit();
  }

  private enqueue(op: Record<string, unknown>) {
    this.queue.push({ ...op, at: Date.now() });
    this.persist();
    void this.flush();
  }

  async flush() {
    if (!this.queue.length) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      this.snapshot.backend = "local";
      return;
    }
    const pending = [...this.queue];
    this.queue = [];
    try {
      const res = await fetch("/api/player/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: this.snapshot, ops: pending }),
      });
      if (!res.ok) this.queue = [...pending, ...this.queue];
      else this.snapshot.backend = "supabase";
    } catch {
      this.queue = [...pending, ...this.queue];
    }
    this.persist();
  }
}

function seedScore(gameId: string, n: number) {
  if (gameId === "velocity-run") return 40000 + n * 3500;
  if (gameId === "swarm-protocol") return 18000 - n * 2400;
  return 42000 - n * 6000;
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
