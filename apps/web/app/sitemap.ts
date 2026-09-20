import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/content/registry";
import { absoluteUrl } from "@/lib/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries().map((entry) => ({
    url: absoluteUrl(entry.urlPath),
    lastModified: new Date(entry.lastModified),
  }));
}
