import { getManifest, GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GameHub } from "@/components/game/GameHub";
import { GameEditorial } from "@/components/seo/GameEditorial";
import { entryMetadata } from "@/lib/seo";
import { entryByPath } from "@/lib/seo-content/registry";
import { breadcrumbJsonLd, videoGameJsonLd } from "@/lib/seo-content/schema";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = entryByPath(`/games/${slug}`);
  if (!entry) return { title: "Game" };
  return entryMetadata(entry);
}

export default async function GameHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getManifest(slug);
  const entry = entryByPath(`/games/${slug}`);
  if (!game || !entry) notFound();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const jsonLd = [videoGameJsonLd(game), breadcrumbJsonLd(entry)];
  return (
    <>
      {jsonLd.map((data, i) => (
        <script key={i} nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <GameHub game={game} />
      <GameEditorial gameId={game.id} />
    </>
  );
}
