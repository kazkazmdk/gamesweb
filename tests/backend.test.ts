import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MemoryBackend } from "../apps/web/lib/backend/memory.ts";
import { SubmitScoreSchema, StartSessionSchema } from "../packages/database/src/index.ts";

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

  it("merges a guest only once", async () => {
    const store = new MemoryBackend();
    const first = await store.mergeGuest(identity, "guest-abc", {
      xp: 1000,
      achievements: ["platform:first-run"],
      scores: [],
    });
    const second = await store.mergeGuest(identity, "guest-abc", {
      xp: 1000,
      achievements: ["platform:first-run"],
      scores: [],
    });
    expect(first).toMatchObject({ ok: true, alreadyMerged: false });
    expect(second).toMatchObject({ ok: true, alreadyMerged: true });
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
