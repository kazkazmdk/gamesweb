import type { MetadataRoute } from "next";
import { requestOrigin } from "@/lib/origin";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await requestOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
