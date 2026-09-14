import { getManifest } from "@gamesweb/game-sdk";
import { notFound } from "next/navigation";
import { GameHub } from "@/components/game/GameHub";

export default async function GameHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getManifest(slug);
  if (!game) notFound();
  return <GameHub game={game} />;
}
