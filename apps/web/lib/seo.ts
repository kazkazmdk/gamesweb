export const NOINDEX = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
} as const;

export const INDEX = {
  robots: { index: true, follow: true },
} as const;

export const MANIFEST_UPDATED = "2026-09-14";

export function videoGameJsonLd(game: {
  title: string;
  description: string;
  genre: string;
  slug: string;
  hero: string;
}) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    genre: game.genre,
    gamePlatform: "Web Browser",
    applicationCategory: "GameApplication",
    playMode: "SinglePlayer",
    url: `${base}/games/${game.slug}`,
    image: `${base}${game.hero}`,
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
