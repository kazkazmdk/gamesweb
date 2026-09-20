import type { MetadataRoute } from "next";
import { indexableEntries, shouldUseSitemapIndex } from "@/lib/seo-content/registry";
import { absoluteUrl } from "@/lib/seo-content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  void shouldUseSitemapIndex();
  return indexableEntries().map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: new Date(`${entry.updatedAt}T00:00:00Z`),
  }));
}
