"use client";

import Link from "next/link";
import { getManifest, GRAND_PRIX_PLAYLIST, type DailyEvent } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import { GameArt } from "@/components/game/GameArt";
import { formatCountdown, msUntilUtcMidnight } from "@/lib/platform/format";
import { homeStage } from "./home-stage";

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
      <p className="meta text-white/40">Today in the arcade</p>
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <Link
          href="/daily"
          className="group relative min-h-[220px] overflow-hidden p-5 md:min-h-[280px] md:p-7"
          onClick={() => analytics.track("home_event_opened", { href: "/daily" })}
        >
          <DailyArt dailies={dailies} />
          <div className="relative flex h-full min-h-[188px] flex-col justify-end">
            <p className="meta text-white/55">Daily</p>
            <p className="display mt-2 text-[40px] text-white md:text-[56px]">
              {remaining > 0 ? `${remaining} live` : "Cleared"}
            </p>
            <p className="mt-3 text-[14px] text-white/72">
              {dailies.map((e) => getManifest(e.gameId)?.title.split(" ")[0]).filter(Boolean).join(" → ")}
            </p>
            {countdown ? <p className="metric mt-3 text-[22px] text-white/88">{countdown}</p> : null}
          </div>
        </Link>
        <Link
          href="/grand-prix"
          className="relative overflow-hidden bg-black/30 p-5 md:p-7"
          onClick={() => analytics.track("home_event_opened", { href: "/grand-prix" })}
        >
          <p className="meta text-white/55">Grand Prix</p>
          <p className="display mt-3 text-[32px] text-white md:text-[40px]">Four-game cup</p>
          <ol className="mt-6 space-y-3">
            {GRAND_PRIX_PLAYLIST.map((round, i) => {
              const g = getManifest(round.gameId);
              if (!g) return null;
              const dir = homeStage(g.slug);
              return (
                <li key={`${round.gameId}-${i}`} className="flex items-center gap-3">
                  <span className="relative h-10 w-14 overflow-hidden">
                    <GameArt slug={g.slug} variant="tile" position={dir.tile} className="h-full w-full" />
                  </span>
                  <span className="text-[14px] text-white">{g.title.split(" ")[0]}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-[13px] text-white/60">{gpPoints > 0 ? `${gpPoints} pts` : "Enter"}</p>
        </Link>
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
            left: `${i * 26}%`,
            width: "56%",
            opacity: 0.42 - i * 0.08,
          }}
        >
          <GameArt slug={slug} variant="tile" position={homeStage(slug).tile} className="h-full w-full" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/42 to-black/18" />
    </div>
  );
}
