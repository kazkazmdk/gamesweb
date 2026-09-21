import { getManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { NOINDEX_FOLLOW } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getManifest(slug);
  const title = game ? `Play ${game.title}` : "Play";
  return {
    title,
    description: game?.description,
    alternates: { canonical: game ? `/games/${game.slug}` : undefined },
    ...NOINDEX_FOLLOW,
    openGraph: game
      ? {
          title,
          description: game.description,
          url: `/games/${game.slug}`,
          images: [{ url: game.hero, alt: game.title }],
        }
      : undefined,
    twitter: game
      ? {
          card: "summary_large_image",
          title,
          description: game.description,
          images: [game.hero],
        }
      : undefined,
  };
}

export default function PlayGameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
