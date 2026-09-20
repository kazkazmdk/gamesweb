import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticleView } from "@/components/seo/GuideViews";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { entryMetadata } from "@/lib/seo";
import { entriesByKind, entryByPath } from "@/lib/seo-content/registry";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo-content/schema";

export function generateStaticParams() {
  return entriesByKind("guide").map((g) => ({
    game: g.gameId ?? g.path.split("/")[2],
    article: g.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string; article: string }>;
}): Promise<Metadata> {
  const { game, article } = await params;
  const entry = entryByPath(`/guides/${game}/${article}`);
  if (!entry) return { title: "Guide" };
  return entryMetadata(entry);
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ game: string; article: string }>;
}) {
  const { game, article } = await params;
  const entry = entryByPath(`/guides/${game}/${article}`);
  if (!entry) notFound();
  return (
    <>
      <SeoJsonLd data={[breadcrumbJsonLd(entry), articleJsonLd(entry)]} />
      <GuideArticleView gameSlug={game} article={article} />
    </>
  );
}
