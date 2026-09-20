import type { Metadata } from "next";
import { GuideIndexView } from "@/components/seo/GuideViews";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { entryMetadata } from "@/lib/seo";
import { entriesByKind, entryByPath } from "@/lib/seo-content/registry";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo-content/schema";

const entry = entryByPath("/guides")!;

export const metadata: Metadata = entryMetadata(entry);

export default function GuidesPage() {
  const hubs = entriesByKind("guide-hub");
  return (
    <>
      <SeoJsonLd
        data={[
          breadcrumbJsonLd(entry),
          itemListJsonLd(
            entry.h1,
            entry.path,
            hubs.map((h) => ({ name: h.h1, path: h.path })),
          ),
        ]}
      />
      <GuideIndexView />
    </>
  );
}
