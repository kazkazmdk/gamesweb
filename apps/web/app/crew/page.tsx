"use client";

import { CREW_REACTIONS } from "@gamesweb/game-sdk";
import { arcadeStore } from "@/lib/social/arcade-store";
import { useArcade } from "@/lib/social/use-arcade";
import { usePlayer } from "@/lib/player";
import { useAccent } from "@/components/shell/AppShell";
import { EmptyStateStage, GameBackdrop, ProgressionStrip } from "@/components/visual";
import { ProgressWidget } from "@/components/platform";
import { useEffect, useState } from "react";

export default function CrewPage() {
  useAccent();
  const player = usePlayer();
  const crew = useArcade().crew;
  const [react, setReact] = useState("");
  useEffect(() => {
    if (!crew) arcadeStore.ensureCrew(player.displayName || "Player");
  }, [crew, player.displayName]);

  if (!crew) {
    return (
      <div data-testid="crew">
        <EmptyStateStage title="Opening the house" slug="territory-rush" />
      </div>
    );
  }

  const emblem = crew.tag.slice(0, 3).toUpperCase();

  return (
    <div className="pb-16" data-testid="crew">
      <GameBackdrop slug="territory-rush" className="min-h-[52vh]" dim={0.3} priority>
        <div className="flex min-h-[52vh] flex-col justify-end px-5 pb-10 pt-20 md:px-10">
          <div className="mt-5 flex flex-wrap items-end gap-6">
            <span
              className="gw-avatar grid h-28 w-28 place-items-center bg-[color-mix(in_srgb,var(--accent)_26%,#141416)] text-[26px] tracking-[0.18em] text-white md:h-32 md:w-32"
              aria-hidden
            >
              {emblem}
            </span>
            <div>
              <h1 className="display text-[48px] text-white md:text-[72px]">{crew.name}</h1>
              <p className="mt-2 text-[14px] text-white/60">
                {crew.tag} · {crew.members.length}/30
              </p>
            </div>
          </div>
          <div className="mt-8 max-w-xl">
            <ProgressionStrip
              level={crew.level}
              into={crew.xp % 120}
              needed={120}
              next="Crew XP"
              trophies={`${crew.members.length}`}
            />
          </div>
        </div>
      </GameBackdrop>

      <section className="px-5 md:px-10">
        <p className="text-[22px] text-white">{crew.weekly.goal}</p>
        <div className="mt-4 max-w-md">
          <ProgressWidget value={crew.weekly.progress} max={crew.weekly.target} caption="runs this week" />
        </div>
      </section>

      <section className="mt-8 px-5 md:px-10">
        <div className="flex flex-wrap gap-2">
          {crew.members.map((m) => (
            <span key={m} className="gw-chip text-[12px]">
              {m}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8 px-5 md:px-10">
        <div className="gw-activity-arena max-w-xl">
          {crew.feed.length ? (
            <ul className="space-y-3 text-white/70">
              {crew.feed.map((f) => (
                <li key={f.id}>{f.text}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-white/55">No crew activity yet</p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {CREW_REACTIONS.map((r) => (
            <button key={r} type="button" className="gw-cta-ghost min-h-10 px-3" onClick={() => setReact(r)}>
              {r}
            </button>
          ))}
        </div>
        {react ? <p className="mt-2 text-white/45">{react}</p> : null}
      </section>
    </div>
  );
}
