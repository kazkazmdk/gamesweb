import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GameHub } from "@/components/game/GameHub";
import { gameSeoTitle, INDEX, videoGameJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getManifest(slug);
  if (!game) return { title: "Game" };
  const title = gameSeoTitle(game.title, game.genre);
  const url = `/games/${game.slug}`;
  const image = game.hero;
  return {
    title: { absolute: `${title} | ${brand.productName}` },
    description: game.description,
    alternates: { canonical: url },
    ...INDEX,
    openGraph: {
      title: `${title} | ${brand.productName}`,
      description: game.description,
      url,
      images: [{ url: image, alt: game.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.productName}`,
      description: game.description,
      images: [image],
    },
  };
}

export default async function GameHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getManifest(slug);
  if (!game) notFound();
  const jsonLd = videoGameJsonLd(game);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GameHub game={game} />
    </>
  );
}
