"use client";

import { getManifest, GRAND_PRIX_PLAYLIST } from "@gamesweb/game-sdk";
import { useArcade } from "@/lib/social/use-arcade";
import Link from "next/link";

export default function GrandPrixPage() {
  const gp = useArcade().grandPrix;
  return (
    <div className="mx-auto max-w-2xl px-5 py-10" data-testid="grand-prix">
      <p className="meta text-white/45">Arcade Grand Prix</p>
      <h1 className="display mt-2 text-4xl">Five games. Same conditions.</h1>
      <p className="mt-3 text-white/60">Async. Points stack. {gp.points} pts so far.</p>
      <ol className="mt-8 space-y-3">
        {GRAND_PRIX_PLAYLIST.map((round, i) => {
          const game = getManifest(round.gameId);
          return (
            <li key={round.gameId} className="rounded-2xl border border-white/10 p-4">
              <p className="text-[13px] text-white/45">Round {i + 1}</p>
              <p className="text-xl">{game?.title}</p>
              <Link href={`/play/${round.gameId}?gp=${gp.id ?? "daily"}&seed=gp-${i}`} className="mt-2 inline-block text-[var(--accent)]">
                Race
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
