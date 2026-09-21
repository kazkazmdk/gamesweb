import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameHub } from "@/components/game/GameHub";
import { GameHubEditorial } from "@/components/game/GameHubEditorial";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoLandingView } from "@/components/seo/SeoAnalytics";
import { editorialFor, seoPageByPath } from "@/content";
import { breadcrumbJsonLd, metadataForPath, videoGameJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return metadataForPath(`/games/${slug}`);
}

export default async function GameHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getManifest(slug);
  const page = seoPageByPath(`/games/${slug}`);
  if (!game || !page) notFound();
  const ed = editorialFor(slug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Games", path: "/games" },
    { name: game.title, path: page.path },
  ];
  return (
    <>
      <JsonLd
        data={[
          videoGameJsonLd({
            title: game.title,
            description: ed.hubDescription,
            genre: game.genre,
            slug: game.slug,
            hero: game.hero,
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <SeoLandingView path={page.path} kind="hub" />
      <GameHub game={game} />
      <GameHubEditorial slug={game.slug} />
    </>
  );
}
