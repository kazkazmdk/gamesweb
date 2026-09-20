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
        <EmptyStateStage
          kicker="Crew"
          title="Opening the house"
          body="A crew forms when you play. The feed stays empty until a real personal best lands — nothing is invented."
          slug="territory-rush"
        />
      </div>
    );
  }

  const emblem = crew.tag.slice(0, 3).toUpperCase();

  return (
    <div className="pb-16" data-testid="crew">
      <GameBackdrop slug="territory-rush" className="min-h-[52vh]" dim={0.3} priority>
        <div className="flex min-h-[52vh] flex-col justify-end px-5 pb-10 pt-20 md:px-10">
          <p className="meta text-white/45">Crew</p>
          <div className="mt-5 flex flex-wrap items-end gap-6">
            <span
              className="gw-avatar grid h-24 w-24 place-items-center bg-[color-mix(in_srgb,var(--accent)_22%,#141416)] text-[22px] tracking-[0.18em] text-white"
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
        <p className="meta text-white/40">This week</p>
        <p className="mt-3 text-[22px] text-white">{crew.weekly.goal}</p>
        <div className="mt-4 max-w-md">
          <ProgressWidget value={crew.weekly.progress} max={crew.weekly.target} caption={`${crew.weekly.progress}/${crew.weekly.target} runs`} />
        </div>
      </section>

      <section className="mt-10 px-5 md:px-10">
        <p className="meta text-white/40">House</p>
        <ul className="mt-4 flex flex-wrap gap-4">
          {crew.members.map((name) => (
            <li key={name} className="flex items-center gap-3">
              <span className="gw-avatar grid h-11 w-11 place-items-center bg-white/10 text-[11px] tracking-[0.14em]" aria-hidden>
                {name.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-[15px] text-white/80">{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 px-5 md:px-10">
        {crew.feed.length ? (
          <>
            <p className="meta text-white/40">House feed</p>
            <ul className="mt-4 max-w-xl space-y-3 text-white/70">
              {crew.feed.map((f) => (
                <li key={f.id}>{f.text}</li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyStateStage
            heading="p"
            slug="territory-rush"
            kicker="House feed"
            title="Quiet house"
            body="A personal best shows up here. No invented activity."
          />
        )}
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
