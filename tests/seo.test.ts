import { describe, expect, it } from "vitest";
import {
  allEntries,
  countsByFamily,
  indexableEntries,
  rawSeoAudit,
  seoAudit,
  shouldUseSitemapIndex,
  sitemapRecords,
} from "../apps/web/lib/seo-content/registry";
import { inboundMap } from "../apps/web/lib/seo-content/quality";
import { isLocalhostUrl, productionUsesLocalhost, siteOrigin } from "../apps/web/lib/seo-content/site";
import { articleJsonLd, breadcrumbJsonLd, itemListJsonLd, videoGameJsonLd, websiteJsonLd } from "../apps/web/lib/seo-content/schema";
import { GAME_MANIFESTS } from "@gamesweb/game-sdk";

describe("SEO registry quality gate", () => {
  it("keeps a useful first surface without thin doorway pages", () => {
    const n = indexableEntries().length;
    expect(n).toBeGreaterThanOrEqual(70);
    expect(n).toBeLessThanOrEqual(110);
    const families = countsByFamily();
    expect(families["game-hub"]).toBe(8);
    expect(families.guide).toBeGreaterThanOrEqual(40);
    expect(families.collection).toBeGreaterThanOrEqual(8);
    expect(families.learn).toBeGreaterThanOrEqual(8);
    expect(shouldUseSitemapIndex()).toBe(false);
  });

  it("rejects duplicate titles, descriptions, H1s, and broken relations", () => {
    const issues = rawSeoAudit().filter((i) =>
      ["title-dup", "desc-dup", "h1-dup", "rel-game", "rel-guide", "path-dup", "localhost"].includes(i.code),
    );
    expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
  });

  it("does not demote honest pages just to hit a count", () => {
    const blocked = seoAudit().filter((i) => i.code === "orphan" && indexableEntries().some((e) => e.id === i.id));
    expect(blocked, JSON.stringify(blocked, null, 2)).toEqual([]);
    expect(indexableEntries().every((e) => e.indexable)).toBe(true);
  });

  it("gives every indexable editorial page an inbound link and a destination", () => {
    const inbound = inboundMap(allEntries());
    for (const entry of indexableEntries()) {
      if (entry.kind === "home" || entry.kind === "legal") continue;
      expect(inbound.get(entry.path)?.length ?? 0, entry.path).toBeGreaterThan(0);
      const outs = entry.relatedGameIds.length + entry.relatedGuideIds.length + entry.relatedCollectionIds.length;
      expect(outs + entry.sections.length, entry.path).toBeGreaterThan(0);
    }
  });
});

describe("sitemap records", () => {
  it("lists only indexable canonical paths with real updatedAt", () => {
    const records = sitemapRecords();
    const indexable = indexableEntries();
    expect(records).toHaveLength(indexable.length);
    const paths = new Set(records.map((r) => r.path));
    for (const entry of indexable) {
      expect(paths.has(entry.path), entry.path).toBe(true);
      expect(entry.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(paths.has("/arcade")).toBe(false);
    expect(paths.has("/play/neon-drift")).toBe(false);
    expect(paths.has("/friends")).toBe(false);
  });

  it("never encodes localhost in production helpers", () => {
    expect(isLocalhostUrl("https://gamesweb.app/games")).toBe(false);
    expect(isLocalhostUrl("http://localhost:3000/games")).toBe(true);
    if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
      expect(productionUsesLocalhost()).toBe(false);
      expect(siteOrigin()).not.toMatch(/localhost|127\.0\.0\.1/);
    }
  });
});

describe("structured data", () => {
  it("emits parseable Website, breadcrumbs, ItemList, Article, VideoGame", () => {
    const site = websiteJsonLd();
    expect(site["@type"]).toBe("WebSite");
    expect(JSON.parse(JSON.stringify(site)).url).toBeTruthy();
    expect(site.url).not.toContain("undefined");

    const hub = indexableEntries().find((e) => e.kind === "game-hub")!;
    const crumbs = breadcrumbJsonLd(hub);
    expect(crumbs.itemListElement.length).toBeGreaterThanOrEqual(2);

    const list = itemListJsonLd("Games", "/games", GAME_MANIFESTS.map((g) => ({ name: g.title, path: `/games/${g.slug}` })));
    expect(list.numberOfItems).toBe(8);

    const guide = indexableEntries().find((e) => e.kind === "guide")!;
    const article = articleJsonLd(guide);
    expect(article["@type"]).toBe("Article");
    expect(article.mainEntityOfPage).toContain(guide.path);

    const game = GAME_MANIFESTS[0];
    const vg = videoGameJsonLd(game);
    expect(vg["@type"]).toBe("VideoGame");
    expect(vg.url).toContain(`/games/${game.slug}`);
    expect(JSON.stringify(vg)).not.toMatch(/aggregateRating|reviewRating/);
  });
});

describe("content is game-specific", () => {
  it("does not ship generic browser-game filler as a unique page body", () => {
    const banned = /Browser games are a fun way to enjoy gaming without downloading/i;
    for (const entry of indexableEntries()) {
      const blob = `${entry.summary} ${entry.sections.map((s) => s.body).join(" ")}`;
      expect(blob, entry.id).not.toMatch(banned);
    }
  });

  it("keeps deep guides attached to a real game id", () => {
    for (const guide of indexableEntries().filter((e) => e.kind === "guide")) {
      expect(GAME_MANIFESTS.some((g) => g.id === guide.gameId), guide.id).toBe(true);
      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
    }
  });
});
