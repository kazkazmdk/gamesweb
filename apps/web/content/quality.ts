import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import { COLLECTIONS } from "./collections";
import { editorialFor } from "./editorial";
import { GAME_SEO_KIND, PRIVATE_PREFIXES } from "./taxonomy";
import { SEO_PAGES, indexablePages } from "./registry";

export type SeoIssue = { code: string; message: string; path?: string };

export function collectSeoIssues(): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const indexable = indexablePages();
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const canonicals = new Map<string, string>();
  const indexableSet = new Set(indexable.map((p) => p.path));

  for (const page of indexable) {
    if (!page.h1.trim()) issues.push({ code: "empty-h1", message: "Empty H1", path: page.path });
    if (!page.description.trim() || page.description.length < 40) {
      issues.push({ code: "thin-description", message: "Description too thin", path: page.path });
    }
    const prevTitle = titles.get(page.title);
    if (prevTitle) issues.push({ code: "dup-title", message: `${page.title} also used by ${prevTitle}`, path: page.path });
    else titles.set(page.title, page.path);
    const prevDesc = descriptions.get(page.description);
    if (prevDesc) issues.push({ code: "dup-description", message: `description also used by ${prevDesc}`, path: page.path });
    else descriptions.set(page.description, page.path);
    const prevCanon = canonicals.get(page.canonical);
    if (prevCanon) issues.push({ code: "dup-canonical", message: `${page.canonical} also used by ${prevCanon}`, path: page.path });
    else canonicals.set(page.canonical, page.path);
    if (page.canonical !== page.path) {
      issues.push({ code: "canonical-mismatch", message: "Self-canonical required", path: page.path });
    }
    if (page.minSignals < 1) issues.push({ code: "thin-indexable", message: "No useful signals", path: page.path });
  }

  for (const col of COLLECTIONS) {
    if (col.games.length < 3) {
      issues.push({ code: "tiny-collection", message: `${col.slug} has ${col.games.length} games`, path: `/collections/${col.slug}` });
    }
    for (const slug of col.games) {
      if (!getManifest(slug)) issues.push({ code: "ghost-game", message: `${col.slug} lists unknown ${slug}` });
    }
  }

  for (const page of indexable) {
    if (page.path === "/") continue;
    const hasParent = page.parents.some((parent) => indexableSet.has(parent));
    const listedAsChild = indexable.some((other) => other.children.includes(page.path));
    if (!hasParent && !listedAsChild) {
      issues.push({ code: "orphan", message: "No inbound indexable parent", path: page.path });
    }
  }

  for (const page of SEO_PAGES) {
    if (!page.indexable && indexableSet.has(page.path)) {
      issues.push({ code: "sitemap-noindex", message: "noindex page marked indexable", path: page.path });
    }
  }

  for (const prefix of PRIVATE_PREFIXES) {
    for (const page of indexable) {
      if (page.path === prefix || page.path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)) {
        issues.push({ code: "private-indexable", message: "Private route is indexable", path: page.path });
      }
    }
  }

  for (const game of GAME_MANIFESTS) {
    if (!GAME_SEO_KIND[game.slug]) {
      issues.push({ code: "missing-kind", message: `No SEO kind for ${game.slug}` });
    }
    const ed = editorialFor(game.slug);
    if (ed.kind === "Survival Game" && game.slug !== "swarm-protocol") {
      issues.push({ code: "survival-fallback", message: `${game.slug} classified as Survival` });
    }
    for (const control of game.controls) {
      const controlsPage = indexable.find((p) => p.path === `/games/${game.slug}/controls`);
      if (controlsPage && !controlsPage.description.includes(control.action)) {
        issues.push({ code: "control-missing", message: `${game.slug} controls omit ${control.action}`, path: controlsPage.path });
      }
    }
  }

  const count = indexable.length;
  if (count < 50 || count > 80) {
    issues.push({ code: "count", message: `Expected 50–80 indexable URLs, got ${count}` });
  }

  return issues;
}
