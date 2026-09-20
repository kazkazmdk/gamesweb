import { brand } from "@gamesweb/config";
import type { GameManifest } from "@gamesweb/game-sdk";
import { absoluteUrl } from "./site";
import type { Breadcrumb } from "./types";

export function videoGameJsonLd(game: GameManifest, image: string) {
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
    image: absoluteUrl(image),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

export function breadcrumbJsonLd(crumbs: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.href),
    })),
  };
}

export function itemListJsonLd(name: string, items: Array<{ name: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.href),
    })),
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.productName,
    url: absoluteUrl("/"),
    description: brand.description,
  };
}
