import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GameHub } from "@/components/game/GameHub";
import { GamePublicEditorial, GamePublicHero } from "@/components/game/GamePublicContent";
import { buildGameEditorial } from "@/lib/content/games";
import { entityMetadata } from "@/lib/content/metadata";
import { breadcrumbJsonLd, videoGameJsonLd } from "@/lib/content/schema";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!getManifest(slug)) return { title: "Game" };
  return entityMetadata(buildGameEditorial(slug).entity);
}

export default async function GameHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getManifest(slug);
  if (!game) notFound();
  const editorial = buildGameEditorial(slug);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameJsonLd(game, editorial.entity.image)) }}
      />
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(editorial.entity.breadcrumbs)) }}
      />
      <GamePublicHero editorial={editorial} />
      <GameHub game={game} />
      <GamePublicEditorial editorial={editorial} />
    </>
  );
}
