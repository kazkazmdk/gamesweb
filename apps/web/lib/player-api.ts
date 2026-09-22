export type ApiErrorBody = { error: { code: string; message: string } };

async function parse<T>(res: Response): Promise<{ ok: true; data: T } | { ok: false; status: number; error: ApiErrorBody["error"] }> {
  const data = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok) {
    const err = data && typeof data === "object" && "error" in data ? (data as ApiErrorBody).error : { code: "INTERNAL", message: "Request failed." };
    return { ok: false, status: res.status, error: err };
  }
  return { ok: true, data: data as T };
}

export type ProgressionDiff = {
  xpEarned: number;
  newLevel: number;
  newXp: number;
  achievements: string[];
  questsCompleted: string[];
};

export const playerApi = {
  async startSession(input: { gameId: string; gameVersion: string; device: string }) {
    return parse<{ sessionId: string; startedAt: string; gameVersion: string }>(
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  },
  async submitScore(input: {
    sessionId?: string;
    gameId: string;
    gameVersion: string;
    mode: string;
    score: number;
    durationMs: number;
    startedAt: number;
    endedAt: number;
    metadata: Record<string, number | string | boolean>;
    offline?: boolean;
    offlineSubmission?: boolean;
    localSessionId?: string;
    idempotencyKey?: string;
  }) {
    return parse<{
      verification?: { status: string; reasons: string[] };
      alreadyApplied: boolean;
      progressionDiff?: ProgressionDiff;
      scoreId?: string;
    }>(
      await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  },
  async leaderboard(game: string, mode: string) {
    return parse<{ rows: Array<{ rank: number; displayName: string; username: string; avatar: string; score: number; verified: boolean; timestamp: string }> }>(
      await fetch(`/api/leaderboard?game=${encodeURIComponent(game)}&mode=${encodeURIComponent(mode)}`),
    );
  },
  async myRank(game: string, mode: string) {
    return parse<{ personalRank: number | null }>(
      await fetch(`/api/leaderboard/me?game=${encodeURIComponent(game)}&mode=${encodeURIComponent(mode)}`),
    );
  },
  async me() {
    return parse<{
      id: string;
      isGuest: boolean;
      username: string;
      displayName: string;
      avatar: string;
      xp: number;
      level: number;
      shareActivity: boolean;
      sharePresence: boolean;
      sharePublicActivity: boolean;
      achievements: string[];
      achievementUnlocks?: Record<string, number>;
      questCompleted: string[];
      questProgress: Record<string, number>;
      streak: number;
    }>(await fetch("/api/player/me"));
  },
  async updateProfile(patch: { displayName?: string; shareActivity?: boolean; sharePresence?: boolean; sharePublicActivity?: boolean; username?: string; avatar?: string }) {
    return parse(await fetch("/api/player/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }));
  },
  async logout() {
    return parse<{ ok: true }>(await fetch("/api/player/logout", { method: "POST" }));
  },
  async deleteAccount() {
    return parse<{ ok: true }>(
      await fetch("/api/player/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      }),
    );
  },
  async merge(input: {
    offlineRuns?: Array<{
      gameId: string;
      mode: string;
      score: number;
      durationMs: number;
      startedAt: number;
      endedAt: number;
      metadata: Record<string, number | string | boolean>;
      localSessionId?: string;
    }>;
  }) {
    return parse<{ ok: true; alreadyMerged: boolean; xp: number; achievements: string[] }>(
      await fetch("/api/player/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
  },
  async friends() {
    return parse<{ rows: Array<{ userId: string; username: string; displayName: string; avatar: string; status: string; presence: string; gameId?: string }> }>(
      await fetch("/api/friends"),
    );
  },
  async friendRequest(username: string) {
    return parse(await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }));
  },
  async friendAction(userId: string, action: string) {
    return parse(await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) }));
  },
  async presence(status: string, gameId?: string | null) {
    return parse(await fetch("/api/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, gameId: gameId ?? null }) }));
  },
  async sync(ops: Array<Record<string, unknown>>) {
    return parse(await fetch("/api/player/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }) }));
  },
  async putSave(gameId: string, version: string, payload: Record<string, unknown>) {
    return parse(await fetch("/api/saves", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, version, payload, updatedAt: Date.now() }) }));
  },
  async publicProfile(username: string) {
    return parse<{
      username: string;
      displayName: string;
      avatar: string;
      level: number;
      favoriteGameId: string | null;
      records: Array<{ gameId: string; mode: string; score: number }>;
      achievements: string[];
      activity: Array<{ gameId: string; event: string; score: number; at: number }> | null;
    }>(await fetch(`/api/profile/${encodeURIComponent(username)}`));
  },
  async searchPlayers(q: string) {
    return parse<{ rows: Array<{ username: string; displayName: string; avatar: string }> }>(
      await fetch(`/api/friends?q=${encodeURIComponent(q)}`),
    );
  },
  async createParty(hostName: string) {
    return parse<{ party: import("@/lib/social/arcade-store").PartyState; persistence: string; you: string }>(
      await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", hostName }) }),
    );
  },
  async joinParty(code: string, name: string) {
    return parse<{ party: import("@/lib/social/arcade-store").PartyState; persistence: string; you: string }>(
      await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", code, name }) }),
    );
  },
  async getParty(code: string) {
    return parse<{ party: import("@/lib/social/arcade-store").PartyState; persistence: string; you: string }>(await fetch(`/api/parties?code=${encodeURIComponent(code)}`));
  },
  async startParty(code: string) {
    return parse<{ party: import("@/lib/social/arcade-store").PartyState; persistence: string }>(
      await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", code }) }),
    );
  },
  async advanceParty(code: string) {
    return parse<{ party: import("@/lib/social/arcade-store").PartyState; persistence: string }>(
      await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "advance", code }) }),
    );
  },
  async submitPartyRound(code: string, runId: string) {
    return parse<{ party: import("@/lib/social/arcade-store").PartyState }>(
      await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit-round", code, runId }) }),
    );
  },
  async readyParty(code: string, ready: boolean) {
    return parse<{ party: import("@/lib/social/arcade-store").PartyState; persistence: string }>(
      await fetch("/api/parties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ready", code, ready }) }),
    );
  },
  async rivals() {
    return parse<{ rows: import("@/lib/social/arcade-store").RivalRow[] }>(await fetch("/api/rivals"));
  },
  async createChallenge(input: Record<string, unknown>) {
    return parse<{ challenge: import("@gamesweb/game-sdk").ChallengeRecord; url: string; persistence: string }>(
      await fetch("/api/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", ...input }) }),
    );
  },
  async getChallenge(code: string) {
    return parse<{ challenge: import("@gamesweb/game-sdk").ChallengeRecord; persistence: string }>(
      await fetch(`/api/challenges?code=${encodeURIComponent(code)}`),
    );
  },
  async attemptChallenge(input: Record<string, unknown>) {
    return parse<{
      ok: true;
      challenge: import("@gamesweb/game-sdk").ChallengeRecord;
      outcome: "win" | "loss" | "draw" | "pending";
      duplicate: boolean;
      persistence: string;
    }>(await fetch("/api/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "attempt", ...input }) }));
  },
  async inbox() {
    return parse<{ items: Array<{ id: string; type: string; title: string; body: string; href: string; at: number; read: boolean }> }>(await fetch("/api/inbox"));
  },
  async markInboxRead(id: string) {
    return parse(await fetch("/api/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }));
  },
};
