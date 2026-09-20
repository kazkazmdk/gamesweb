import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import { INDEX, NOINDEX_APP, NOINDEX_PRIVATE } from "@/lib/content/policy";
import { videoGameJsonLd as videoGameFromContent } from "@/lib/content/schema";
import { publicOrigin } from "@/lib/content/site";
import { gameSeoTitle as taxonomyTitle, seoTaxonomy } from "@/lib/content/taxonomy";

export const NOINDEX = NOINDEX_PRIVATE;
export const NOINDEX_FOLLOW = NOINDEX_APP;
export { INDEX, NOINDEX_APP, NOINDEX_PRIVATE };

export const MANIFEST_UPDATED = "2026-09-20";

export function videoGameJsonLd(game: {
  title: string;
  description: string;
  genre: string;
  slug: string;
  hero: string;
}) {
  const manifest = getManifest(game.slug);
  if (manifest) return videoGameFromContent(manifest, game.hero);
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    genre: game.genre,
    gamePlatform: "Web Browser",
    applicationCategory: "GameApplication",
    playMode: "SinglePlayer",
    url: `${publicOrigin()}/games/${game.slug}`,
    image: `${publicOrigin()}${game.hero}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

const GENRE_KIND: Record<string, string> = {
  Driving: "free browser drift game",
  Platformer: "free browser parkour time-trial game",
  Survival: "free browser arena survival game",
  Arcade: "free browser stacking arcade game",
  Obstacle: "free browser obstacle race game",
  Physics: "free browser physics precision game",
  Arena: "free browser territory area-control game",
  Runner: "free browser crowd runner game",
};

export function gameSeoTitle(title: string, genre: string) {
  const byTitle = GAME_MANIFESTS.find((g) => g.title === title);
  if (byTitle) return taxonomyTitle(byTitle.slug);
  const kind = GENRE_KIND[genre];
  if (!kind) {
    throw new Error(`No SEO taxonomy for genre "${genre}" / title "${title}". Do not default to Survival.`);
  }
  return `${title} — ${kind}`;
}

export function gameSeoTitleForSlug(slug: string) {
  return taxonomyTitle(slug);
}

export { seoTaxonomy, publicOrigin };
