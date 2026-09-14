import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { MetadataRoute } from "next";
import { MANIFEST_UPDATED } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const updated = new Date(`${MANIFEST_UPDATED}T00:00:00Z`);
  const pages = ["/", "/play", "/about", "/privacy", "/terms"];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, lastModified: updated })),
    ...GAME_MANIFESTS.map((g) => ({
      url: `${base}/games/${g.slug}`,
      lastModified: updated,
    })),
  ];
}
