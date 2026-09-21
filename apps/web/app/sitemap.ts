import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/content";
import { publicOrigin } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicOrigin();
  return sitemapEntries().map((entry) => ({
    url: `${base}${entry.path === "/" ? "" : entry.path}`,
    lastModified: new Date(`${entry.lastModified}T00:00:00Z`),
  }));
}
