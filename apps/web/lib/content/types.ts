export const INDEX_STATUSES = [
  "INDEXABLE",
  "NOINDEX_THIN",
  "NOINDEX_DUPLICATE",
  "NOINDEX_APP",
  "NOINDEX_PLACEHOLDER",
] as const;

export type IndexStatus = (typeof INDEX_STATUSES)[number];

export type PageKind =
  | "home"
  | "catalog"
  | "game-hub"
  | "how-to-play"
  | "strategy"
  | "track"
  | "course"
  | "map"
  | "table"
  | "collection"
  | "collection-index"
  | "guides-index"
  | "legal"
  | "app";

export type Breadcrumb = { name: string; href: string };

export type RelatedLink = { href: string; label: string; kind?: string };

export type IndexableEntity = {
  id: string;
  kind: PageKind;
  path: string;
  slug: string;
  title: string;
  h1: string;
  description: string;
  canonical: string;
  indexable: boolean;
  indexStatus: IndexStatus;
  indexReason: string;
  updatedAt: string;
  image: string;
  imageAlt: string;
  breadcrumbs: Breadcrumb[];
  relatedLinks: RelatedLink[];
  gameSlug?: string;
  parentPath?: string;
};

export type SeoTaxonomy = {
  slug: string;
  genre: string;
  kindLabel: string;
  titlePattern: string;
  shortKind: string;
};
