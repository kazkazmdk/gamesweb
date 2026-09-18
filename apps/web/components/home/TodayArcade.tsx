"use client";

import Link from "next/link";
import { getManifest, GRAND_PRIX_PLAYLIST, type DailyEvent } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";
import { formatCountdown, msUntilUtcMidnight } from "@/lib/platform/format";

export function TodayArcade({
  dailies,
  remaining,
  gpPoints,
}: {
  dailies: DailyEvent[];
  remaining: number;
  gpPoints: number;
}) {
  const countdown = formatCountdown(msUntilUtcMidnight());
  return (
    <section className="relative px-5 pb-14 md:px-10" aria-label="Today in the arcade">
      <p className="meta text-white/45">Today</p>
      <div className="mt-4 overflow-hidden bg-black/35">
        <div className="grid gap-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Link
            href="/daily"
            className="group relative min-h-[200px] overflow-hidden p-5 md:min-h-[240px] md:p-7"
          >
            <DailyArt dailies={dailies} />
            <div className="relative flex h-full min-h-[168px] flex-col justify-end">
              <p className="meta text-white/60">Daily arcade</p>
              <p className="display mt-2 text-[34px] text-white md:text-[48px]">
                {remaining > 0 ? `${remaining} live` : "Cleared"}
              </p>
              <p className="mt-2 text-[13px] text-white/70">
                {dailies.map((e) => getManifest(e.gameId)?.title.split(" ")[0]).filter(Boolean).join(" · ")}
                {countdown ? ` · ${countdown}` : ""}
              </p>
            </div>
          </Link>
          <Link href="/grand-prix" className="relative border-t border-white/8 p-5 md:border-l md:border-t-0 md:p-7">
            <p className="meta text-white/60">Grand Prix</p>
            <p className="display mt-2 text-[28px] text-white md:text-[36px]">Four-game cup</p>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-white/75">
              {GRAND_PRIX_PLAYLIST.map((round, i) => {
                const g = getManifest(round.gameId);
                return (
                  <span key={`${round.gameId}-${i}`} className="inline-flex items-center gap-2">
                    {i ? <span className="text-white/30">→</span> : null}
                    <span>{g?.title.split(" ")[0] ?? round.gameId}</span>
                  </span>
                );
              })}
            </p>
            <p className="mt-4 text-[13px] text-white/55">{gpPoints > 0 ? `${gpPoints} pts` : "Enter"}</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

function DailyArt({ dailies }: { dailies: DailyEvent[] }) {
  const slugs = dailies
    .map((e) => getManifest(e.gameId)?.slug)
    .filter((s): s is string => Boolean(s))
    .slice(0, 3);
  if (!slugs.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {slugs.map((slug, i) => (
        <div
          key={slug}
          className="absolute inset-y-0 overflow-hidden"
          style={{
            left: `${i * 28}%`,
            width: "52%",
            opacity: 0.34 - i * 0.08,
          }}
        >
          <GameArt slug={slug} variant="tile" className="h-full w-full" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
    </div>
  );
}
