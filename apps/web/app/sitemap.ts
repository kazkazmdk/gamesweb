import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const pages = ["/", "/play", "/challenges", "/leaderboards", "/about", "/privacy", "/terms"];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, lastModified: now })),
    ...GAME_MANIFESTS.flatMap((g) => [
      { url: `${base}/games/${g.slug}`, lastModified: now },
      { url: `${base}/play/${g.slug}`, lastModified: now },
    ]),
  ];
}
