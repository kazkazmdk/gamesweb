import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { SeoEntry } from "./types";
import { isLocalhostUrl } from "./site";

const GAME_IDS = new Set(GAME_MANIFESTS.map((g) => g.id));

export type QualityIssue = {
  id: string;
  path: string;
  code: string;
  message: string;
};

export function qualityIssues(entries: SeoEntry[], inbound: Map<string, string[]>): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const h1s = new Map<string, string>();
  const paths = new Map<string, string>();

  for (const entry of entries) {
    const mark = (code: string, message: string) => issues.push({ id: entry.id, path: entry.path, code, message });

    if (!entry.path.startsWith("/")) mark("canonical", "Path must start with /");
    if (entry.path.includes("?")) mark("canonical", "No query params on SEO paths");
    if (paths.has(entry.path)) mark("path-dup", `Duplicate path with ${paths.get(entry.path)}`);
    paths.set(entry.path, entry.id);

    if (titles.has(entry.title)) mark("title-dup", `Title reused by ${titles.get(entry.title)}`);
    titles.set(entry.title, entry.id);
    if (descriptions.has(entry.description)) mark("desc-dup", `Description reused by ${descriptions.get(entry.description)}`);
    descriptions.set(entry.description, entry.id);
    if (h1s.has(entry.h1) && entry.kind !== "legal") mark("h1-dup", `H1 reused by ${h1s.get(entry.h1)}`);
    h1s.set(entry.h1, entry.id);

    if (entry.title.length < 12) mark("title", "Title too short");
    if (entry.description.length < 40) mark("desc", "Description too short");
    if (!entry.h1) mark("h1", "Missing H1");
    if (entry.sections.length < 1) mark("sections", "Needs at least one section");
    if (entry.indexable && entry.kind !== "legal" && entry.kind !== "home" && entry.sections.length < 2 && entry.kind !== "guide-hub" && !entry.kind.endsWith("-index")) {
      mark("sections", "Indexable editorial pages need two specific sections");
    }

    for (const id of entry.relatedGameIds) {
      if (!GAME_IDS.has(id)) mark("rel-game", `Unknown game ${id}`);
    }
    for (const id of entry.relatedGuideIds) {
      if (!entries.some((e) => e.id === id)) mark("rel-guide", `Unknown guide ${id}`);
    }
    for (const id of entry.relatedCollectionIds) {
      if (!entries.some((e) => e.id === id || e.id === `collection:${id}`)) mark("rel-col", `Unknown collection ${id}`);
    }

    if (entry.indexable && entry.kind !== "home" && entry.kind !== "legal") {
      const ins = inbound.get(entry.path) ?? [];
      if (ins.length === 0) mark("orphan", "Indexable page has no known internal inbound link");
    }

    if (entry.image && isLocalhostUrl(entry.image)) mark("localhost", "Image must not be a localhost URL");
  }

  return issues;
}

export function inboundMap(entries: SeoEntry[]): Map<string, string[]> {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const byCol = new Map(entries.filter((e) => e.kind === "collection").map((e) => [e.slug, e]));
  const inbound = new Map<string, string[]>();
  const add = (from: string, toPath: string) => {
    const list = inbound.get(toPath) ?? [];
    if (!list.includes(from)) list.push(from);
    inbound.set(toPath, list);
  };

  for (const entry of entries) {
    for (const id of entry.relatedGameIds) {
      const hub = byId.get(`game:${id}`);
      if (hub) add(entry.path, hub.path);
    }
    for (const id of entry.relatedGuideIds) {
      const g = byId.get(id);
      if (g) add(entry.path, g.path);
    }
    for (const id of entry.relatedCollectionIds) {
      const c = byId.get(id) ?? byId.get(`collection:${id}`) ?? byCol.get(id);
      if (c) add(entry.path, c.path);
    }
    for (const id of entry.relatedLearnIds ?? []) {
      const l = byId.get(id) ?? byId.get(`learn:${id}`);
      if (l) add(entry.path, l.path);
    }
    if (entry.kind === "guide" && entry.gameId) {
      add(entry.path, `/guides/${entry.gameId}`);
      add(entry.path, `/games/${entry.gameId}`);
      add(`/guides/${entry.gameId}`, entry.path);
    }
    if (entry.kind === "guide-hub" && entry.gameId) {
      add(entry.path, `/games/${entry.gameId}`);
      add("/guides", entry.path);
    }
    if (entry.kind === "collection") {
      add(entry.path, "/collections");
      add("/collections", entry.path);
    }
    if (entry.kind === "learn") {
      add(entry.path, "/learn");
      add("/learn", entry.path);
    }
    if (entry.kind === "game-hub") {
      add(entry.path, "/games");
      add("/games", entry.path);
      add("/", entry.path);
    }
  }

  add("/", "/games");
  add("/games", "/collections");
  add("/games", "/guides");
  add("/games", "/learn");
  add("/guides", "/learn");
  add("/collections", "/guides");

  return inbound;
}

export function applyQualityGate(entries: SeoEntry[]): SeoEntry[] {
  const inbound = inboundMap(entries);
  const blocked = new Set(
    qualityIssues(entries, inbound)
      .filter((i) => i.code === "orphan" || i.code === "rel-game" || i.code === "rel-guide")
      .map((i) => i.id),
  );
  return entries.map((entry) => {
    if (!entry.indexable) return entry;
    if (blocked.has(entry.id) && entry.kind !== "home" && entry.kind !== "legal") {
      return { ...entry, indexable: false };
    }
    return entry;
  });
}
