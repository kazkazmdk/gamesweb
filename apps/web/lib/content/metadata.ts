import { brand } from "@gamesweb/config";
import type { Metadata } from "next";
import { robotsForStatus } from "./policy";
import type { IndexableEntity } from "./types";

export function entityMetadata(entity: IndexableEntity): Metadata {
  const title = { absolute: `${entity.title} | ${brand.productName}` };
  return {
    title,
    description: entity.description,
    alternates: { canonical: entity.canonical },
    ...robotsForStatus(entity.indexStatus),
    openGraph: {
      title: `${entity.title} | ${brand.productName}`,
      description: entity.description,
      url: entity.canonical,
      images: [{ url: entity.image, alt: entity.imageAlt }],
      type: "website",
      siteName: brand.productName,
    },
    twitter: {
      card: "summary_large_image",
      title: `${entity.title} | ${brand.productName}`,
      description: entity.description,
      images: [entity.image],
    },
  };
}
