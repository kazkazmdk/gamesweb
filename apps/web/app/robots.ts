import type { MetadataRoute } from "next";
import { publicOrigin } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
