import { afterEach, describe, expect, it } from "vitest";
import { appUrl, assertProductionSecrets, resolveBackend } from "../apps/web/lib/env.ts";

const KEYS = [
  "VERCEL_ENV",
  "GAMESWEB_BACKEND",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SHOW_SEED_DATA",
  "VERCEL",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
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

describe("env", () => {
  it("lets an empty Vercel production project boot on memory", () => {
    stash();
    process.env.VERCEL_ENV = "production";
    expect(assertProductionSecrets()).toEqual([]);
    expect(resolveBackend()).toBe("memory");
  });

  it("skips production secret checks when GAMESWEB_BACKEND=memory", () => {
    stash();
    process.env.VERCEL_ENV = "production";
    process.env.GAMESWEB_BACKEND = "memory";
    expect(assertProductionSecrets()).toEqual([]);
    expect(resolveBackend()).toBe("memory");
  });

  it("still fails closed when production has a partial backend", () => {
    stash();
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const missing = assertProductionSecrets();
    expect(missing).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(missing).toContain("SUPABASE_SECRET_KEY");
    expect(missing).toContain("UPSTASH_REDIS_REST_URL");
  });

  it("uses the Vercel host instead of localhost once deployed", () => {
    stash();
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL = "1";
    process.env.VERCEL_URL = "gamesweb-preview.vercel.app";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(appUrl()).toBe("https://gamesweb-preview.vercel.app");

    stash();
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "gamesweb-jade.vercel.app";
    process.env.VERCEL_URL = "gamesweb-sha.vercel.app";
    expect(appUrl()).toBe("https://gamesweb-jade.vercel.app");

    stash();
    expect(appUrl()).toBe("http://localhost:3000");
  });
});
