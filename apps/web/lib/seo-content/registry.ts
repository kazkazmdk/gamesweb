import { COLLECTIONS } from "./collections";
import { GUIDES, GUIDE_HUBS } from "./guides";
import { gameHubEntries } from "./hubs";
import { LEARN_PAGES } from "./learn";
import { STATIC_PAGES } from "./pages";
import { applyQualityGate, inboundMap, qualityIssues } from "./quality";
import type { CollectionRecord, GuideRecord, SeoEntry, SeoKind } from "./types";

function withHubGuides(hubs: SeoEntry[]): SeoEntry[] {
  return hubs.map((hub) => ({
    ...hub,
    relatedGuideIds: GUIDES.filter((g) => g.gameId === hub.gameId).map((g) => g.id),
    relatedCollectionIds:
      hub.relatedCollectionIds.length > 0
        ? hub.relatedCollectionIds
        : COLLECTIONS.filter((c) => c.relatedGameIds.includes(hub.gameId ?? "")).slice(0, 3).map((c) => c.slug),
  }));
}

const RAW: SeoEntry[] = [
  ...STATIC_PAGES,
  ...gameHubEntries(),
  ...COLLECTIONS,
  ...withHubGuides(GUIDE_HUBS),
  ...GUIDES,
  ...LEARN_PAGES,
];

export const SEO_ENTRIES: SeoEntry[] = applyQualityGate(RAW);

export const SITEMAP_INDEX_THRESHOLD = 40_000;

export function allEntries() {
  return SEO_ENTRIES;
}

export function indexableEntries() {
  return SEO_ENTRIES.filter((e) => e.indexable);
}

export function entryByPath(path: string) {
  return SEO_ENTRIES.find((e) => e.path === path);
}

export function entryById(id: string) {
  return SEO_ENTRIES.find((e) => e.id === id || e.id === `collection:${id}` || e.id === `learn:${id}` || e.id === `game:${id}`);
}

export function entriesByKind(kind: SeoKind) {
  return SEO_ENTRIES.filter((e) => e.kind === kind);
}

export function collectionBySlug(slug: string): CollectionRecord | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function guideByPath(path: string): GuideRecord | undefined {
  return GUIDES.find((g) => g.path === path);
}

export function relatedEntries(entry: SeoEntry) {
  return {
    games: entry.relatedGameIds.map((id) => entryById(`game:${id}`)).filter((e): e is SeoEntry => Boolean(e)),
    guides: entry.relatedGuideIds.map((id) => entryById(id)).filter((e): e is SeoEntry => Boolean(e)),
    collections: entry.relatedCollectionIds
      .map((id) => entryById(id) ?? entryById(`collection:${id}`))
      .filter((e): e is SeoEntry => Boolean(e)),
    learn: (entry.relatedLearnIds ?? [])
      .map((id) => entryById(id) ?? entryById(`learn:${id}`))
      .filter((e): e is SeoEntry => Boolean(e)),
  };
}

export function seoAudit() {
  return qualityIssues(SEO_ENTRIES, inboundMap(SEO_ENTRIES));
}

export function rawSeoAudit() {
  return qualityIssues(RAW, inboundMap(RAW));
}

export function sitemapRecords() {
  return indexableEntries().map((entry) => ({
    path: entry.path,
    url: entry.path,
    lastModified: entry.updatedAt,
  }));
}

export function shouldUseSitemapIndex(count = indexableEntries().length) {
  return count >= SITEMAP_INDEX_THRESHOLD;
}

export function countsByFamily() {
  const counts: Record<string, number> = {};
  for (const entry of indexableEntries()) {
    counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
  }
  return counts;
}
