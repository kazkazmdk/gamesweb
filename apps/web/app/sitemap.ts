import type { MetadataRoute } from "next";
import { indexablePages } from "@/content/registry";
import { requestOrigin } from "@/lib/origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await requestOrigin();
  return indexablePages().map((page) => ({
    url: `${origin}${page.path}`,
    lastModified: new Date(`${page.lastModified}T00:00:00Z`),
  }));
}
