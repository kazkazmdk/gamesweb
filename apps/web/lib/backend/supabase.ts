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
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { BackendStore, ScoreWriteResult, StoredProfile, StoredSave, StoredSession } from "@/lib/backend/types";

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
    const sb = admin();
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

    const profile = await this.getOrCreateProfile(input.identity);
    const { data: prevRows } = await sb
      .from("scores")
      .select("score")
      .eq("game_id", input.session.gameId)
      .eq("mode", input.mode)
      .eq("user_id", input.identity.userId)
      .neq("verified_status", "flagged");
    const lower = lowerIsBetter(input.session.gameId);
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
      gameId: input.session.gameId,
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

    const { data: scoreRow, error } = await sb
      .from("scores")
      .insert({
        user_id: input.identity.userId,
        anonymous_id: input.identity.anonymousId,
        game_id: input.session.gameId,
        mode: input.mode,
        score: input.score,
        metadata: input.metadata,
        verified_status: input.verified,
        session_id: input.session.id,
      })
      .select("*")
      .single();
    if (error || !scoreRow) throw new Error("score_insert_failed");

    await sb
      .from("game_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_ms: input.durationMs,
        score: input.score,
        result: input.result ?? "finish",
        metadata: input.metadata,
      })
      .eq("id", input.session.id);

    if (input.identity.userId) {
      await sb.from("profiles").update({ xp: rewards.newXp, level: rewards.newLevel, last_seen_at: new Date().toISOString() }).eq("user_id", input.identity.userId);
      for (const id of rewards.achievements) {
        await sb.from("player_achievements").upsert({ user_id: input.identity.userId, achievement_id: id });
      }
      for (const [questId, progress] of Object.entries(rewards.questProgress)) {
        const completed = rewards.questsCompleted.includes(questId);
        await sb.from("quest_progress").upsert({
          quest_id: questId,
          user_id: input.identity.userId,
          progress,
          completed_at: completed ? new Date().toISOString() : null,
        });
      }
    }

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
    const lower = lowerIsBetter(gameId);
    const { data } = await sb
      .from("scores")
      .select("score, created_at, user_id, verified_status, profiles!inner(username, display_name, avatar, is_seed)")
      .eq("game_id", gameId)
      .eq("mode", mode)
      .eq("verified_status", "verified")
      .eq("profiles.is_seed", false)
      .not("user_id", "is", null)
      .order("score", { ascending: lower })
      .limit(400);
    const best = new Map<string, { score: number; created_at: string; username: string; display_name: string; avatar: string }>();
    for (const row of data ?? []) {
      const p = row.profiles as unknown as { username: string; display_name: string; avatar: string; is_seed: boolean };
      if (!row.user_id || p.is_seed) continue;
      const cur = best.get(row.user_id);
      if (!cur || (lower ? row.score < cur.score : row.score > cur.score)) {
        best.set(row.user_id, {
          score: row.score,
          created_at: row.created_at,
          username: p.username,
          display_name: p.display_name,
          avatar: p.avatar,
        });
      }
    }
    return [...best.values()]
      .sort((a, b) => (lower ? a.score - b.score : b.score - a.score))
      .slice(0, limit)
      .map((row, i) => ({
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
    const board = await this.leaderboard(gameId, mode, 100);
    const profile = await this.getOrCreateProfile(identity);
    return board.find((r) => r.username === profile.username)?.rank ?? null;
  }

  async upsertPresence(identity: Identity, status: import("@gamesweb/database").PresenceStatus, gameId: string | null) {
    if (!identity.userId) return;
    const sb = admin();
    await sb.from("presence").upsert({
      user_id: identity.userId,
      status,
      game_id: gameId,
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
    const ids = [...new Set((data ?? []).flatMap((f: { requester_id: string; addressee_id: string }) => [f.requester_id, f.addressee_id]))].filter(
      (id) => id !== identity.userId,
    );
    const { data: profiles } = ids.length ? await sb.from("profiles").select("user_id, username, display_name, avatar, share_activity").in("user_id", ids) : { data: [] };
    const { data: presence } = ids.length ? await sb.from("presence").select("*").in("user_id", ids) : { data: [] };
    const pmap = new Map((profiles ?? []).map((p: { user_id: string }) => [p.user_id, p]));
    const prmap = new Map((presence ?? []).map((p: { user_id: string }) => [p.user_id, p]));
    return (data ?? [])
      .filter((f: { status: string; requester_id: string }) => f.status !== "blocked" || f.requester_id === identity.userId)
      .map((f: { requester_id: string; addressee_id: string; status: string }) => {
        const otherId = f.requester_id === identity.userId ? f.addressee_id : f.requester_id;
        const p = pmap.get(otherId) as
          | { username: string; display_name: string; avatar: string; share_activity: boolean }
          | undefined;
        const pr = prmap.get(otherId) as { status: string; game_id: string | null; updated_at: string } | undefined;
        const stale = !pr || Date.now() - new Date(pr.updated_at).getTime() > PRESENCE_STALE_MS;
        const status =
          f.status === "blocked"
            ? ("blocked" as const)
            : f.status === "accepted"
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
    const { data } = await sb
      .from("public_profiles")
      .select("username, display_name, avatar")
      .ilike("username", `${q}%`)
      .limit(8);
    return (data ?? [])
      .filter((p: { username: string }) => p.username !== identity.userId)
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

  async mergeGuest(identity: Identity, anonymousId: string, snapshot: GuestSnapshot) {
    if (!identity.userId) return { error: "auth_required" };
    const sb = admin();
    const { data: existing } = await sb.from("guest_migrations").select("anonymous_id").eq("anonymous_id", anonymousId).maybeSingle();
    if (existing) {
      return { ok: true as const, alreadyMerged: true, profile: await this.getOrCreateProfile(identity) };
    }
    const profile = await this.getOrCreateProfile(identity);
    const account = await this.accountProgress(identity.userId);
    const merged = mergeGuestIntoAccount(account, snapshot);
    await sb.from("profiles").update({ xp: merged.xp, level: levelFromXp(merged.xp).level, streak: merged.streak, is_guest: false, anonymous_id: anonymousId }).eq("user_id", identity.userId);
    for (const id of merged.achievements) {
      await sb.from("player_achievements").upsert({ user_id: identity.userId, achievement_id: id });
    }
    await sb.from("guest_migrations").insert({
      anonymous_id: anonymousId,
      user_id: identity.userId,
      xp_before: account.xp,
      xp_after: merged.xp,
    });
    return { ok: true as const, alreadyMerged: false, profile: { ...profile, xp: merged.xp, achievements: merged.achievements } };
  }

  async getIdempotency(key: string) {
    const sb = admin();
    const { data } = await sb.from("idempotency_keys").select("status, response").eq("key", key).maybeSingle();
    if (!data) return null;
    return { status: data.status, response: data.response };
  }

  async putIdempotency(key: string, status: number, response: unknown) {
    const sb = admin();
    await sb.from("idempotency_keys").upsert({ key, endpoint: "api", status, response });
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
