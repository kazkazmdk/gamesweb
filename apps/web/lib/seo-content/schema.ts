import { brand } from "@gamesweb/config";
import type { GameManifest } from "@gamesweb/game-sdk";
import { absoluteUrl } from "./site";
import type { SeoEntry } from "./types";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.productName,
    url: absoluteUrl("/"),
    description: brand.description,
  };
}

export function breadcrumbJsonLd(entry: SeoEntry) {
  const crumbs = crumbsFor(entry);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function crumbsFor(entry: SeoEntry): { name: string; path: string }[] {
  const home = { name: brand.productName, path: "/" };
  if (entry.kind === "home") return [home];
  if (entry.kind === "catalog") return [home, { name: "Games", path: "/games" }];
  if (entry.kind === "game-hub") {
    return [home, { name: "Games", path: "/games" }, { name: entry.h1, path: entry.path }];
  }
  if (entry.kind === "collection-index") return [home, { name: "Collections", path: "/collections" }];
  if (entry.kind === "collection") {
    return [home, { name: "Collections", path: "/collections" }, { name: entry.h1, path: entry.path }];
  }
  if (entry.kind === "guide-index") return [home, { name: "Guides", path: "/guides" }];
  if (entry.kind === "guide-hub") {
    return [home, { name: "Guides", path: "/guides" }, { name: entry.h1, path: entry.path }];
  }
  if (entry.kind === "guide") {
    return [
      home,
      { name: "Guides", path: "/guides" },
      { name: `${entry.gameId} guides`, path: `/guides/${entry.gameId}` },
      { name: entry.h1, path: entry.path },
    ];
  }
  if (entry.kind === "learn-index") return [home, { name: "Learn", path: "/learn" }];
  if (entry.kind === "learn") {
    return [home, { name: "Learn", path: "/learn" }, { name: entry.h1, path: entry.path }];
  }
  return [home, { name: entry.h1, path: entry.path }];
}

export function itemListJsonLd(name: string, path: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(entry: SeoEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.h1,
    description: entry.description,
    datePublished: entry.publishedAt,
    dateModified: entry.updatedAt,
    mainEntityOfPage: absoluteUrl(entry.path),
    image: entry.image ? absoluteUrl(entry.image) : undefined,
    publisher: {
      "@type": "Organization",
      name: brand.productName,
      url: absoluteUrl("/"),
    },
  };
}

export function videoGameJsonLd(game: GameManifest) {
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
