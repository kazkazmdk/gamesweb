import type { Metadata } from "next";
import { LearnIndexView } from "@/components/seo/LearnViews";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { entryMetadata } from "@/lib/seo";
import { entriesByKind, entryByPath } from "@/lib/seo-content/registry";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo-content/schema";

const entry = entryByPath("/learn")!;

export const metadata: Metadata = entryMetadata(entry);

export default function LearnPage() {
  const pages = entriesByKind("learn");
  return (
    <>
      <SeoJsonLd
        data={[
          breadcrumbJsonLd(entry),
          itemListJsonLd(
            entry.h1,
            entry.path,
            pages.map((p) => ({ name: p.h1, path: p.path })),
          ),
        ]}
      />
      <LearnIndexView />
    </>
  );
}
