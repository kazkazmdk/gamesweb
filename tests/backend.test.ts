import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MemoryBackend } from "../apps/web/lib/backend/memory.ts";
import { achievementId, assertSessionOwnership, boundedJsonSize, GuestMergeSchema, StartSessionSchema, SubmitScoreSchema } from "../packages/database/src/index.ts";

const identity = { userId: "11111111-1111-4111-8111-111111111111", anonymousId: "anon-1", email: null };

describe("schemas", () => {
  it("rejects empty score bodies", () => {
    expect(SubmitScoreSchema.safeParse({}).success).toBe(false);
  });
  it("accepts a session start", () => {
    expect(StartSessionSchema.safeParse({ gameId: "neon-drift", gameVersion: "1.0.0" }).success).toBe(true);
  });
  it("rejects unknown games", () => {
    expect(StartSessionSchema.safeParse({ gameId: "doom", gameVersion: "1" }).success).toBe(false);
  });
});

describe("memory backend", () => {
  it("creates a session and persists a verified score once", async () => {
    const store = new MemoryBackend();
    const session = await store.startSession({
      identity,
      gameId: "neon-drift",
      gameVersion: "1.0.0",
      device: "desktop",
    });
    const first = await store.submitScore({
      identity,
      session,
      mode: "circuit",
      score: 12000,
      durationMs: 40000,
      metadata: { laps: 1, combo: 2, wallHits: 0 },
      verified: "verified",
    });
    expect(first.alreadyApplied).toBe(false);
    expect(first.progression.xpEarned).toBeGreaterThan(0);
    session.endedAt = null;
    const second = await store.submitScore({
      identity,
      session: { ...session, endedAt: Date.now() },
      mode: "circuit",
      score: 12000,
      durationMs: 40000,
      metadata: { laps: 1, combo: 2, wallHits: 0 },
      verified: "verified",
    });
    expect(second.alreadyApplied).toBe(true);
    const board = await store.leaderboard("neon-drift", "circuit", 10);
    expect(board[0]?.score).toBe(12000);
    expect(board[0]?.verified).toBe(true);
  });

  it("merges a guest only once from cookie-bound server scores", async () => {
    const store = new MemoryBackend();
    const guest = { userId: null, anonymousId: "guest-abc", email: null };
    const session = await store.startSession({
      identity: guest,
      gameId: "neon-drift",
      gameVersion: "1.0.0",
      device: "desktop",
    });
    await store.submitScore({
      identity: guest,
      session,
      gameId: "neon-drift",
      mode: "circuit",
      score: 25000,
      durationMs: 40000,
      metadata: { laps: 1, combo: 2, wallHits: 0 },
      verified: "verified",
    });
    const authed = { ...identity, anonymousId: "guest-abc" };
    const first = await store.mergeGuest(authed);
    const second = await store.mergeGuest(authed);
    expect(first).toMatchObject({ ok: true, alreadyMerged: false });
    expect(second).toMatchObject({ ok: true, alreadyMerged: true });
    if ("profile" in first) {
      expect(first.profile.achievements).toContain("neon-drift:score-25k");
      expect(first.profile.xp).toBeGreaterThan(0);
    }
    const after = await store.getOrCreateProfile(authed);
    const third = await store.mergeGuest(authed);
    if ("profile" in third) expect(third.profile.xp).toBe(after.xp);
  });

  it("rejects guest B submitting guest A session", async () => {
    const store = new MemoryBackend();
    const a = { userId: null, anonymousId: "guest-a", email: null };
    const b = { userId: null, anonymousId: "guest-b", email: null };
    const session = await store.startSession({ identity: a, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
    await expect(
      store.submitScore({
        identity: b,
        session,
        gameId: "neon-drift",
        mode: "circuit",
        score: 12000,
        durationMs: 40000,
        metadata: { laps: 1, combo: 1, wallHits: 0 },
        verified: "verified",
      }),
    ).rejects.toThrow();
  });

  it("isolates idempotency keys across identities", async () => {
    const store = new MemoryBackend();
    const a = { userId: "11111111-1111-4111-8111-111111111111", anonymousId: "a", email: null };
    const b = { userId: "22222222-2222-4222-8222-222222222222", anonymousId: "b", email: null };
    await store.putIdempotency("user:11111111-1111-4111-8111-111111111111", "score:same", "score", 200, { owner: "a" }, a);
    expect(await store.getIdempotency("user:22222222-2222-4222-8222-222222222222", "score:same")).toBeNull();
    expect((await store.getIdempotency("user:11111111-1111-4111-8111-111111111111", "score:same"))?.response).toEqual({ owner: "a" });
  });

  it("keeps unverified scores off the public board and blocked users out of friends", async () => {
    const store = new MemoryBackend();
    const a = identity;
    const other = { userId: "22222222-2222-4222-8222-222222222222", anonymousId: "o", email: null };
    await store.getOrCreateProfile(a);
    await store.getOrCreateProfile(other);
    const session = await store.startSession({ identity: a, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
    await store.submitScore({
      identity: a,
      session,
      gameId: "neon-drift",
      mode: "circuit",
      score: 88000,
      durationMs: 40000,
      metadata: { laps: 1, combo: 1, wallHits: 0 },
      verified: "unverified",
    });
    expect(await store.leaderboard("neon-drift", "circuit", 10)).toEqual([]);
    await store.sendFriendRequest(a, (await store.getOrCreateProfile(other)).username);
    await store.friendAction(other, a.userId!, "accept");
    await store.friendAction(a, other.userId!, "block");
    const friends = await store.listFriends(a);
    expect(friends.some((f) => f.userId === other.userId && f.status === "accepted")).toBe(false);
    expect(friends.some((f) => f.status === "blocked")).toBe(false);
  });

  it("accumulates guest XP across two verified runs", async () => {
    const store = new MemoryBackend();
    const guest = { userId: null, anonymousId: "guest-xp-acc", email: null };
    const run = async () => {
      const session = await store.startSession({ identity: guest, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
      return store.submitScore({
        identity: guest,
        session,
        gameId: "neon-drift",
        mode: "circuit",
        score: 12000,
        durationMs: 40000,
        metadata: { laps: 1, combo: 1, wallHits: 0 },
        verified: "verified",
      });
    };
    const first = await run();
    expect(first.progression.xpEarned).toBeGreaterThan(0);
    const second = await run();
    expect(second.progression.newXp).toBe(first.progression.newXp + second.progression.xpEarned);
    const me = await store.getGuestProgress("guest-xp-acc");
    expect(me.xp).toBe(second.progression.newXp);
    expect(me.xp).toBeGreaterThan(first.progression.newXp);
  });

  it("merges guest XP onto the account exactly once", async () => {
    const store = new MemoryBackend();
    const guest = { userId: null, anonymousId: "guest-merge-xp", email: null };
    const session = await store.startSession({ identity: guest, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
    const run = await store.submitScore({
      identity: guest,
      session,
      gameId: "neon-drift",
      mode: "circuit",
      score: 12000,
      durationMs: 40000,
      metadata: { laps: 1, combo: 1, wallHits: 0 },
      verified: "verified",
    });
    const authed = {
      userId: "33333333-3333-4333-8333-333333333333",
      anonymousId: "guest-merge-xp",
      email: null,
    };
    const accountXp = (await store.getOrCreateProfile(authed)).xp;
    const first = await store.mergeGuest(authed);
    const second = await store.mergeGuest(authed);
    expect(first).toMatchObject({ ok: true, alreadyMerged: false });
    expect(second).toMatchObject({ ok: true, alreadyMerged: true });
    if ("profile" in first && "profile" in second) {
      expect(first.profile.xp).toBe(accountXp + run.progression.newXp);
      expect(second.profile.xp).toBe(first.profile.xp);
    }
  });

  it("persists unverified scores with zero competitive XP", async () => {
    const store = new MemoryBackend();
    const guest = { userId: null, anonymousId: "guest-offline", email: null };
    const before = await store.getGuestProgress("guest-offline");
    const session = await store.startSession({ identity: guest, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
    const result = await store.submitScore({
      identity: guest,
      session,
      gameId: "neon-drift",
      mode: "circuit",
      score: 18000,
      durationMs: 40000,
      metadata: { laps: 1, combo: 1, wallHits: 0 },
      verified: "unverified",
      offline: true,
    });
    expect(result.progression.xpEarned).toBe(0);
    expect(result.progression.newXp).toBe(before.xp);
    const me = await store.getGuestProgress("guest-offline");
    expect(me.xp).toBe(result.progression.newXp);
  });

  it("adds concurrent verified run rewards instead of last-write-wins", async () => {
    const store = new MemoryBackend();
    const user = { userId: "44444444-4444-4444-8444-444444444444", anonymousId: "conc", email: null };
    await store.getOrCreateProfile(user);
    const mk = async () => {
      const session = await store.startSession({ identity: user, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
      return store.submitScore({
        identity: user,
        session,
        gameId: "neon-drift",
        mode: "circuit",
        score: 12100,
        durationMs: 40000,
        metadata: { laps: 1, combo: 1, wallHits: 0 },
        verified: "verified",
      });
    };
    const sequential = new MemoryBackend();
    await sequential.getOrCreateProfile(user);
    const s1 = await (async () => {
      const session = await sequential.startSession({ identity: user, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
      return sequential.submitScore({
        identity: user,
        session,
        gameId: "neon-drift",
        mode: "circuit",
        score: 12100,
        durationMs: 40000,
        metadata: { laps: 1, combo: 1, wallHits: 0 },
        verified: "verified",
      });
    })();
    const s2 = await (async () => {
      const session = await sequential.startSession({ identity: user, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
      return sequential.submitScore({
        identity: user,
        session,
        gameId: "neon-drift",
        mode: "circuit",
        score: 12100,
        durationMs: 40000,
        metadata: { laps: 1, combo: 1, wallHits: 0 },
        verified: "verified",
      });
    })();
    const [a, b] = await Promise.all([mk(), mk()]);
    const conc = await store.getOrCreateProfile(user);
    expect(conc.xp).toBe(s2.progression.newXp);
    expect(a.progression.xpEarned + b.progression.xpEarned).toBe(s1.progression.xpEarned + s2.progression.xpEarned);
    expect(conc.xp).toBe(s1.progression.xpEarned + s2.progression.xpEarned);
  });

  it("lets only the block owner unblock, and blocks cannot be removed by the target", async () => {
    const store = new MemoryBackend();
    const a = identity;
    const b = { userId: "55555555-5555-4555-8555-555555555555", anonymousId: "blocked-target", email: null };
    await store.getOrCreateProfile(a);
    await store.getOrCreateProfile(b);
    await store.sendFriendRequest(a, (await store.getOrCreateProfile(b)).username);
    await store.friendAction(b, a.userId!, "accept");
    await store.friendAction(a, b.userId!, "block");
    expect(await store.friendAction(b, a.userId!, "remove")).toMatchObject({ error: "blocked" });
    expect(await store.friendAction(b, a.userId!, "unblock")).toMatchObject({ error: "not_found" });
    expect(await store.sendFriendRequest(b, (await store.getOrCreateProfile(a)).username)).toMatchObject({ error: "blocked" });
    expect(await store.friendAction(a, b.userId!, "unblock")).toMatchObject({ ok: true });
    expect(await store.sendFriendRequest(b, (await store.getOrCreateProfile(a)).username)).toMatchObject({ ok: true });
  });
});

describe("rls sql", () => {
  it("does not keep or true policies in the hardening migration", () => {
    const sql = readFileSync(new URL("../supabase/migrations/0002_hardening.sql", import.meta.url), "utf8");
    expect(sql.toLowerCase()).not.toMatch(/or true/);
    expect(sql).toContain("share_activity");
    expect(sql).toContain("guest_migrations");
    expect(sql).toContain("(select auth.uid())");
    expect(sql).toContain("public_profiles");
  });
});

describe("quality hardening sql", () => {
  it("scopes idempotency and adds atomic rpcs", () => {
    const sql = readFileSync(new URL("../supabase/migrations/0003_quality_hardening.sql", import.meta.url), "utf8");
    expect(sql).toContain("primary key (scope, key)");
    expect(sql).toContain("finalize_game_run");
    expect(sql).toContain("merge_guest_progress");
    expect(sql).toContain("best_verified_scores");
    expect(sql).toContain("set search_path = public");
    expect(sql).toContain("grant execute on function public.finalize_game_run");
    expect(sql).toContain("to service_role;");
    expect(sql).not.toMatch(/grant execute on function public\.finalize_game_run\([^)]+\) to anon/i);
  });
});

describe("authoritative progression sql", () => {
  it("revokes browser writes and adds guest_progress plus relative finalize", () => {
    const sql = readFileSync(new URL("../supabase/migrations/0004_authoritative_progression.sql", import.meta.url), "utf8");
    expect(sql).toContain("create table if not exists public.guest_progress");
    expect(sql).toContain("revoke all on table public.profiles from public, anon, authenticated");
    expect(sql).toContain("drop policy if exists \"profiles_update_own\"");
    expect(sql).toContain("xpEarned");
    expect(sql).toContain("for update");
    expect(sql).toContain("guest_progress.xp");
    expect(sql).toContain("grant execute on function public.finalize_game_run");
    expect(sql).toContain("to service_role");
    expect(sql).not.toMatch(/grant execute on function public\.finalize_game_run\([^)]+\) to anon/i);
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("status = 'accepted'");
    expect(sql).toContain("Future cron");
  });
});

describe("ownership and identity", () => {
  it("forbids guest B from using guest A session", () => {
    expect(
      assertSessionOwnership(
        { userId: null, anonymousId: "guest-a" },
        { userId: null, anonymousId: "guest-b" },
      ),
    ).toBe("forbidden");
  });

  it("forbids an authenticated player from using another user's session", () => {
    expect(
      assertSessionOwnership(
        { userId: "11111111-1111-4111-8111-111111111111", anonymousId: "x" },
        { userId: "22222222-2222-4222-8222-222222222222", anonymousId: "x" },
      ),
    ).toBe("forbidden");
  });

  it("does not double-namespace achievement ids", () => {
    expect(achievementId("platform", "first-run")).toBe("platform:first-run");
    expect(achievementId("neon-drift", "score-25k")).toBe("neon-drift:score-25k");
  });

  it("rejects merge payloads that try to set anonymousId", () => {
    expect(GuestMergeSchema.safeParse({ anonymousId: "stolen", snapshot: { xp: 9 } }).success).toBe(false);
    expect(GuestMergeSchema.safeParse({ offlineRuns: [] }).success).toBe(true);
  });

  it("enforces save size", () => {
    expect(boundedJsonSize({ n: "x".repeat(80_000) })).toBe(false);
    expect(boundedJsonSize({ n: "ok" })).toBe(true);
  });
});
