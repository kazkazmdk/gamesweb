import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/content";
import { requestOrigin } from "@/lib/origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await requestOrigin();
  return sitemapEntries().map((entry) => ({
    url: `${base}${entry.path === "/" ? "" : entry.path}`,
    lastModified: new Date(`${entry.lastModified}T00:00:00Z`),
  }));
}
