"use client";

import { GAME_MANIFESTS, recommend } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";
import { GameCard, PlayButton } from "@/components/game/GameCard";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";

export default function PlayPage() {
  const player = usePlayer();
  const store = useStore();
  const rec = recommend({
    history: player.history.map((h) => ({ gameId: h.gameId, durationMs: h.durationMs, at: h.at })),
    playedIds: store.playedIds(),
    challengeGameIds: [],
    friendsPlaying: [],
  });
  const featured = GAME_MANIFESTS.find((g) => g.id === rec[0]) ?? GAME_MANIFESTS[0];
  useAccent(featured.accent);
  const continueG = store.continuePlaying();

  return (
    <div>
      <section className="relative min-h-[58vh] overflow-hidden">
        <GameArt slug={featured.slug} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_40%,transparent)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        <div className="relative flex min-h-[58vh] flex-col justify-end px-5 pb-10 md:px-10">
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/50">Featured</p>
          <h1 className="display mt-3 text-[56px] md:text-[80px]">{featured.title}</h1>
          <p className="mt-2 max-w-lg text-[16px] text-white/70">{featured.tagline}</p>
          <div className="mt-6">
            <PlayButton href={`/play/${featured.slug}`} />
          </div>
        </div>
      </section>
      <div className="px-5 py-8 md:px-10">
        <Section title="Continue">
          {continueG.length ? (
            <Grid games={continueG} />
          ) : (
            <p className="text-[14px] text-[var(--text-dim)]">Pick your first game.</p>
          )}
        </Section>
        <Section title="For you">
          <Grid games={rec.map((id) => GAME_MANIFESTS.find((g) => g.id === id)!)} />
        </Section>
        <Section title="Competitive">
          <Grid games={[...GAME_MANIFESTS]} />
        </Section>
        <Section title="Quick sessions">
          <Grid games={[...GAME_MANIFESTS].sort((a, b) => a.sessionHint.localeCompare(b.sessionHint))} />
        </Section>
        <Section title="All games">
          <Grid games={GAME_MANIFESTS} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ games }: { games: typeof GAME_MANIFESTS }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((g) => (
        <GameCard key={g.id} game={g} />
      ))}
    </div>
  );
}
