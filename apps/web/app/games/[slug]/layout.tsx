import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getManifest(slug);
  if (!game) return { title: "Game" };
  return {
    title: game.title,
    description: game.description,
    openGraph: { title: `${game.title} · ${brand.productName}`, description: game.description },
    alternates: { canonical: `/games/${game.slug}` },
  };
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
