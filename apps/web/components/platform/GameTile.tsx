"use client";

import type { GameManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";
import { formatPlayScore } from "@/lib/platform/format";
import { QuickAction } from "./QuickAction";

export function GameTile({
  game,
  variant = "compact",
  href,
  kicker,
  pb,
  friendsPlaying,
  daily,
  cta,
}: {
  game: GameManifest;
  variant?: "hero" | "wide" | "compact";
  href?: string;
  kicker?: string;
  pb?: number;
  friendsPlaying?: number;
  daily?: string;
  cta?: string;
}) {
  const dest = href ?? `/games/${game.slug}`;
  const score = pb !== undefined ? formatPlayScore(game.id, pb) : null;
  const meta = [game.genre, game.sessionHint, score, friendsPlaying ? `${friendsPlaying} playing` : null, daily]
    .filter(Boolean)
    .join(" · ");

  if (variant === "hero") {
    return (
      <article className="relative min-h-[42vh] overflow-hidden md:min-h-[48vh]">
        <GameArt slug={game.slug} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_45%,transparent)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        <div className="relative flex min-h-[42vh] flex-col justify-end px-5 pb-8 md:min-h-[48vh] md:px-10">
          {kicker ? <p className="meta text-white/50">{kicker}</p> : null}
          <h2 className="display mt-2 text-[48px] md:text-[72px]">{game.title}</h2>
          <p className="mt-2 max-w-lg text-[15px] text-white/70">{game.tagline}</p>
          <p className="mt-3 text-[13px] text-white/50">{meta}</p>
          <div className="mt-5">
            <QuickAction href={`/play/${game.slug}`}>{cta ?? "Play"}</QuickAction>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "wide") {
    return (
      <Link
        href={dest}
        className="group grid min-h-[92px] grid-cols-[112px_1fr] overflow-hidden md:min-h-[108px] md:grid-cols-[160px_1fr]"
      >
        <div className="relative overflow-hidden">
          <GameArt slug={game.slug} className="h-full w-full object-cover transition-transform duration-[var(--motion-large)] group-hover:scale-[1.04]" />
        </div>
        <div className="flex flex-col justify-center px-4 py-3">
          {kicker ? <p className="meta">{kicker}</p> : null}
          <p className="display text-[22px] md:text-[26px]">{game.title}</p>
          <p className="mt-1 text-[12px] text-[var(--text-dim)]">{meta}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={dest} className="group relative block overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
      <GameArt
        slug={game.slug}
        className="h-full w-full object-cover transition-transform duration-[var(--motion-large)] group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span className="absolute bottom-3 left-3 right-3">
        {kicker ? <span className="meta block text-white/60">{kicker}</span> : null}
        <span className="display block text-[22px]">{game.title}</span>
        <span className="mt-1 block text-[11px] text-white/55">{score ?? game.sessionHint}</span>
      </span>
    </Link>
  );
}
