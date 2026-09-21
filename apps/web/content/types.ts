export const SEO_UPDATED = "2026-09-20";

export type SeoTopic =
  | "hub"
  | "guide"
  | "how-to-play"
  | "controls"
  | "strategy"
  | "achievements"
  | "tracks"
  | "courses"
  | "scoring"
  | "catalog"
  | "guides-index"
  | "collections-index"
  | "collection"
  | "legal"
  | "home";

export type SeoPage = {
  path: string;
  title: string;
  description: string;
  h1: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  indexable: boolean;
  follow: boolean;
  canonical: string;
  updatedAt: string;
  topic: SeoTopic;
  gameSlug?: string;
  collectionSlug?: string;
  parents: string[];
  children: string[];
  minSignals: number;
};

export type CollectionRecord = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  rationale: string;
  games: string[];
  updatedAt: string;
};

export type GameTrackFact = {
  id: string;
  name: string;
  subtitle: string;
  note: string;
};

export type GameCourseFact = {
  id: string;
  name: string;
  world: string;
  subtitle: string;
  medals: string;
};

export type GameEditorial = {
  slug: string;
  kind: string;
  hubTitle: string;
  hubDescription: string;
  whyDistinct: string;
  run: string[];
  guideLead: string;
  howToLead: string;
  controlsLead: string;
  strategy: string[];
  scoring?: { lead: string; rules: string[] };
  tracks?: GameTrackFact[];
  courses?: GameCourseFact[];
};
