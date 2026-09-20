import type { Metadata } from "next";
import type { SeoEntry } from "@/lib/seo-content/types";
import { absoluteUrl } from "@/lib/seo-content/site";

export const NOINDEX = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
} as const;

export const INDEX = {
  robots: { index: true, follow: true },
} as const;

export const MANIFEST_UPDATED = "2026-09-20";

export function entryMetadata(entry: SeoEntry): Metadata {
  const robots = entry.indexable ? INDEX : NOINDEX;
  const image = entry.image;
  return {
    title: { absolute: entry.title },
    description: entry.description,
    alternates: { canonical: entry.path },
    ...robots,
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: entry.path,
      type: entry.kind === "guide" ? "article" : "website",
      images: image ? [{ url: image, alt: entry.h1 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: image ? [image] : undefined,
    },
  };
}

export function videoGameJsonLd(game: {
  title: string;
  description: string;
  genre: string;
  slug: string;
  hero: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    genre: game.genre,
    gamePlatform: "Web Browser",
    applicationCategory: "GameApplication",
    playMode: "SinglePlayer",
    url: absoluteUrl(`/games/${game.slug}`),
    image: absoluteUrl(game.hero),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

export function gameSeoTitle(title: string, genre: string) {
  const kind =
    genre === "Driving" ? "Drift Game" : genre === "Platformer" ? "Parkour Game" : "Survival Game";
  return `${title} — Free Browser ${kind}`;
}
