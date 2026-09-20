import { describe, expect, it } from "vitest";
import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { allCollections } from "../apps/web/lib/content/collections.ts";
import { allContentUnits } from "../apps/web/lib/content/content-units.ts";
import { isPrivatePath } from "../apps/web/lib/content/policy.ts";
import {
  allPublicEntities,
  duplicateCanonicals,
  duplicateTitles,
  indexableEntities,
  orphanIndexablePaths,
  playAppEntity,
  sitemapEntries,
} from "../apps/web/lib/content/registry.ts";
import { evaluateGate } from "../apps/web/lib/content/quality.ts";
import { seoTaxonomy, gameSeoTitle, SURVIVAL_SLUGS } from "../apps/web/lib/content/taxonomy.ts";
import { COURSES } from "../games/velocity-run/src/systems/courses.ts";
import { MAPS } from "../games/knockout-circuit/src/systems/maps.ts";
import { LAYOUTS } from "../games/pocket-striker/src/systems/layouts.ts";
import { TRACKS } from "../games/neon-drift/src/systems/track.ts";

describe("SEO taxonomy", () => {
  it("maps every game to an explicit truthful kind — never else=Survival", () => {
    const kinds = GAME_MANIFESTS.map((g) => seoTaxonomy(g.slug));
    expect(kinds).toHaveLength(8);
    for (const g of GAME_MANIFESTS) {
      const tax = seoTaxonomy(g.slug);
      expect(tax.genre).toBe(g.genre);
      if (g.slug !== "swarm-protocol") {
        expect(tax.titlePattern.toLowerCase()).not.toContain("survival");
        expect(gameSeoTitle(g.slug)).not.toMatch(/Survival/i);
      }
    }
    expect(SURVIVAL_SLUGS).toEqual(["swarm-protocol"]);
    expect(seoTaxonomy("swarm-protocol").kindLabel).toContain("survival");
    expect(seoTaxonomy("sky-stack").kindLabel).toContain("stacking");
    expect(seoTaxonomy("knockout-circuit").kindLabel).toContain("obstacle");
    expect(seoTaxonomy("pocket-striker").kindLabel).toContain("physics");
    expect(seoTaxonomy("territory-rush").kindLabel).toContain("territory");
    expect(seoTaxonomy("crowd-control").kindLabel).toContain("crowd");
  });

  it("throws on an unknown slug instead of inventing Survival", () => {
    expect(() => seoTaxonomy("made-up-game")).toThrow(/explicit mapping/i);
  });
});

describe("quality gate", () => {
  it("classifies app / thin / placeholder / indexable", () => {
    expect(evaluateGate({
      uniqueIntent: true, uniqueTitle: true, uniqueH1: true, firstPartyFacts: true,
      internalLinks: 3, duplicateCanonical: false, gameBacked: true, title: "A", h1: "A",
      description: "A useful first-party description that is long enough.", bodyText: "facts",
      hasImage: true, imageAlt: "alt", contradictory: false, placeholder: false, appSurface: true,
    }).status).toBe("NOINDEX_APP");
    expect(evaluateGate({
      uniqueIntent: true, uniqueTitle: true, uniqueH1: true, firstPartyFacts: true,
      internalLinks: 3, duplicateCanonical: false, gameBacked: true, title: "TODO lorem", h1: "A",
      description: "A useful first-party description that is long enough.", bodyText: "lorem ipsum",
      hasImage: true, imageAlt: "alt", contradictory: false, placeholder: false, appSurface: false,
    }).status).toBe("NOINDEX_PLACEHOLDER");
    expect(evaluateGate({
      uniqueIntent: true, uniqueTitle: true, uniqueH1: true, firstPartyFacts: true,
      internalLinks: 3, duplicateCanonical: true, gameBacked: true, title: "A", h1: "A",
      description: "A useful first-party description that is long enough.", bodyText: "facts",
      hasImage: true, imageAlt: "alt", contradictory: false, placeholder: false, appSurface: false,
    }).status).toBe("NOINDEX_DUPLICATE");
    expect(evaluateGate({
      uniqueIntent: true, uniqueTitle: true, uniqueH1: true, firstPartyFacts: true,
      internalLinks: 3, duplicateCanonical: false, gameBacked: true, title: "Harbour Loop — Neon Drift track",
      h1: "Harbour Loop", description: "Neon Drift teaching circuit with two boost ribbons and three sectors.",
      bodyText: "Harbour loop wet asphalt boost 0.22", hasImage: true, imageAlt: "Harbour Loop",
      contradictory: false, placeholder: false, appSurface: false,
    }).status).toBe("INDEXABLE");
  });
});

describe("indexable registry", () => {
  const indexable = indexableEntities();
  const sitemap = sitemapEntries();

  it("stays in the 50–80 high-quality band", () => {
    expect(indexable.length).toBeGreaterThanOrEqual(50);
    expect(indexable.length).toBeLessThanOrEqual(80);
  });

  it("gives every indexable route a canonical, unique title, and unique H1 intent", () => {
    const titles = new Set<string>();
    const h1s = new Set<string>();
    for (const e of indexable) {
      expect(e.canonical).toBeTruthy();
      expect(e.title.length).toBeGreaterThan(8);
      expect(e.h1.length).toBeGreaterThan(2);
      expect(titles.has(e.title), e.title).toBe(false);
      titles.add(e.title);
      expect(h1s.has(e.h1), e.h1).toBe(false);
      h1s.add(e.h1);
    }
    expect(duplicateTitles()).toEqual([]);
    expect(duplicateCanonicals()).toEqual([]);
  });

  it("keeps /play as NOINDEX_APP with hub canonical", () => {
    const play = playAppEntity("neon-drift");
    expect(play.indexStatus).toBe("NOINDEX_APP");
    expect(play.indexable).toBe(false);
    expect(play.canonical).toBe("/games/neon-drift");
  });

  it("excludes private and app surfaces from the sitemap", () => {
    const banned = ["/play", "/settings", "/me", "/friends", "/inbox", "/party", "/crew", "/auth", "/arcade", "/leaderboards", "/achievements", "/daily", "/grand-prix", "/profile"];
    for (const row of sitemap) {
      expect(isPrivatePath(row.path)).toBe(false);
      for (const b of banned) {
        expect(row.path === b || row.path.startsWith(`${b}/`)).toBe(false);
      }
    }
    expect(sitemap.every((row) => indexable.some((e) => e.path === row.path && e.indexable))).toBe(true);
    expect(sitemap.length).toBe(indexable.length);
  });

  it("has zero orphan indexable URLs", () => {
    expect(orphanIndexablePaths()).toEqual([]);
  });

  it("has no duplicate slugs across indexable entities of the same kind", () => {
    const keys = indexable.map((e) => `${e.kind}:${e.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("maps every content unit to real game data", () => {
    const units = allContentUnits();
    expect(units.filter((u) => u.unitKind === "track")).toHaveLength(TRACKS.length);
    expect(units.filter((u) => u.unitKind === "course")).toHaveLength(COURSES.length);
    expect(units.filter((u) => u.unitKind === "map")).toHaveLength(MAPS.length);
    expect(units.filter((u) => u.unitKind === "table")).toHaveLength(LAYOUTS.length);
    for (const u of units) {
      expect(u.entity.indexable).toBe(true);
      expect(u.entity.gameSlug).toBeTruthy();
      expect(Object.keys(u.facts).length).toBeGreaterThan(3);
      expect(u.advice.length).toBeGreaterThan(20);
    }
    expect(TRACKS.map((t) => t.id).sort()).toEqual(units.filter((u) => u.unitKind === "track").map((u) => u.sourceId).sort());
    expect(COURSES.map((c) => c.id).sort()).toEqual(units.filter((u) => u.unitKind === "course").map((u) => u.sourceId).sort());
  });

  it("requires collections to have at least 3 real games and no live-multiplayer lie", () => {
    for (const c of allCollections()) {
      expect(c.games.length).toBeGreaterThanOrEqual(3);
      for (const slug of c.games) {
        expect(GAME_MANIFESTS.some((g) => g.slug === slug)).toBe(true);
      }
      expect(`${c.description} ${c.why}`.toLowerCase()).not.toMatch(/are live multiplayer|live multiplayer lobby/);
    }
  });

  it("does not index thin or app entities", () => {
    for (const e of allPublicEntities()) {
      if (e.kind === "app") expect(e.indexable).toBe(false);
      if (!e.indexable) expect(e.indexStatus).not.toBe("INDEXABLE");
    }
  });
});
