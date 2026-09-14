import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { GameView } from "@/components/game/GameView";

export function generateStaticParams() {
  return GAME_MANIFESTS.map((g) => ({ slug: g.slug }));
}

export default async function PlayGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GameView slug={slug} />;
}
