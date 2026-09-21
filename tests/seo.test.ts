import { afterEach, describe, expect, it } from "vitest";
import { COLLECTIONS } from "../apps/web/content/collections.ts";
import { GAME_EDITORIAL } from "../apps/web/content/editorial.ts";
import { collectSeoIssues } from "../apps/web/content/quality.ts";
import { buildSeoContentReport, seoContentIssues } from "../apps/web/content/quality-report.ts";
import { SEO_PAGES, indexablePages, sitemapEntries } from "../apps/web/content/registry.ts";
import { GAME_SEO_KIND, gameSeoKind, gameSeoTitle } from "../apps/web/content/taxonomy.ts";
import { publicOrigin } from "../apps/web/lib/env.ts";
import { MECHANICAL_CLAIMS } from "../apps/web/content/claims.ts";
import { readFileSync } from "node:fs";
import { GAME_MANIFESTS } from "../packages/game-sdk/src/manifests.ts";

const ENV_KEYS = ["NEXT_PUBLIC_APP_URL", "VERCEL_URL", "VERCEL_ENV"] as const;
const snapshot = new Map<string, string | undefined>();

function stash() {
  snapshot.clear();
  for (const key of ENV_KEYS) {
    snapshot.set(key, process.env[key]);
    delete process.env[key];
  }
}

function restore() {
  for (const key of ENV_KEYS) {
    const value = snapshot.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(restore);

describe("SEO taxonomy", () => {
  it("maps every shipped game without a Survival fallback", () => {
    for (const game of GAME_MANIFESTS) {
      expect(GAME_SEO_KIND[game.slug], game.slug).toBeTruthy();
      expect(gameSeoKind(game.slug, game.genre)).not.toBeUndefined();
    }
    expect(gameSeoTitle("Sky Stack", "sky-stack", "Arcade")).toBe("Sky Stack — Free Online Stacking Game");
    expect(gameSeoTitle("Knockout Circuit", "knockout-circuit", "Obstacle")).toBe(
      "Knockout Circuit — Free Online Obstacle Game",
    );
    expect(gameSeoTitle("Pocket Striker", "pocket-striker", "Physics")).toBe(
      "Pocket Striker — Free Online Physics Sports Game",
    );
    expect(gameSeoTitle("Territory Rush", "territory-rush", "Arena")).toBe(
      "Territory Rush — Free Online Territory Game",
    );
    expect(gameSeoTitle("Crowd Control", "crowd-control", "Runner")).toBe(
      "Crowd Control — Free Online Crowd Runner",
    );
    expect(gameSeoTitle("Swarm Protocol", "swarm-protocol", "Survival")).toBe(
      "Swarm Protocol — Free Online Survival Game",
    );
    expect(() => gameSeoKind("made-up", "UnknownGenre")).toThrow(/Missing SEO kind/);
  });
});

describe("SEO registry quality", () => {
  it("has unique titles, descriptions, canonicals, and no thin/orphan/private leaks", () => {
    const issues = collectSeoIssues();
    expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
  });

  it("keeps the indexable surface in the 50–70 band", () => {
    const count = indexablePages().length;
    expect(count).toBeGreaterThanOrEqual(50);
    expect(count).toBeLessThanOrEqual(70);
    expect(sitemapEntries()).toHaveLength(count);
  });

  it("does not put private or play routes in the sitemap", () => {
    const paths = sitemapEntries().map((e) => e.path);
    expect(paths).not.toContain("/arcade");
    expect(paths.some((p) => p.startsWith("/play"))).toBe(false);
    expect(paths.some((p) => p.startsWith("/friends"))).toBe(false);
    expect(paths.some((p) => p.startsWith("/daily"))).toBe(false);
  });

  it("skips Sky Stack strategy and only adds optional pages that exist in editorial", () => {
    const paths = new Set(SEO_PAGES.map((p) => p.path));
    expect(paths.has("/games/sky-stack/strategy")).toBe(false);
    expect(paths.has("/games/neon-drift/tracks")).toBe(true);
    expect(paths.has("/games/neon-drift/scoring")).toBe(true);
    expect(paths.has("/games/velocity-run/courses")).toBe(true);
    expect(paths.has("/games/velocity-run/scoring")).toBe(true);
    expect(paths.has("/games/sky-stack/tracks")).toBe(false);
  });

  it("builds collections from at least three real games", () => {
    expect(COLLECTIONS.length).toBeGreaterThanOrEqual(6);
    expect(COLLECTIONS.length).toBeLessThanOrEqual(8);
    for (const col of COLLECTIONS) {
      expect(col.games.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps editorial claims aligned with manifest controls and trophies", () => {
    for (const game of GAME_MANIFESTS) {
      const ed = GAME_EDITORIAL.find((row) => row.slug === game.slug);
      expect(ed, game.slug).toBeTruthy();
      const controls = SEO_PAGES.find((p) => p.path === `/games/${game.slug}/controls`);
      expect(controls).toBeTruthy();
      for (const control of game.controls) {
        expect(controls!.description).toContain(control.action);
      }
      const trophies = SEO_PAGES.find((p) => p.path === `/games/${game.slug}/achievements`);
      expect(trophies?.minSignals).toBe(game.achievements.length);
    }
  });
});

describe("public origin", () => {
  it("prefers NEXT_PUBLIC_APP_URL", () => {
    stash();
    process.env.NEXT_PUBLIC_APP_URL = "https://gamesweb.example";
    process.env.VERCEL_URL = "something.vercel.app";
    expect(publicOrigin()).toBe("https://gamesweb.example");
  });

  it("uses https VERCEL_URL when the public env is empty", () => {
    stash();
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "gamesweb-git-seo.vercel.app";
    expect(publicOrigin()).toBe("https://gamesweb-git-seo.vercel.app");
    expect(publicOrigin()).not.toMatch(/localhost/);
  });

  it("only falls back to localhost off Vercel", () => {
    stash();
    expect(publicOrigin()).toBe("http://localhost:3000");
  });

  it("can adopt the incoming host when no public env is set", () => {
    stash();
    expect(publicOrigin("gamesweb-git.vercel.app", "https")).toBe("https://gamesweb-git.vercel.app");
    expect(publicOrigin("127.0.0.1:3010")).toBe("http://127.0.0.1:3010");
  });
});

describe("SEO content quality", () => {
  it("keeps 65 indexable pages above the thin/near-duplicate gate", () => {
    const report = buildSeoContentReport();
    expect(report).toHaveLength(indexablePages().length);
    const issues = seoContentIssues(report);
    expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
    for (const col of COLLECTIONS) {
      expect(col.audience.length).toBeGreaterThan(20);
      expect(col.pick.length).toBeGreaterThan(20);
    }
  });

  it("keeps mechanical claims pointed at real source files", () => {
    for (const claim of MECHANICAL_CLAIMS) {
      const file = claim.source.split(":")[0];
      const src = readFileSync(file, "utf8");
      expect(src.includes(claim.verify), `${claim.id} missing ${claim.verify} in ${file}`).toBe(true);
    }
  });
});
