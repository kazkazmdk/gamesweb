import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS, getManifest, type GameManifest } from "@gamesweb/game-sdk";
import { COLLECTIONS } from "./collections";
import { editorialFor } from "./editorial";
import { gameSeoTitle } from "./taxonomy";
import { SEO_UPDATED, type SeoPage, type SeoTopic } from "./types";

const HOME = "/";
const GAMES = "/games";
const GUIDES = "/guides";
const COLLECTIONS_INDEX = "/collections";

function absTitle(title: string): string {
  return title.includes(brand.productName) ? title : `${title} | ${brand.productName}`;
}

function page(partial: Omit<SeoPage, "ogTitle" | "ogDescription" | "follow"> & { follow?: boolean }): SeoPage {
  return {
    ...partial,
    follow: partial.follow ?? true,
    ogTitle: partial.title,
    ogDescription: partial.description,
  };
}

function hubPath(slug: string) {
  return `${GAMES}/${slug}`;
}

function topicPath(slug: string, topic: string) {
  return `${GAMES}/${slug}/${topic}`;
}

function topicsFor(game: GameManifest): Array<{ topic: Exclude<SeoTopic, "hub" | "catalog" | "guides-index" | "collections-index" | "collection" | "legal" | "home">; enabled: boolean }> {
  const ed = editorialFor(game.slug);
  return [
    { topic: "guide", enabled: true },
    { topic: "how-to-play", enabled: true },
    { topic: "controls", enabled: true },
    { topic: "strategy", enabled: ed.strategy.length > 0 },
    { topic: "achievements", enabled: true },
    { topic: "tracks", enabled: Boolean(ed.tracks?.length) },
    { topic: "courses", enabled: Boolean(ed.courses?.length) },
    { topic: "scoring", enabled: Boolean(ed.scoring) },
  ];
}

function clusterChildren(slug: string): string[] {
  const game = getManifest(slug);
  if (!game) return [];
  return topicsFor(game)
    .filter((t) => t.enabled)
    .map((t) => topicPath(slug, t.topic));
}

function clusterCopy(
  game: GameManifest,
  topic: SeoTopic,
): { title: string; description: string; h1: string; minSignals: number } {
  const ed = editorialFor(game.slug);
  switch (topic) {
    case "guide":
      return {
        title: absTitle(`${game.title} Guide`),
        description: `${ed.guideLead} Session ${game.sessionHint}.`,
        h1: `${game.title} guide`,
        minSignals: 4,
      };
    case "how-to-play":
      return {
        title: absTitle(`How to Play ${game.title}`),
        description: `${ed.howToLead} ${game.howToPlay[0] ?? game.tagline}`,
        h1: `How to play ${game.title}`,
        minSignals: 3,
      };
    case "controls":
      return {
        title: absTitle(`${game.title} Controls`),
        description: `${ed.controlsLead} ${game.controls.map((c) => `${c.input}: ${c.action}`).join(" · ")}`,
        h1: `${game.title} controls`,
        minSignals: game.controls.length,
      };
    case "strategy":
      return {
        title: absTitle(`${game.title} Strategy`),
        description: ed.strategy[0] ?? ed.whyDistinct,
        h1: `${game.title} strategy`,
        minSignals: 4,
      };
    case "achievements":
      return {
        title: absTitle(`${game.title} Achievements`),
        description: `${game.title} tracks ${game.achievements.length} trophies, from ${game.achievements[0]?.name ?? "first run"} to ${game.achievements[game.achievements.length - 1]?.name ?? "mastery"}.`,
        h1: `${game.title} achievements`,
        minSignals: game.achievements.length,
      };
    case "tracks":
      return {
        title: absTitle(`${game.title} Tracks`),
        description: `${game.title} ships ${ed.tracks?.length ?? 0} authored circuits: ${ed.tracks?.map((t) => t.name).join(", ")}.`,
        h1: `${game.title} tracks`,
        minSignals: ed.tracks?.length ?? 0,
      };
    case "courses":
      return {
        title: absTitle(`${game.title} Courses`),
        description: `${game.title} has ${ed.courses?.length ?? 0} authored courses across ${[...new Set(ed.courses?.map((c) => c.world) ?? [])].join(", ")}.`,
        h1: `${game.title} courses`,
        minSignals: ed.courses?.length ?? 0,
      };
    case "scoring":
      return {
        title: absTitle(`${game.title} Scoring`),
        description: ed.scoring?.lead ?? game.description,
        h1: `${game.title} scoring`,
        minSignals: ed.scoring?.rules.length ?? 0,
      };
    default:
      throw new Error(`Unsupported topic ${topic}`);
  }
}

function collectionParents(): string[] {
  return [COLLECTIONS_INDEX, GAMES, HOME];
}

export function buildSeoPages(): SeoPage[] {
  const pages: SeoPage[] = [];
  const hubPaths = GAME_MANIFESTS.map((g) => hubPath(g.slug));
  const collectionPaths = COLLECTIONS.map((c) => `${COLLECTIONS_INDEX}/${c.slug}`);
  const allCluster = GAME_MANIFESTS.flatMap((g) => clusterChildren(g.slug));

  pages.push(
    page({
      path: HOME,
      title: `${brand.productName} — ${brand.tagline}`,
      description: brand.description,
      h1: "Neon Drift",
      ogImage: GAME_MANIFESTS[0].hero,
      indexable: true,
      canonical: HOME,
      updatedAt: SEO_UPDATED,
      topic: "home",
      parents: [],
      children: [GAMES, GUIDES, COLLECTIONS_INDEX, ...hubPaths],
      minSignals: 8,
    }),
    page({
      path: GAMES,
      title: absTitle("Free Browser Games Catalog"),
      description:
        "The public Gamesweb catalog: eight first-party browser games with hubs, guides, controls, and curated collections.",
      h1: "Browser games",
      ogImage: GAME_MANIFESTS[0].hero,
      indexable: true,
      canonical: GAMES,
      updatedAt: SEO_UPDATED,
      topic: "catalog",
      parents: [HOME],
      children: [...hubPaths, COLLECTIONS_INDEX, ...collectionPaths, GUIDES],
      minSignals: 8,
    }),
    page({
      path: GUIDES,
      title: absTitle("Game Guides"),
      description:
        "How each Gamesweb game actually plays — controls, scoring, strategy, and trophies taken from the live manifests.",
      h1: "Guides",
      ogImage: GAME_MANIFESTS[1].hero,
      indexable: true,
      canonical: GUIDES,
      updatedAt: SEO_UPDATED,
      topic: "guides-index",
      parents: [HOME, GAMES],
      children: GAME_MANIFESTS.map((g) => topicPath(g.slug, "guide")),
      minSignals: 8,
    }),
    page({
      path: COLLECTIONS_INDEX,
      title: absTitle("Game Collections"),
      description:
        "Curated Gamesweb shelves where at least three real games share a session shape: quick, skill, score-attack, keyboard, mobile, competitive, arcade.",
      h1: "Collections",
      ogImage: GAME_MANIFESTS[2].hero,
      indexable: true,
      canonical: COLLECTIONS_INDEX,
      updatedAt: SEO_UPDATED,
      topic: "collections-index",
      parents: [HOME, GAMES],
      children: collectionPaths,
      minSignals: COLLECTIONS.length,
    }),
  );

  for (const col of COLLECTIONS) {
    const path = `${COLLECTIONS_INDEX}/${col.slug}`;
    pages.push(
      page({
        path,
        title: absTitle(col.title),
        description: col.description,
        h1: col.h1,
        ogImage: getManifest(col.games[0])?.hero ?? GAME_MANIFESTS[0].hero,
        indexable: true,
        canonical: path,
        updatedAt: col.updatedAt,
        topic: "collection",
        collectionSlug: col.slug,
        parents: collectionParents(),
        children: col.games.map(hubPath),
        minSignals: col.games.length,
      }),
    );
  }

  for (const game of GAME_MANIFESTS) {
    const ed = editorialFor(game.slug);
    const hub = hubPath(game.slug);
    const related = GAME_MANIFESTS.filter((g) => g.id !== game.id)
      .slice(0, 3)
      .map((g) => hubPath(g.slug));
    const inCollections = COLLECTIONS.filter((c) => c.games.includes(game.slug)).map((c) => `${COLLECTIONS_INDEX}/${c.slug}`);
    const cluster = clusterChildren(game.slug);

    pages.push(
      page({
        path: hub,
        title: absTitle(gameSeoTitle(game.title, game.slug, game.genre)),
        description: ed.hubDescription,
        h1: game.title,
        ogImage: game.hero,
        indexable: true,
        canonical: hub,
        updatedAt: SEO_UPDATED,
        topic: "hub",
        gameSlug: game.slug,
        parents: [GAMES, HOME, ...inCollections],
        children: [...cluster, ...related, ...inCollections],
        minSignals: 4,
      }),
    );

    for (const row of topicsFor(game)) {
      if (!row.enabled) continue;
      const path = topicPath(game.slug, row.topic);
      const copy = clusterCopy(game, row.topic);
      const siblings = cluster.filter((p) => p !== path);
      pages.push(
        page({
          path,
          title: copy.title,
          description: copy.description,
          h1: copy.h1,
          ogImage: game.hero,
          indexable: true,
          canonical: path,
          updatedAt: SEO_UPDATED,
          topic: row.topic,
          gameSlug: game.slug,
          parents: [hub, GUIDES, GAMES],
          children: [hub, `/play/${game.slug}`, ...siblings.slice(0, 4)],
          minSignals: copy.minSignals,
        }),
      );
    }
  }

  pages.push(
    page({
      path: "/about",
      title: absTitle("About"),
      description: `${brand.productName} is a browser arcade with one player identity across instant games.`,
      h1: "About",
      ogImage: GAME_MANIFESTS[0].hero,
      indexable: true,
      canonical: "/about",
      updatedAt: SEO_UPDATED,
      topic: "legal",
      parents: [HOME],
      children: [GAMES, "/privacy", "/terms"],
      minSignals: 1,
    }),
    page({
      path: "/privacy",
      title: absTitle("Privacy"),
      description: "How Gamesweb stores guest progress, optional accounts, and analytics.",
      h1: "Privacy",
      ogImage: GAME_MANIFESTS[0].hero,
      indexable: true,
      canonical: "/privacy",
      updatedAt: SEO_UPDATED,
      topic: "legal",
      parents: [HOME, "/about"],
      children: ["/about", "/terms"],
      minSignals: 1,
    }),
    page({
      path: "/terms",
      title: absTitle("Terms"),
      description: "Terms for playing Gamesweb in the browser.",
      h1: "Terms",
      ogImage: GAME_MANIFESTS[0].hero,
      indexable: true,
      canonical: "/terms",
      updatedAt: SEO_UPDATED,
      topic: "legal",
      parents: [HOME, "/about"],
      children: ["/about", "/privacy"],
      minSignals: 1,
    }),
  );

  return pages;
}

export const SEO_PAGES = buildSeoPages();

export function indexablePages(): SeoPage[] {
  return SEO_PAGES.filter((p) => p.indexable);
}

export function seoPageByPath(path: string): SeoPage | undefined {
  return SEO_PAGES.find((p) => p.path === path);
}

export function gameCluster(slug: string): SeoPage[] {
  return SEO_PAGES.filter((p) => p.gameSlug === slug);
}

export function sitemapEntries() {
  return indexablePages().map((p) => ({
    path: p.path,
    lastModified: p.updatedAt,
  }));
}
