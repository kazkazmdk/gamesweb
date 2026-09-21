import { brand } from "@gamesweb/config";
import type { Metadata } from "next";
import { seoPageByPath, type SeoPage } from "@/content";
import { gameSeoKind as kindFromTaxonomy, gameSeoTitle as titleFromTaxonomy } from "@/content/taxonomy";
import { publicOrigin } from "@/lib/env";

export const NOINDEX = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
} as const;

export const NOINDEX_FOLLOW = {
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
} as const;

export const INDEX = {
  robots: { index: true, follow: true },
} as const;

export const MANIFEST_UPDATED = "2026-09-20";

export function gameSeoKind(slug: string, genre: string): string {
  return kindFromTaxonomy(slug, genre);
}

export function gameSeoTitle(title: string, genre: string, slug?: string): string {
  if (slug) return titleFromTaxonomy(title, slug, genre);
  return titleFromTaxonomy(title, "", genre);
}

export function absoluteUrl(path: string): string {
  const origin = publicOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function metadataFromPage(page: SeoPage): Metadata {
  const canonical = page.canonical;
  const robots = page.indexable ? INDEX : page.follow ? NOINDEX_FOLLOW : NOINDEX;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical },
    ...robots,
    openGraph: {
      title: page.ogTitle,
      description: page.ogDescription,
      url: canonical,
      images: [{ url: page.ogImage, alt: page.h1 }],
      siteName: brand.productName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.ogTitle,
      description: page.ogDescription,
      images: [page.ogImage],
    },
  };
}

export function metadataForPath(path: string): Metadata {
  const page = seoPageByPath(path);
  if (!page) return { title: brand.productName, ...NOINDEX_FOLLOW };
  return metadataFromPage(page);
}

export function videoGameJsonLd(game: {
  title: string;
  description: string;
  genre: string;
  slug: string;
  hero: string;
}) {
  const url = absoluteUrl(`/games/${game.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["VideoGame", "WebApplication"],
        name: game.title,
        description: game.description,
        genre: game.genre,
        gamePlatform: "Web Browser",
        operatingSystem: "Web Browser",
        applicationCategory: "GameApplication",
        playMode: "SinglePlayer",
        url,
        image: absoluteUrl(game.hero),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListJsonLd(name: string, paths: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: paths.length,
    itemListElement: paths.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(input: { title: string; description: string; path: string; image: string; updatedAt: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    image: absoluteUrl(input.image),
    dateModified: input.updatedAt,
    author: { "@type": "Organization", name: brand.productName },
    publisher: { "@type": "Organization", name: brand.productName },
  };
}

export { seoPageByPath };
