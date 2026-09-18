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
  const chain = dailies
    .map((e) => getManifest(e.gameId)?.title.split(" ")[0])
    .filter(Boolean)
    .join("  →  ");

  return (
    <section className="relative px-5 pb-14 md:px-10" aria-label="Today in the arcade">
      <p className="meta text-white/40">Today in the arcade</p>
      <div className="home-event-board mt-4 grid gap-px md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <Link
          href="/daily"
          className="group relative min-h-[220px] overflow-hidden p-5 md:min-h-[300px] md:p-7"
          onClick={() => analytics.track("home_event_opened", { href: "/daily" })}
        >
          <DailyArt dailies={dailies} />
          <span className="home-event-index" aria-hidden>
            01
          </span>
          <div className="relative flex h-full min-h-[188px] flex-col justify-end">
            <p className="meta text-white/55">Daily arcade</p>
            <p className="display mt-2 text-[40px] text-white md:text-[58px]">
              {remaining > 0 ? `${String(remaining).padStart(2, "0")} live` : "Cleared"}
            </p>
            <p className="mt-4 text-[13px] tracking-[0.04em] text-white/74 md:text-[15px]">{chain}</p>
            {countdown ? <p className="metric mt-4 text-[26px] text-white/90 md:text-[32px]">{countdown}</p> : null}
            <p className="home-secondary mt-5">Enter ›</p>
          </div>
        </Link>
        <Link
          href="/grand-prix"
          className="relative overflow-hidden bg-black/28 p-5 md:p-7"
          onClick={() => analytics.track("home_event_opened", { href: "/grand-prix" })}
        >
          <span className="home-event-index" aria-hidden>
            02
          </span>
          <p className="meta text-white/55">Grand Prix</p>
          <p className="display mt-3 text-[28px] text-white md:text-[36px]">Cup route</p>
          <ol className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-4">
            {GRAND_PRIX_PLAYLIST.map((round, i) => {
              const g = getManifest(round.gameId);
              if (!g) return null;
              const last = i === GRAND_PRIX_PLAYLIST.length - 1;
              const dir = homeStage(g.slug);
              return (
                <li key={`${round.gameId}-${i}`} className="flex items-end gap-2">
                  <span className="block">
                    <span className="meta mb-1.5 block text-white/40">{last ? "Final" : `R${i + 1}`}</span>
                    <span className="relative block h-14 w-[4.6rem] overflow-hidden md:h-16 md:w-20">
                      <GameArt slug={g.slug} variant="tile" position={dir.tile} className="h-full w-full" />
                      <span className="home-select-ticks pointer-events-none absolute inset-0" aria-hidden />
                    </span>
                    <span className="mt-1.5 block text-[11px] leading-tight text-white/80">
                      {g.title.split(" ")[0]}
                    </span>
                  </span>
                  {!last ? <span className="mb-6 text-white/35">→</span> : null}
                </li>
              );
            })}
          </ol>
          <div className="home-progress mt-7" aria-hidden>
            {GRAND_PRIX_PLAYLIST.map((_, i) => (
              <span key={i} className={gpPoints > 0 && i === 0 ? "on" : ""} />
            ))}
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="meta text-white/40">You</p>
              <p className="metric mt-1 text-[28px] text-white">{gpPoints > 0 ? `${gpPoints}` : "0"}</p>
              <p className="mt-1 text-[11px] text-white/45">{gpPoints > 0 ? "pts" : "no run"}</p>
            </div>
            <p className="home-secondary">{gpPoints > 0 ? "Standings ›" : "Enter cup ›"}</p>
          </div>
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
            left: `${i * 28}%`,
            width: "52%",
            opacity: 0.5 - i * 0.1,
          }}
        >
          <GameArt slug={slug} variant="tile" position={homeStage(slug).tile} className="h-full w-full" />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/28 to-black/10" />
    </div>
  );
}
