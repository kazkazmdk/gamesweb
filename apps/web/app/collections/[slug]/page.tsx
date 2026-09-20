import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/seo/CollectionViews";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { entryMetadata } from "@/lib/seo";
import { entriesByKind, entryByPath } from "@/lib/seo-content/registry";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo-content/schema";

export function generateStaticParams() {
  return entriesByKind("collection").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = entryByPath(`/collections/${slug}`);
  if (!entry) return { title: "Collection" };
  return entryMetadata(entry);
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = entryByPath(`/collections/${slug}`);
  if (!entry) notFound();
  return (
    <>
      <SeoJsonLd
        data={[
          breadcrumbJsonLd(entry),
          itemListJsonLd(
            entry.h1,
            entry.path,
            entry.relatedGameIds.map((id) => ({ name: id, path: `/games/${id}` })),
          ),
        ]}
      />
      <CollectionView slug={slug} />
    </>
  );
}
