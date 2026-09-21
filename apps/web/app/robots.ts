import type { MetadataRoute } from "next";
import { requestOrigin } from "@/lib/origin";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await requestOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/play/", "/auth", "/settings", "/me", "/friends", "/crew", "/party", "/inbox", "/c/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
