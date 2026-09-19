"use client";

import { dailyQuests, GAME_MANIFESTS, getManifest, recommend } from "@gamesweb/game-sdk";
import {
  ChallengeWidget,
  EmptyState,
  FriendPresence,
  GameTile,
  PlatformHero,
  RecordWidget,
  SectionHeader,
} from "@/components/platform";
import { PlayButton as PlayCta } from "@/components/game/GameCard";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { challengeViewModel, gameRecordFor } from "@/lib/platform/adapters";
import { formatPlayScore } from "@/lib/platform/format";
import { defaultBoardMode, isCompactCatalog, lowerIsBetter } from "@/lib/platform/modes";

export default function PlayIndex() {
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
  const compact = isCompactCatalog(GAME_MANIFESTS.length);
  const quests = dailyQuests(player.dayKey);
  const friendsNow = player.friends.filter((f) => f.status === "accepted" && f.presence !== "offline");
  const pb = store.personalBest(featured.id, defaultBoardMode(featured.id), lowerIsBetter(featured.id));

  return (
    <div>
      <PlatformHero
        slug={featured.slug}
        kicker="Featured"
        title={featured.title}
        tagline={featured.tagline}
        metrics={[formatPlayScore(featured.id, pb), featured.sessionHint].filter(Boolean).join(" · ")}
        actions={<PlayCta href={`/play/${featured.slug}`} />}
        minHeight="play"
      />
      <div className="px-5 py-8 md:px-10">
        {continueG.length ? (
          <section className="mt-2">
            <SectionHeader title="Continue" />
            <div className="mt-3 flex flex-col gap-2">
              {continueG.map((g) => (
                <GameTile
                  key={g.id}
                  game={g}
                  variant="wide"
                  href={`/play/${g.slug}`}
                  pb={store.personalBest(g.id, defaultBoardMode(g.id), lowerIsBetter(g.id))}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10" data-testid="play-three-ways">
          <SectionHeader title="All eight games" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GAME_MANIFESTS.map((g) => (
              <GameTile
                key={g.id}
                game={g}
                href={`/play/${g.slug}`}
                pb={store.personalBest(g.id, defaultBoardMode(g.id), lowerIsBetter(g.id))}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <SectionHeader title="Daily challenge" />
          <div className="mt-2 divide-y divide-[var(--line)] md:grid md:grid-cols-3 md:divide-x md:divide-y-0 md:divide-[var(--line)]">
            {quests.map((q) => (
              <div key={q.id} className="md:px-4 md:first:pl-0 md:last:pr-0">
                <ChallengeWidget view={challengeViewModel(player, q)} variant="compact" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <SectionHeader title="Friends activity" />
          {friendsNow.length ? (
            <div className="mt-2 divide-y divide-[var(--line)]">
              {friendsNow.map((f) => (
                <FriendPresence key={f.id} friend={f} compact />
              ))}
            </div>
          ) : (
            <EmptyState title="Nobody on the floor yet" body="Invite a rival when you want company." />
          )}
        </section>

        <section className="mt-10">
          <SectionHeader title="Recent records" />
          {GAME_MANIFESTS.some((g) => {
            const rec = gameRecordFor(player, g.id);
            return Number.isFinite(rec.score) && rec.score > 0 && rec.score < 1e12;
          }) ? (
            <div className="mt-4 space-y-5">
              {GAME_MANIFESTS.map((g) => {
                const rec = gameRecordFor(player, g.id);
                if (!Number.isFinite(rec.score) || rec.score <= 0 || rec.score >= 1e12) return null;
                return <RecordWidget key={g.id} game={g} score={rec.score} modeLabel={rec.mode} />;
              })}
            </div>
          ) : (
            <EmptyState title="No records yet" body="Finish a run to pin a personal best here." />
          )}
        </section>

        {!compact ? (
          <>
            <section className="mt-10">
              <SectionHeader title="For you" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rec.map((id) => {
                  const g = getManifest(id);
                  return g ? <GameTile key={g.id} game={g} /> : null;
                })}
              </div>
            </section>
            <section className="mt-10">
              <SectionHeader title="All games" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {GAME_MANIFESTS.map((g) => (
                  <GameTile key={g.id} game={g} />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
