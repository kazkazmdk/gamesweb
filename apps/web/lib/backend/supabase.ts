import { levelFromXp } from "@gamesweb/config";
import {
  assertSessionOwnership,
  computeRunRewards,
  lowerIsBetter,
  mergeGuestIntoAccount,
  PRESENCE_STALE_MS,
  type LeaderboardEntry,
  type VerifiedStatus,
} from "@gamesweb/database";
import { utcDayKey } from "@gamesweb/game-sdk";
import type { Identity } from "@/lib/api/identity";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { commitSha, APP_VERSION } from "@/lib/version";
import type { BackendStore, OfflineRun, ScoreWriteResult, StoredProfile, StoredSave, StoredSession, SubmitScoreInput } from "@/lib/backend/types";

function admin() {
  const client = createSupabaseAdmin();
  if (!client) throw new Error("supabase_admin_missing");
  return client;
}

async function loadProfileRow(userId: string): Promise<StoredProfile | null> {
  const sb = admin();
  const { data } = await sb.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  const { data: ach } = await sb.from("player_achievements").select("achievement_id").eq("user_id", userId);
  const { data: quests } = await sb.from("quest_progress").select("*").eq("user_id", userId);
  const { data: stats } = await sb.from("player_stats").select("*").eq("user_id", userId);
  return {
    userId,
    anonymousId: data.anonymous_id,
    username: data.username,
    displayName: data.display_name,
    avatar: data.avatar,
    xp: data.xp,
    streak: data.streak,
    isGuest: data.is_guest,
    shareActivity: data.share_activity ?? true,
    achievements: (ach ?? []).map((a: { achievement_id: string }) => a.achievement_id),
    questProgress: Object.fromEntries((quests ?? []).map((q: { quest_id: string; progress: number }) => [q.quest_id, q.progress])),
    questCompleted: (quests ?? []).filter((q: { completed_at: string | null }) => q.completed_at).map((q: { quest_id: string }) => q.quest_id),
    stats: Object.fromEntries((stats ?? []).map((s: { stat_key: string; value: number }) => [s.stat_key, s.value])),
    pbCount: Number((stats ?? []).find((s: { stat_key: string }) => s.stat_key === "pb_count")?.value ?? 0),
    uniqueGamesToday: [],
    gamesPlayedToday: 0,
    dayKey: utcDayKey(),
    playedGameIds: [],
  };
}

export class SupabaseBackend implements BackendStore {
  kind = "supabase" as const;

  async startSession(input: {
    identity: Identity;
    gameId: string;
    gameVersion: string;
    device: StoredSession["device"];
    buildSha?: string;
    appVersion?: string;
  }): Promise<StoredSession> {
    const sb = admin();
    if (input.identity.userId) await this.getOrCreateProfile(input.identity);
    const { data, error } = await sb
      .from("game_sessions")
      .insert({
        user_id: input.identity.userId,
        anonymous_id: input.identity.anonymousId,
        game_id: input.gameId,
        game_version: input.gameVersion,
        device: input.device,
        build_sha: input.buildSha ?? commitSha(),
        app_version: input.appVersion ?? APP_VERSION,
        client_started_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error || !data) throw new Error("session_insert_failed");
    return {
      id: data.id,
      userId: data.user_id,
      anonymousId: data.anonymous_id,
      gameId: data.game_id,
      gameVersion: data.game_version,
      device: data.device,
      startedAt: new Date(data.started_at).getTime(),
      endedAt: data.ended_at ? new Date(data.ended_at).getTime() : null,
      durationMs: data.duration_ms,
      score: data.score,
      result: data.result,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
    };
  }

  async getSession(id: string) {
    const sb = admin();
    const { data } = await sb.from("game_sessions").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      anonymousId: data.anonymous_id,
      gameId: data.game_id,
      gameVersion: data.game_version,
      device: data.device,
      startedAt: new Date(data.started_at).getTime(),
      endedAt: data.ended_at ? new Date(data.ended_at).getTime() : null,
      durationMs: data.duration_ms,
      score: data.score,
      result: data.result,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
    } satisfies StoredSession;
  }

  async getOrCreateProfile(identity: Identity): Promise<StoredProfile> {
    if (!identity.userId) {
      return {
        userId: `guest:${identity.anonymousId}`,
        anonymousId: identity.anonymousId,
        username: `guest_${identity.anonymousId.replace(/-/g, "").slice(0, 6)}`,
        displayName: "Player",
        avatar: "orb-0",
        xp: 0,
        streak: 1,
        isGuest: true,
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
    }
    const existing = await loadProfileRow(identity.userId);
    if (existing) return existing;
    const sb = admin();
    const username = `player_${identity.userId.replace(/-/g, "").slice(0, 8)}`;
    await sb.from("profiles").insert({
      user_id: identity.userId,
      anonymous_id: identity.anonymousId,
      username,
      display_name: "Player",
      avatar: "orb-0",
      is_guest: false,
      share_activity: true,
    });
    return (await loadProfileRow(identity.userId))!;
  }

  async submitScore(input: SubmitScoreInput): Promise<ScoreWriteResult> {
    const sb = admin();
    const resolvedGameId = input.session?.gameId ?? input.gameId;
    if (!resolvedGameId) throw new Error("invalid_score");

    if (input.session && assertSessionOwnership(input.session, input.identity) !== "ok") {
      throw Object.assign(new Error("forbidden"), { code: "FORBIDDEN" });
    }

    if (input.session) {
      const { data: existing } = await sb.from("scores").select("*").eq("session_id", input.session.id).maybeSingle();
      if (existing) {
        const profile = await this.getOrCreateProfile(input.identity);
        return {
          alreadyApplied: true,
          score: {
            id: existing.id,
            sessionId: existing.session_id,
            userId: existing.user_id,
            anonymousId: existing.anonymous_id,
            gameId: existing.game_id,
            mode: existing.mode,
            score: existing.score,
            metadata: existing.metadata ?? {},
            createdAt: new Date(existing.created_at).getTime(),
            verified: existing.verified_status,
          },
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
    const ownerFilter = input.identity.userId
      ? sb.from("scores").select("score").eq("game_id", resolvedGameId).eq("mode", input.mode).eq("user_id", input.identity.userId).eq("verified_status", "verified")
      : sb.from("scores").select("score").eq("game_id", resolvedGameId).eq("mode", input.mode).eq("anonymous_id", input.identity.anonymousId).eq("verified_status", "verified");
    const { data: prevRows } = await ownerFilter;
    const lower = lowerIsBetter(resolvedGameId);
    const scores = (prevRows ?? []).map((r: { score: number }) => r.score);
    const pbBefore = scores.length ? (lower ? Math.min(...scores) : Math.max(...scores)) : lower ? Number.POSITIVE_INFINITY : 0;

    const { data: today } = input.identity.userId
      ? await sb
          .from("scores")
          .select("game_id, created_at")
          .eq("user_id", input.identity.userId)
          .gte("created_at", `${utcDayKey()}T00:00:00Z`)
      : { data: [] as Array<{ game_id: string }> };

    const uniqueGamesToday = [...new Set((today ?? []).map((r: { game_id: string }) => r.game_id))];
    const played = [...new Set((today ?? []).map((r: { game_id: string }) => r.game_id))];

    const rewards = computeRunRewards({
      gameId: resolvedGameId,
      mode: input.mode,
      score: input.score,
      durationMs: input.durationMs,
      result: input.result ?? "finish",
      metadata: input.metadata,
      verified: input.verified,
      existingAchievements: profile.achievements,
      existingXp: profile.xp,
      gamesPlayedToday: (today ?? []).length,
      uniqueGamesToday,
      playedGameIds: played,
      pbBefore,
      pbCount: profile.pbCount,
      dayKey: utcDayKey(),
      hourUtc: new Date().getUTCHours(),
      questProgress: profile.questProgress,
      questCompleted: profile.questCompleted,
    });

    if (input.session) {
      const { data: rpc, error: rpcError } = await sb.rpc("finalize_game_run", {
        p_session_id: input.session.id,
        p_identity_user_id: input.identity.userId,
        p_identity_anonymous_id: input.identity.anonymousId,
        p_mode: input.mode,
        p_score: input.score,
        p_duration_ms: input.durationMs,
        p_result: input.result ?? "finish",
        p_verified: input.verified,
        p_metadata: input.metadata,
        p_progression: {
          newXp: rewards.newXp,
          newLevel: rewards.newLevel,
          achievements: rewards.achievements,
          questsCompleted: rewards.questsCompleted,
          questProgress: rewards.questProgress,
        },
        p_flag_reasons: input.flagReasons ?? [],
        p_game_version: input.gameVersion ?? input.session.gameVersion,
        p_build_sha: input.buildSha ?? commitSha(),
        p_offline: Boolean(input.offline),
        p_client_started_at: input.clientStartedAt ? new Date(input.clientStartedAt).toISOString() : null,
        p_client_ended_at: input.clientEndedAt ? new Date(input.clientEndedAt).toISOString() : null,
      });
      if (rpcError) throw new Error(rpcError.message.includes("forbidden") ? "forbidden" : "score_insert_failed");
      const payload = rpc as { alreadyApplied?: boolean; scoreId?: string };
      return {
        alreadyApplied: Boolean(payload.alreadyApplied),
        score: {
          id: payload.scoreId ?? crypto.randomUUID(),
          sessionId: input.session.id,
          userId: input.identity.userId,
          anonymousId: input.identity.anonymousId,
          gameId: resolvedGameId,
          mode: input.mode,
          score: input.score,
          metadata: input.metadata,
          createdAt: Date.now(),
          verified: input.verified,
          offlineSubmission: Boolean(input.offline),
        },
        progression: {
          xpEarned: payload.alreadyApplied ? 0 : rewards.xpEarned,
          newLevel: rewards.newLevel,
          newXp: rewards.newXp,
          achievements: payload.alreadyApplied ? [] : rewards.achievements,
          questsCompleted: payload.alreadyApplied ? [] : rewards.questsCompleted,
        },
      };
    }

    const { data: scoreRow, error } = await sb
      .from("scores")
      .insert({
        user_id: input.identity.userId,
        anonymous_id: input.identity.anonymousId,
        game_id: resolvedGameId,
        mode: input.mode,
        score: input.score,
        metadata: input.metadata,
        verified_status: input.verified === "flagged" ? "flagged" : "unverified",
        session_id: null,
        offline_submission: true,
        flag_reasons: input.flagReasons ?? [],
        game_version: input.gameVersion,
        build_sha: input.buildSha ?? commitSha(),
        client_started_at: input.clientStartedAt ? new Date(input.clientStartedAt).toISOString() : null,
        client_ended_at: input.clientEndedAt ? new Date(input.clientEndedAt).toISOString() : null,
        local_session_id: input.localSessionId ?? null,
      })
      .select("*")
      .single();
    if (error || !scoreRow) throw new Error("score_insert_failed");

    return {
      alreadyApplied: false,
      score: {
        id: scoreRow.id,
        sessionId: scoreRow.session_id,
        userId: scoreRow.user_id,
        anonymousId: scoreRow.anonymous_id,
        gameId: scoreRow.game_id,
        mode: scoreRow.mode,
        score: scoreRow.score,
        metadata: scoreRow.metadata ?? {},
        createdAt: new Date(scoreRow.created_at).getTime(),
        verified: scoreRow.verified_status,
        offlineSubmission: true,
      },
      progression: {
        xpEarned: rewards.xpEarned,
        newLevel: rewards.newLevel,
        newXp: rewards.newXp,
        achievements: rewards.achievements,
        questsCompleted: rewards.questsCompleted,
      },
    };
  }

  async leaderboard(gameId: string, mode: string, limit: number): Promise<LeaderboardEntry[]> {
    const sb = admin();
    const { data, error } = await sb.rpc("best_verified_scores", {
      p_game_id: gameId,
      p_mode: mode,
      p_limit: limit,
    });
    if (!error && data) {
      return (data as Array<{ rank: number; display_name: string; username: string; avatar: string; score: number; created_at: string }>).map((row) => ({
        rank: row.rank,
        displayName: row.display_name,
        username: row.username,
        avatar: row.avatar,
        score: row.score,
        verified: true,
        timestamp: row.created_at,
      }));
    }

    const lower = lowerIsBetter(gameId);
    const { data: fallback } = await sb
      .from("public_scores")
      .select("score, created_at, username, display_name, avatar")
      .eq("game_id", gameId)
      .eq("mode", mode)
      .order("score", { ascending: lower })
      .limit(limit);
    return (fallback ?? []).map((row: { score: number; created_at: string; username: string; display_name: string; avatar: string }, i: number) => ({
      rank: i + 1,
      displayName: row.display_name,
      username: row.username,
      avatar: row.avatar,
      score: row.score,
      verified: true,
      timestamp: row.created_at,
    }));
  }

  async personalRank(identity: Identity, gameId: string, mode: string) {
    if (!identity.userId) return null;
    const sb = admin();
    const { data, error } = await sb.rpc("personal_verified_rank", {
      p_user_id: identity.userId,
      p_game_id: gameId,
      p_mode: mode,
    });
    if (!error && typeof data === "number") return data;
    const board = await this.leaderboard(gameId, mode, 100);
    const profile = await this.getOrCreateProfile(identity);
    return board.find((r) => r.username === profile.username)?.rank ?? null;
  }

  async upsertPresence(identity: Identity, status: import("@gamesweb/database").PresenceStatus, gameId: string | null) {
    if (!identity.userId) return;
    const profile = await this.getOrCreateProfile(identity);
    const sb = admin();
    await sb.from("presence").upsert({
      user_id: identity.userId,
      status,
      game_id: profile.shareActivity ? gameId : null,
      updated_at: new Date().toISOString(),
    });
  }

  async listPresence(identity: Identity) {
    const friends = await this.listFriends(identity);
    const accepted = friends.filter((f) => f.status === "accepted");
    return accepted.map((f) => ({
      userId: f.userId,
      status: f.presence,
      gameId: f.gameId ?? null,
      updatedAt: Date.now(),
      username: f.username,
      displayName: f.displayName,
      avatar: f.avatar,
    }));
  }

  async sendFriendRequest(identity: Identity, username: string) {
    if (!identity.userId) return { error: "auth_required" };
    const sb = admin();
    const { data: other } = await sb.from("profiles").select("user_id").ilike("username", username).maybeSingle();
    if (!other) return { error: "not_found" };
    if (other.user_id === identity.userId) return { error: "self" };
    const { data: blocked } = await sb
      .from("friendships")
      .select("status")
      .eq("status", "blocked")
      .or(
        `and(requester_id.eq.${identity.userId},addressee_id.eq.${other.user_id}),and(requester_id.eq.${other.user_id},addressee_id.eq.${identity.userId})`,
      )
      .maybeSingle();
    if (blocked) return { error: "blocked" };
    const { error } = await sb.from("friendships").insert({
      requester_id: identity.userId,
      addressee_id: other.user_id,
      status: "pending",
    });
    if (error) return { error: "duplicate" };
    return { ok: true as const };
  }

  async friendAction(identity: Identity, userId: string, action: "accept" | "decline" | "remove" | "block") {
    if (!identity.userId) return { error: "auth_required" };
    const sb = admin();
    if (action === "block") {
      await sb.from("friendships").delete().or(
        `and(requester_id.eq.${identity.userId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${identity.userId})`,
      );
      await sb.from("friendships").insert({ requester_id: identity.userId, addressee_id: userId, status: "blocked" });
      return { ok: true as const };
    }
    if (action === "accept") {
      const { data } = await sb
        .from("friendships")
        .update({ status: "accepted" })
        .eq("requester_id", userId)
        .eq("addressee_id", identity.userId)
        .eq("status", "pending")
        .select("requester_id");
      if (!data?.length) return { error: "not_found" };
      return { ok: true as const };
    }
    await sb.from("friendships").delete().or(
      `and(requester_id.eq.${identity.userId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${identity.userId})`,
    );
    return { ok: true as const };
  }

  async listFriends(identity: Identity) {
    if (!identity.userId) return [];
    const sb = admin();
    const { data } = await sb
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(`requester_id.eq.${identity.userId},addressee_id.eq.${identity.userId}`);
    const visible = (data ?? []).filter((f: { status: string }) => f.status !== "blocked");
    const ids = [...new Set(visible.flatMap((f: { requester_id: string; addressee_id: string }) => [f.requester_id, f.addressee_id]))].filter(
      (id) => id !== identity.userId,
    );
    const { data: profiles } = ids.length ? await sb.from("profiles").select("user_id, username, display_name, avatar, share_activity").in("user_id", ids) : { data: [] };
    const { data: presence } = ids.length ? await sb.from("presence").select("*").in("user_id", ids) : { data: [] };
    const pmap = new Map((profiles ?? []).map((p: { user_id: string }) => [p.user_id, p]));
    const prmap = new Map((presence ?? []).map((p: { user_id: string }) => [p.user_id, p]));
    return visible.map((f: { requester_id: string; addressee_id: string; status: string }) => {
      const otherId = f.requester_id === identity.userId ? f.addressee_id : f.requester_id;
      const p = pmap.get(otherId) as
        | { username: string; display_name: string; avatar: string; share_activity: boolean }
        | undefined;
      const pr = prmap.get(otherId) as { status: string; game_id: string | null; updated_at: string } | undefined;
      const stale = !pr || Date.now() - new Date(pr.updated_at).getTime() > PRESENCE_STALE_MS;
      const status =
        f.status === "accepted"
          ? ("accepted" as const)
          : f.requester_id === identity.userId
            ? ("pending-out" as const)
            : ("pending-in" as const);
      return {
        userId: otherId,
        username: p?.username ?? "player",
        displayName: p?.display_name ?? "Player",
        avatar: p?.avatar ?? "orb-0",
        status,
        presence: (stale || !p?.share_activity ? "offline" : pr?.status) as "online" | "away" | "playing" | "offline",
        gameId: stale || !p?.share_activity ? undefined : (pr?.game_id ?? undefined),
      };
    });
  }

  async searchUsers(identity: Identity, q: string) {
    const sb = admin();
    const me = identity.userId ? await this.getOrCreateProfile(identity) : null;
    const { data } = await sb
      .from("public_profiles")
      .select("username, display_name, avatar")
      .ilike("username", `${q}%`)
      .limit(12);
    return (data ?? [])
      .filter((p: { username: string }) => p.username !== identity.userId && p.username !== me?.username)
      .slice(0, 8)
      .map((p: { username: string; display_name: string; avatar: string }) => ({
        username: p.username,
        displayName: p.display_name,
        avatar: p.avatar,
      }));
  }

  async getSave(identity: Identity, gameId: string) {
    if (!identity.userId) return null;
    const sb = admin();
    const { data } = await sb.from("game_saves").select("*").eq("user_id", identity.userId).eq("game_id", gameId).maybeSingle();
    if (!data) return null;
    return {
      userId: data.user_id,
      gameId: data.game_id,
      version: data.version,
      payload: data.payload,
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }

  async putSave(identity: Identity, save: Omit<StoredSave, "userId"> & { userId?: string }) {
    if (!identity.userId) return { error: "auth_required" };
    const sb = admin();
    const { data: current } = await sb.from("game_saves").select("updated_at").eq("user_id", identity.userId).eq("game_id", save.gameId).maybeSingle();
    const incoming = save.updatedAt ?? Date.now();
    if (current && new Date(current.updated_at).getTime() > incoming) {
      return (await this.getSave(identity, save.gameId))!;
    }
    const { data, error } = await sb
      .from("game_saves")
      .upsert({
        user_id: identity.userId,
        game_id: save.gameId,
        version: save.version,
        payload: save.payload,
        updated_at: new Date(incoming).toISOString(),
      })
      .select("*")
      .single();
    if (error || !data) return { error: "save_failed" };
    return {
      userId: data.user_id,
      gameId: data.game_id,
      version: data.version,
      payload: data.payload,
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }

  async updateProfile(identity: Identity, patch: Partial<Pick<StoredProfile, "username" | "displayName" | "avatar" | "shareActivity">>) {
    if (!identity.userId) return { error: "auth_required" };
    const sb = admin();
    const { error } = await sb
      .from("profiles")
      .update({
        username: patch.username,
        display_name: patch.displayName,
        avatar: patch.avatar,
        share_activity: patch.shareActivity,
      })
      .eq("user_id", identity.userId);
    if (error) return { error: error.code === "23505" ? "username_taken" : "update_failed" };
    return this.getOrCreateProfile(identity);
  }

  async mergeGuest(identity: Identity, input: { offlineRuns?: OfflineRun[] } = {}) {
    if (!identity.userId) return { error: "auth_required" };
    const anonymousId = identity.anonymousId;
    const sb = admin();
    const { data: existing } = await sb.from("guest_migrations").select("anonymous_id").eq("anonymous_id", anonymousId).maybeSingle();
    if (existing) {
      return { ok: true as const, alreadyMerged: true, profile: await this.getOrCreateProfile(identity) };
    }
    const profile = await this.getOrCreateProfile(identity);
    const account = await this.accountProgress(identity.userId);
    const { data: guestScores } = await sb.from("scores").select("*").eq("anonymous_id", anonymousId).is("user_id", null);
    const merged = mergeGuestIntoAccount(account, {
      xp: 0,
      achievements: [],
      scores: (guestScores ?? []).map((s: { id: string; game_id: string; mode: string; score: number; created_at: string; verified_status: VerifiedStatus; metadata: Record<string, number | string | boolean> }) => ({
        id: s.id,
        gameId: s.game_id,
        mode: s.mode,
        score: s.score,
        at: new Date(s.created_at).getTime(),
        verified: s.verified_status,
        metadata: s.metadata ?? {},
      })),
    });
    const { error } = await sb.rpc("merge_guest_progress", {
      p_user_id: identity.userId,
      p_anonymous_id: anonymousId,
      p_xp: merged.xp,
      p_level: levelFromXp(merged.xp).level,
      p_streak: merged.streak,
      p_achievements: merged.achievements,
      p_quest_progress: merged.questProgress,
      p_quest_completed: merged.questCompleted,
      p_offline_runs: (input.offlineRuns ?? []).map((run) => ({
        gameId: run.gameId,
        mode: run.mode,
        score: run.score,
        metadata: run.metadata,
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        localSessionId: run.localSessionId,
        gameVersion: run.gameVersion,
      })),
    });
    if (error) return { error: "merge_failed" };
    return { ok: true as const, alreadyMerged: false, profile: { ...profile, xp: merged.xp, achievements: merged.achievements } };
  }

  async getIdempotency(scope: string, key: string) {
    const sb = admin();
    const { data } = await sb.from("idempotency_keys").select("status, response").eq("scope", scope).eq("key", key).maybeSingle();
    if (!data) return null;
    return { status: data.status, response: data.response };
  }

  async putIdempotency(scope: string, key: string, endpoint: string, status: number, response: unknown, identity: Identity) {
    const sb = admin();
    await sb.from("idempotency_keys").upsert({
      scope,
      key,
      endpoint,
      status,
      response,
      user_id: identity.userId,
      anonymous_id: identity.anonymousId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  async accountProgress(userId: string) {
    const profile = await loadProfileRow(userId);
    const sb = admin();
    const { data: scores } = await sb.from("scores").select("*").eq("user_id", userId);
    const { data: saves } = await sb.from("game_saves").select("*").eq("user_id", userId);
    return {
      xp: profile?.xp ?? 0,
      achievements: profile?.achievements ?? [],
      scores: (scores ?? []).map((s: { id: string; game_id: string; mode: string; score: number; created_at: string; verified_status: VerifiedStatus; metadata: Record<string, number | string | boolean> }) => ({
        id: s.id,
        gameId: s.game_id,
        mode: s.mode,
        score: s.score,
        at: new Date(s.created_at).getTime(),
        verified: s.verified_status,
        metadata: s.metadata ?? {},
      })),
      saves: Object.fromEntries(
        (saves ?? []).map((s: { game_id: string; version: string; payload: Record<string, unknown>; updated_at: string }) => [
          s.game_id,
          { version: s.version, payload: s.payload, updatedAt: new Date(s.updated_at).getTime() },
        ]),
      ),
      questProgress: profile?.questProgress ?? {},
      questCompleted: profile?.questCompleted ?? [],
      stats: profile?.stats ?? {},
      streak: profile?.streak ?? 0,
    };
  }
}

let singleton: SupabaseBackend | undefined;
export function supabaseStore() {
  singleton ??= new SupabaseBackend();
  return singleton;
}
