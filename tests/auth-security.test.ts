import { afterEach, describe, expect, it } from "vitest";
import { assertSameOrigin } from "../apps/web/lib/api/origin.ts";
import { assertProductionSecrets, resolveBackend, turnstilePair } from "../apps/web/lib/env.ts";
import { safePath } from "../apps/web/lib/auth/safe-path.ts";
import { verifyTurnstile } from "../apps/web/lib/api/captcha.ts";
import { AuthMagicLinkSchema, AccountDeleteSchema } from "../packages/database/src/index.ts";
import { defaultAccountUsername } from "../apps/web/lib/backend/default-username.ts";
import { MemoryBackend } from "../apps/web/lib/backend/memory.ts";
import { policies, rateLimit } from "../apps/web/lib/api/rate-limit.ts";

const KEYS = [
  "VERCEL_ENV",
  "GAMESWEB_BACKEND",
  "GAMESWEB_DEMO_MODE",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_APP_URL",
  "VERCEL_URL",
  "NEXT_PUBLIC_SHOW_SEED_DATA",
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
] as const;

const snapshot = new Map<string, string | undefined>();

function stash() {
  snapshot.clear();
  for (const key of KEYS) {
    snapshot.set(key, process.env[key]);
    delete process.env[key];
  }
}

function restore() {
  for (const key of KEYS) {
    const value = snapshot.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(restore);

function post(headers: Record<string, string>) {
  return new Request("http://127.0.0.1:3010/api/player/auth", { method: "POST", headers });
}

async function denied(req: Request) {
  const res = assertSameOrigin(req);
  return res ? { status: res.status, body: await res.json() } : null;
}

describe("assertSameOrigin", () => {
  it("blocks an explicit cross-origin POST", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3010";
    const hit = await denied(post({ origin: "https://evil.example", host: "127.0.0.1:3010" }));
    expect(hit?.status).toBe(403);
    expect(hit?.body.error.code).toBe("ORIGIN_DENIED");
  });

  it("blocks Sec-Fetch-Site cross-site even when Host matches", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3010";
    const hit = await denied(
      post({
        origin: "https://evil.example",
        host: "127.0.0.1:3010",
        "sec-fetch-site": "cross-site",
      }),
    );
    expect(hit?.status).toBe(403);
  });

  it("accepts same-origin browser POSTs", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3010";
    expect(
      await denied(
        post({
          origin: "http://127.0.0.1:3010",
          host: "127.0.0.1:3010",
          "sec-fetch-site": "same-origin",
        }),
      ),
    ).toBeNull();
  });

  it("does not reject Playwright-style requests without Sec-Fetch-Site", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3010";
    expect(await denied(post({ host: "127.0.0.1:3010" }))).toBeNull();
  });
});

describe("safePath", () => {
  it("rejects open redirects", () => {
    expect(safePath("https://evil.example")).toBe("/");
    expect(safePath("//evil.example")).toBe("/");
    expect(safePath("/me")).toBe("/me");
  });
});

describe("production env", () => {
  it("fails closed on a real production host without Supabase and Upstash", () => {
    stash();
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://gamesweb.example";
    const missing = assertProductionSecrets();
    expect(missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(missing).toContain("UPSTASH_REDIS_REST_URL");
    expect(resolveBackend()).toBe("none");
  });

  it("allows an explicit in-process demo on Vercel production", () => {
    stash();
    process.env.VERCEL_ENV = "production";
    process.env.GAMESWEB_DEMO_MODE = "true";
    expect(assertProductionSecrets()).toEqual([]);
    expect(resolveBackend()).toBe("memory");
  });

  it("rejects a partial Turnstile pair", () => {
    stash();
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(turnstilePair().status).toBe("invalid");
    expect(assertProductionSecrets().join(" ")).toMatch(/TURNSTILE/);
  });

  it("keeps local CI on memory without secrets", () => {
    stash();
    expect(assertProductionSecrets()).toEqual([]);
    expect(resolveBackend()).toBe("memory");
  });

  it("fail-closes rate limits in production when Redis is missing", async () => {
    stash();
    process.env.VERCEL_ENV = "production";
    const result = await rateLimit("score:missing-redis", policies.score);
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe("auth schemas and captcha", () => {
  it("accepts email without a captcha token for local mode", () => {
    expect(AuthMagicLinkSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
    expect(AuthMagicLinkSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("requires an explicit DELETE confirmation", () => {
    expect(AccountDeleteSchema.safeParse({ confirm: "DELETE" }).success).toBe(true);
    expect(AccountDeleteSchema.safeParse({ confirm: true }).success).toBe(false);
  });

  it("fails closed when a Turnstile secret is set without a token", async () => {
    stash();
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(await verifyTurnstile(undefined, "127.0.0.1")).toBe(false);
  });

  it("skips Turnstile when no secret is configured", async () => {
    stash();
    expect(await verifyTurnstile(undefined, "127.0.0.1")).toBe(true);
  });
});

describe("account username and delete", () => {
  it("uses more than 8 hex characters for the default username", () => {
    expect(defaultAccountUsername("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBe("player_aaaaaaaaaaaa");
    expect(defaultAccountUsername("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa").length).toBeLessThanOrEqual(20);
  });

  it("deletes an account without a second merge attaching old progress", async () => {
    const store = new MemoryBackend();
    const user = { userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", anonymousId: "guest-keep", email: "a@example.com" };
    await store.getOrCreateProfile(user);
    const session = await store.startSession({ identity: user, gameId: "neon-drift", gameVersion: "1.0.0", device: "desktop" });
    await store.submitScore({
      identity: user,
      session,
      gameId: "neon-drift",
      mode: "circuit",
      score: 25000,
      durationMs: 40000,
      metadata: { laps: 1 },
      verified: "verified",
    });
    const first = await store.mergeGuest(user);
    const second = await store.mergeGuest(user);
    expect(first).toMatchObject({ ok: true, alreadyMerged: false });
    expect(second).toMatchObject({ ok: true, alreadyMerged: true });
    if ("profile" in first && "profile" in second) {
      expect(second.profile.xp).toBe(first.profile.xp);
    }
    const removed = await store.deleteAccount(user);
    expect(removed).toEqual({ ok: true });
    const after = await store.getOrCreateProfile(user);
    expect(after.xp).toBe(0);
    expect(after.achievements).toEqual([]);
  });
});
