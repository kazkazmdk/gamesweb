"use client";

import { GAME_MANIFESTS, recommend } from "@gamesweb/game-sdk";
import { GameCard } from "@/components/game/GameCard";
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
  const continueG = store.continuePlaying();

  return (
    <div className="px-5 py-6 md:px-10">
      <h1 className="display text-[40px] md:text-[56px]">Play</h1>
      <p className="mt-2 max-w-xl text-[15px] text-[var(--text-dim)]">From catalogue to canvas in one click.</p>

      <Section title="Featured">
        <div className="max-w-3xl">
          <GameCard game={featured} kicker="Start here" />
        </div>
      </Section>
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
        <Grid games={[...GAME_MANIFESTS].sort((a, b) => a.title.localeCompare(b.title))} />
      </Section>
      <Section title="Quick sessions">
        <Grid games={[...GAME_MANIFESTS].sort((a, b) => a.sessionHint.localeCompare(b.sessionHint))} />
      </Section>
      <Section title="All games">
        <Grid games={GAME_MANIFESTS} />
      </Section>
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
