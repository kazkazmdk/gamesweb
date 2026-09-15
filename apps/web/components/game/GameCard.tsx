"use client";

import type { GameManifest } from "@gamesweb/game-sdk";
import { GameTile } from "@/components/platform/GameTile";
import { QuickAction } from "@/components/platform/QuickAction";

export function GameCard({ game, kicker }: { game: GameManifest; kicker?: string }) {
  return <GameTile game={game} variant="compact" kicker={kicker} />;
}

export function PlayButton({ href, children = "Play now" }: { href: string; children?: string }) {
  return <QuickAction href={href}>{children}</QuickAction>;
}
