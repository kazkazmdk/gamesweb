export type SeoKind = "home" | "legal" | "catalog" | "game-hub" | "collection-index" | "collection" | "guide-index" | "guide-hub" | "guide" | "learn-index" | "learn";

export type SeoSection = {
  heading: string;
  body: string;
};

export type SeoFaq = {
  q: string;
  a: string;
};

export type SeoEntry = {
  id: string;
  kind: SeoKind;
  path: string;
  slug: string;
  title: string;
  description: string;
  h1: string;
  intent: string;
  summary: string;
  sections: SeoSection[];
  faqs?: SeoFaq[];
  relatedGameIds: string[];
  relatedGuideIds: string[];
  relatedCollectionIds: string[];
  relatedLearnIds?: string[];
  publishedAt: string;
  updatedAt: string;
  indexable: boolean;
  image?: string;
  gameId?: string;
};

export type CollectionRecord = SeoEntry & {
  kind: "collection";
  pick: { gameId: string; reason: string };
};

export type GuideRecord = SeoEntry & {
  kind: "guide";
  gameId: string;
};
