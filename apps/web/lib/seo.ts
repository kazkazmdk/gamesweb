import { brand } from "@gamesweb/config";

export const NOINDEX = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
} as const;

export const NOINDEX_FOLLOW = {
  robots: { index: false, follow: true },
} as const;

export const INDEX = {
  robots: { index: true, follow: true },
} as const;

export const CONTENT_UPDATED = "2026-09-21";

const GENRE_KIND: Record<string, string> = {
  Driving: "Drift Game",
  Platformer: "Parkour Game",
  Survival: "Survival Game",
  Arcade: "Arcade Stacking Game",
  Obstacle: "Obstacle Race Game",
  Physics: "Physics Sports Game",
  Arena: "Paint Arena Game",
  Runner: "Crowd Runner Game",
};

export function gameSeoTitle(title: string, genre: string) {
  const kind = GENRE_KIND[genre] ?? `${genre} Game`;
  return `${title} — Free Online ${kind}`;
}

export function metadataFromPage(page: {
  title: string;
  description: string;
  path: string;
  image?: string;
  index?: boolean;
}) {
  const image = page.image ?? "/opengraph-image";
  const index = page.index !== false;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.path },
    robots: index ? INDEX.robots : NOINDEX_FOLLOW.robots,
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.path,
      siteName: brand.productName,
      images: [{ url: image, alt: page.title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: page.title,
      description: page.description,
      images: [image],
    },
  };
}

export function videoGameJsonLd(game: {
  title: string;
  description: string;
  genre: string;
  slug: string;
  hero: string;
  origin: string;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        name: game.title,
        description: game.description,
        genre: game.genre,
        gamePlatform: "Web Browser",
        playMode: "SinglePlayer",
        url: `${game.origin}/games/${game.slug}`,
        image: `${game.origin}${game.hero}`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "WebApplication",
        name: `${game.title} on ${brand.productName}`,
        applicationCategory: "GameApplication",
        operatingSystem: "Any",
        url: `${game.origin}/games/${game.slug}`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
}

export function breadcrumbJsonLd(origin: string, crumbs: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${origin}${c.path}`,
    })),
  };
}

export function itemListJsonLd(origin: string, name: string, items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${origin}${item.path}`,
    })),
  };
}
