import { brand } from "@gamesweb/config";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.productName,
    short_name: brand.shortName,
    description: brand.description,
    start_url: "/",
    display: "standalone",
    background_color: brand.backgroundColor,
    theme_color: brand.themeColor,
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
