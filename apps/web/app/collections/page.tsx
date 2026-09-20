import type { Metadata } from "next";
import { CollectionIndexView } from "@/components/seo/CollectionViews";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { entryMetadata } from "@/lib/seo";
import { entriesByKind, entryByPath } from "@/lib/seo-content/registry";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo-content/schema";

const entry = entryByPath("/collections")!;

export const metadata: Metadata = entryMetadata(entry);

export default function CollectionsPage() {
  const items = entriesByKind("collection");
  return (
    <>
      <SeoJsonLd
        data={[
          breadcrumbJsonLd(entry),
          itemListJsonLd(
            entry.h1,
            entry.path,
            items.map((c) => ({ name: c.h1, path: c.path })),
          ),
        ]}
      />
      <CollectionIndexView />
    </>
  );
}
