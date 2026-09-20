import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideHubView } from "@/components/seo/GuideViews";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { entryMetadata } from "@/lib/seo";
import { entriesByKind, entryByPath } from "@/lib/seo-content/registry";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo-content/schema";

export function generateStaticParams() {
  return entriesByKind("guide-hub").map((h) => ({ game: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const entry = entryByPath(`/guides/${game}`);
  if (!entry) return { title: "Guides" };
  return entryMetadata(entry);
}

export default async function GameGuideHubPage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  const entry = entryByPath(`/guides/${game}`);
  if (!entry) notFound();
  return (
    <>
      <SeoJsonLd
        data={[
          breadcrumbJsonLd(entry),
          itemListJsonLd(
            entry.h1,
            entry.path,
            entry.relatedGuideIds.map((id) => {
              const g = entriesByKind("guide").find((x) => x.id === id);
              return { name: g?.h1 ?? id, path: g?.path ?? `/guides/${game}` };
            }),
          ),
        ]}
      />
      <GuideHubView gameSlug={game} />
    </>
  );
}
