import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { sitemapEntries } from "@/lib/content/registry";
import { absoluteUrl, publicOrigin } from "@/lib/content/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const origin = publicOrigin(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"));
  return sitemapEntries().map((entry) => ({
    url: absoluteUrl(entry.urlPath).replace(publicOrigin(), origin),
    lastModified: new Date(entry.lastModified),
  }));
}
