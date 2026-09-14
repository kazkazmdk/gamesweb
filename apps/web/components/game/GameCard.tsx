"use client";

import type { GameManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";

export function GameCard({ game, kicker }: { game: GameManifest; kicker?: string }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group relative block min-w-[220px] overflow-hidden rounded-2xl"
      style={{ aspectRatio: "16 / 10" }}
    >
      <GameArt slug={game.slug} className="h-full w-full object-cover transition-transform duration-[var(--motion-large)] group-hover:scale-[1.03]" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span className="absolute bottom-3 left-3 right-3">
        {kicker ? <span className="block text-[10px] uppercase tracking-[0.16em] text-white/60">{kicker}</span> : null}
        <span className="display block text-[22px]">{game.title}</span>
      </span>
    </Link>
  );
}

export function PlayButton({ href, children = "Play now" }: { href: string; children?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center rounded-full bg-[var(--accent)] px-7 text-[14px] font-semibold text-[#140d12]"
    >
      {children}
    </Link>
  );
}
