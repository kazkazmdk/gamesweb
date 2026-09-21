import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import { editorialFor } from "./editorial";
import { COLLECTIONS } from "./collections";
import { indexablePages } from "./registry";
import type { SeoPage, SeoTopic } from "./types";

const UTILITY: SeoTopic[] = ["home", "catalog", "guides-index", "collections-index", "legal"];

export type SeoContentRow = {
  url: string;
  intent: SeoPage["topic"];
  title: string;
  h1: string;
  wordCount: number;
  uniqueTokens: number;
  nearestPath: string | null;
  nearestSimilarity: number;
  internalLinks: number;
  gameEntities: string[];
  source: string;
  contentType: SeoPage["topic"];
  indexable: boolean;
  canonical: string;
  qualityGate: "pass" | "thin" | "near-duplicate";
};

function tokens(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function bodyFor(page: SeoPage) {
  const parts = [page.title, page.h1, page.description];
  if (page.topic === "home" || page.topic === "catalog") {
    parts.push(...GAME_MANIFESTS.map((g) => `${g.title} ${g.tagline} ${g.genre}`));
  }
  if (page.topic === "guides-index") {
    parts.push(...GAME_MANIFESTS.map((g) => `${g.title} guide ${editorialFor(g.slug).guideLead}`));
  }
  if (page.topic === "collections-index") {
    parts.push(...COLLECTIONS.map((c) => `${c.h1} ${c.rationale} ${c.audience} ${c.pick}`));
  }
  if (page.gameSlug) {
    const game = getManifest(page.gameSlug);
    const ed = editorialFor(page.gameSlug);
    if (page.topic === "hub") parts.push(ed.hubDescription, ed.whyDistinct, ...ed.run);
    if (page.topic === "guide") parts.push(ed.guideLead, ed.whyDistinct);
    if (page.topic === "how-to-play") parts.push(ed.howToLead, ...(game?.howToPlay ?? []), ...ed.run);
    if (page.topic === "controls") parts.push(ed.controlsLead, ...(game?.controls.map((c) => `${c.input} ${c.action}`) ?? []));
    if (page.topic === "strategy") parts.push(...ed.strategy);
    if (page.topic === "achievements") {
      parts.push(ed.whyDistinct, ...(game?.achievements.map((a) => `${a.name} ${a.description}`) ?? []));
    }
    if (page.topic === "tracks" && ed.tracks) parts.push(...ed.tracks.map((t) => `${t.name} ${t.subtitle} ${t.note}`));
    if (page.topic === "courses" && ed.courses) parts.push(...ed.courses.map((c) => `${c.name} ${c.world} ${c.subtitle}`));
    if (page.topic === "scoring" && ed.scoring) parts.push(ed.scoring.lead, ...ed.scoring.rules);
  }
  if (page.collectionSlug) {
    const col = COLLECTIONS.find((c) => c.slug === page.collectionSlug);
    if (col) parts.push(col.rationale, col.audience, col.pick, col.description);
  }
  return parts.filter(Boolean).join(" ");
}

export function buildSeoContentReport(): SeoContentRow[] {
  const pages = indexablePages();
  const bags = pages.map((page) => {
    const text = bodyFor(page);
    return { page, text, words: text.split(/\s+/).filter(Boolean), bag: tokens(text) };
  });
  return bags.map((row) => {
    let nearestPath: string | null = null;
    let nearestSimilarity = 0;
    for (const other of bags) {
      if (other.page.path === row.page.path) continue;
      const sim = jaccard(row.bag, other.bag);
      if (sim > nearestSimilarity) {
        nearestSimilarity = sim;
        nearestPath = other.page.path;
      }
    }
    const utility = UTILITY.includes(row.page.topic);
    const thin = !utility && row.words.length < 40;
    const near = nearestSimilarity >= 0.82;
    return {
      url: row.page.path,
      intent: row.page.topic,
      title: row.page.title,
      h1: row.page.h1,
      wordCount: row.words.length,
      uniqueTokens: row.bag.size,
      nearestPath,
      nearestSimilarity: Number(nearestSimilarity.toFixed(3)),
      internalLinks: row.page.children.length + row.page.parents.length,
      gameEntities: row.page.gameSlug ? [row.page.gameSlug] : row.page.collectionSlug ? COLLECTIONS.find((c) => c.slug === row.page.collectionSlug)?.games ?? [] : [],
      source: row.page.gameSlug ? `editorial:${row.page.gameSlug}` : row.page.collectionSlug ? `collection:${row.page.collectionSlug}` : "registry",
      contentType: row.page.topic,
      indexable: row.page.indexable,
      canonical: row.page.canonical,
      qualityGate: thin ? "thin" : near ? "near-duplicate" : "pass",
    };
  });
}

export function seoContentIssues(rows = buildSeoContentReport()) {
  return rows.filter((row) => row.qualityGate !== "pass");
}
