import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { allCollections, buildCollectionEntity, collectionIndexEntity } from "./collections";
import { allContentUnits } from "./content-units";
import { allGameEditorials } from "./games";
import { allGuides } from "./guides";
import { isPrivatePath } from "./policy";
import { applyGate } from "./quality";
import { gameImage, isoDate } from "./site";
import type { IndexableEntity } from "./types";

function homeEntity(): IndexableEntity {
  return applyGate(
    {
      id: "home",
      kind: "home",
      path: "/",
      slug: "home",
      title: "Gamesweb — Play first. Keep going.",
      h1: "Play first. Keep going.",
      description: "Instant browser games bound by one player identity — XP, records, challenges, friends.",
      canonical: "/",
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "site home",
      updatedAt: isoDate(),
      image: gameImage("neon-drift", "hero"),
      imageAlt: "Gamesweb home stage",
      breadcrumbs: [{ name: "Home", href: "/" }],
      relatedLinks: [
        { href: "/games", label: "Games catalog" },
        { href: "/guides", label: "Guides" },
        { href: "/collections", label: "Collections" },
        { href: "/about", label: "About" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
        ...GAME_MANIFESTS.map((g) => ({ href: `/games/${g.slug}`, label: g.title })),
      ],
    },
    "Gamesweb eight first-party browser games",
    { gameBacked: true },
  );
}

function catalogEntity(): IndexableEntity {
  return applyGate(
    {
      id: "catalog",
      kind: "catalog",
      path: "/games",
      slug: "games",
      title: "Eight first-party browser games",
      h1: "Games",
      description:
        "Eight first-party browser games: drift, parkour, survival, stacking, obstacle race, physics, territory, and crowd runner. Session lengths and inputs from the live manifests.",
      canonical: "/games",
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "public catalog",
      updatedAt: isoDate(),
      image: gameImage("velocity-run", "hero"),
      imageAlt: "Gamesweb public game catalog",
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Games", href: "/games" },
      ],
      relatedLinks: [
        { href: "/", label: "Home" },
        { href: "/guides", label: "Guides" },
        { href: "/collections", label: "Collections" },
        { href: "/about", label: "About" },
        ...GAME_MANIFESTS.map((g) => ({ href: `/games/${g.slug}`, label: g.title })),
      ],
    },
    GAME_MANIFESTS.map((g) => `${g.title} ${g.genre} ${g.sessionHint}`).join(" "),
    { gameBacked: true },
  );
}

function guidesIndexEntity(): IndexableEntity {
  const guides = allGuides();
  return applyGate(
    {
      id: "guides-index",
      kind: "guides-index",
      path: "/guides",
      slug: "guides",
      title: "Gamesweb guides",
      h1: "Guides",
      description: "How-to-play and strategy pages authored from Gamesweb mechanics — not a generic gaming blog.",
      canonical: "/guides",
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "guide directory",
      updatedAt: isoDate(),
      image: gameImage("swarm-protocol", "tile"),
      imageAlt: "First-party Gamesweb guides",
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: "Guides", href: "/guides" },
      ],
      relatedLinks: [
        { href: "/games", label: "Games" },
        { href: "/collections", label: "Collections" },
        ...guides.map((g) => ({ href: g.entity.path, label: g.entity.h1 })),
      ],
    },
    guides.map((g) => g.lead).join(" "),
    { gameBacked: true },
  );
}

function legalEntity(path: string, title: string, h1: string, description: string): IndexableEntity {
  return applyGate(
    {
      id: `legal:${path}`,
      kind: "legal",
      path,
      slug: path.slice(1),
      title,
      h1,
      description,
      canonical: path,
      indexable: true,
      indexStatus: "INDEXABLE",
      indexReason: "public legal page",
      updatedAt: isoDate("2026-09-14"),
      image: gameImage("sky-stack", "tile"),
      imageAlt: title,
      breadcrumbs: [
        { name: "Home", href: "/" },
        { name: title, href: path },
      ],
      relatedLinks: [
        { href: "/", label: "Home" },
        { href: "/games", label: "Games" },
        { href: "/about", label: "About" },
      ],
    },
    description,
    { gameBacked: true },
  );
}

let cache: IndexableEntity[] | null = null;

export function allPublicEntities(): IndexableEntity[] {
  if (cache) return cache;
  const entities: IndexableEntity[] = [
    homeEntity(),
    catalogEntity(),
    ...allGameEditorials().map((g) => g.entity),
    ...allGuides().map((g) => g.entity),
    ...allContentUnits().map((u) => u.entity),
    collectionIndexEntity(),
    ...allCollections().map(buildCollectionEntity),
    guidesIndexEntity(),
    legalEntity("/about", "About Gamesweb", "About", "Who makes Gamesweb and what the eight first-party games are."),
    legalEntity("/privacy", "Privacy — Gamesweb", "Privacy", "How Gamesweb handles player data on this site."),
    legalEntity("/terms", "Terms — Gamesweb", "Terms", "Terms of use for Gamesweb browser games."),
  ];
  cache = entities;
  return entities;
}

export function indexableEntities(): IndexableEntity[] {
  return allPublicEntities().filter((e) => e.indexable && e.indexStatus === "INDEXABLE");
}

export function entityByPath(path: string): IndexableEntity | undefined {
  return allPublicEntities().find((e) => e.path === path);
}

export function sitemapEntries() {
  return indexableEntities()
    .filter((e) => !isPrivatePath(e.path))
    .map((e) => ({
      path: e.path,
      urlPath: e.canonical,
      lastModified: e.updatedAt,
    }));
}

export type GraphEdge = { from: string; to: string };

export function crawlableEdges(): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const entity of indexableEntities()) {
    for (const link of entity.relatedLinks) {
      edges.push({ from: entity.path, to: link.href });
    }
  }
  return edges;
}

export function orphanIndexablePaths(): string[] {
  const indexable = new Set(indexableEntities().map((e) => e.path));
  const incoming = new Map<string, number>();
  for (const path of indexable) incoming.set(path, 0);
  for (const edge of crawlableEdges()) {
    if (!indexable.has(edge.to)) continue;
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }
  incoming.set("/", (incoming.get("/") ?? 0) + 1);
  return [...indexable].filter((path) => (incoming.get(path) ?? 0) < 1);
}

export function duplicateTitles() {
  const map = new Map<string, string[]>();
  for (const e of indexableEntities()) {
    const list = map.get(e.title) ?? [];
    list.push(e.path);
    map.set(e.title, list);
  }
  return [...map.entries()].filter(([, paths]) => paths.length > 1);
}

export function duplicateH1() {
  const map = new Map<string, string[]>();
  for (const e of indexableEntities()) {
    const key = `${e.kind}:${e.h1}`;
    const list = map.get(key) ?? [];
    list.push(e.path);
    map.set(key, list);
  }
  return [...map.entries()].filter(([, paths]) => paths.length > 1);
}

export function duplicateCanonicals() {
  const map = new Map<string, string[]>();
  for (const e of allPublicEntities()) {
    if (!e.indexable) continue;
    const list = map.get(e.canonical) ?? [];
    list.push(e.path);
    map.set(e.canonical, list);
  }
  return [...map.entries()].filter(([, paths]) => paths.length > 1);
}

export function playAppEntity(slug: string): IndexableEntity {
  return {
    id: `play:${slug}`,
    kind: "app",
    path: `/play/${slug}`,
    slug,
    title: `Play ${slug}`,
    h1: "Play",
    description: "Runtime play surface",
    canonical: `/games/${slug}`,
    indexable: false,
    indexStatus: "NOINDEX_APP",
    indexReason: "Game runtime — public hub is /games/[slug]",
    updatedAt: isoDate(),
    image: gameImage(slug),
    imageAlt: "Play",
    breadcrumbs: [],
    relatedLinks: [{ href: `/games/${slug}`, label: "Game hub" }],
    gameSlug: slug,
  };
}
