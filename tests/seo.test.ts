import { describe, expect, it } from "vitest";
import { COLLECTIONS } from "../apps/web/content/collections";
import { guidePages } from "../apps/web/content/guides";
import { indexablePages, PRIVATE_PREFIXES } from "../apps/web/content/registry";
import { gameSeoTitle } from "../apps/web/lib/seo";

describe("SEO quality", () => {
  const pages = indexablePages();

  it("has a compact high-quality indexable set", () => {
    expect(pages.length).toBeGreaterThanOrEqual(30);
    expect(pages.length).toBeLessThanOrEqual(70);
  });

  it("has unique titles, descriptions, and canonicals", () => {
    const titles = pages.map((p) => p.title);
    const descs = pages.map((p) => p.description);
    const paths = pages.map((p) => p.path);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descs).size).toBe(descs.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("does not index play, arcade, or private surfaces", () => {
    for (const page of pages) {
      expect(page.path.startsWith("/play")).toBe(false);
      for (const prefix of PRIVATE_PREFIXES) {
        if (prefix === "/play" || prefix === "/arcade" || prefix === "/c/") {
          expect(page.path.startsWith(prefix === "/c/" ? "/c/" : prefix === "/play" ? "/play" : "/arcade")).toBe(false);
        }
      }
    }
    expect(pages.some((p) => p.path === "/arcade")).toBe(false);
    expect(pages.some((p) => p.path.startsWith("/play/"))).toBe(false);
  });

  it("maps every genre instead of falling back to Survival", () => {
    expect(gameSeoTitle("Pocket Striker", "Physics")).toContain("Physics Sports");
    expect(gameSeoTitle("Sky Stack", "Arcade")).toContain("Arcade Stacking");
    expect(gameSeoTitle("Knockout Circuit", "Obstacle")).toContain("Obstacle Race");
    expect(gameSeoTitle("Territory Rush", "Arena")).toContain("Paint Arena");
    expect(gameSeoTitle("Crowd Control", "Runner")).toContain("Crowd Runner");
    expect(gameSeoTitle("Pocket Striker", "Physics")).not.toContain("Survival");
  });

  it("keeps collections large enough", () => {
    for (const c of COLLECTIONS) {
      expect(c.games.length).toBeGreaterThanOrEqual(3);
    }
    expect(COLLECTIONS.length).toBeGreaterThanOrEqual(4);
    expect(COLLECTIONS.length).toBeLessThanOrEqual(8);
  });

  it("writes 16 real guides", () => {
    expect(guidePages()).toHaveLength(16);
    for (const g of guidePages()) {
      expect(g.sections.length).toBeGreaterThan(0);
      expect(g.description.length).toBeGreaterThan(40);
    }
  });

  it("keeps indexable copy useful", () => {
    for (const page of pages) {
      expect(page.description.length).toBeGreaterThan(24);
      expect(page.title.length).toBeGreaterThan(8);
    }
  });
});
