import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getManifest(slug);
  return {
    title: game ? `Play ${game.title}` : "Play",
    description: game?.description,
    ...NOINDEX_FOLLOW,
    alternates: { canonical: game ? `/games/${game.slug}` : undefined },
  };
}

export default function PlayGameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
