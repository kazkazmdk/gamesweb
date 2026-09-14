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
      verification: { status: string; reasons: string[] };
      alreadyApplied: boolean;
      progressionDiff: ProgressionDiff;
      scoreId: string;
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
      achievements: string[];
      questCompleted: string[];
      questProgress: Record<string, number>;
      streak: number;
    }>(await fetch("/api/player/me"));
  },
  async updateProfile(patch: { displayName?: string; shareActivity?: boolean; username?: string; avatar?: string }) {
    return parse(await fetch("/api/player/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }));
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
};
