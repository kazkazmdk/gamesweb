import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GameHub } from "@/components/game/GameHub";
import { breadcrumbJsonLd, gameSeoTitle, INDEX, metadataFromPage, videoGameJsonLd } from "@/lib/seo";
import { requestOrigin } from "@/lib/origin";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getManifest(slug);
  if (!game) return { title: "Game" };
  const title = `${gameSeoTitle(game.title, game.genre)} | ${brand.productName}`;
  return {
    ...metadataFromPage({
      title,
      description: game.description,
      path: `/games/${game.slug}`,
      image: game.hero,
    }),
    ...INDEX,
  };
}

export default async function GameHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getManifest(slug);
  if (!game) notFound();
  const origin = await requestOrigin();
  const jsonLd = videoGameJsonLd({ ...game, origin });
  const crumbs = breadcrumbJsonLd(origin, [
    { name: "Home", path: "/" },
    { name: "Games", path: "/games" },
    { name: game.title, path: `/games/${game.slug}` },
  ]);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <GameHub game={game} />
    </>
  );
}
