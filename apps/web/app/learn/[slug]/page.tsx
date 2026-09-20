import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearnView } from "@/components/seo/LearnViews";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { entryMetadata } from "@/lib/seo";
import { entriesByKind, entryByPath } from "@/lib/seo-content/registry";
import { breadcrumbJsonLd } from "@/lib/seo-content/schema";

export function generateStaticParams() {
  return entriesByKind("learn").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = entryByPath(`/learn/${slug}`);
  if (!entry) return { title: "Learn" };
  return entryMetadata(entry);
}

export default async function LearnSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = entryByPath(`/learn/${slug}`);
  if (!entry) notFound();
  return (
    <>
      <SeoJsonLd data={breadcrumbJsonLd(entry)} />
      <LearnView slug={slug} />
    </>
  );
}
