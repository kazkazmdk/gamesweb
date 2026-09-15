"use client";

import { dailyQuests, GAME_MANIFESTS, getManifest, recommend } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import { useMemo } from "react";
import { PlayButton } from "@/components/game/GameCard";
import {
  ActivityFeed,
  ChallengeWidget,
  EmptyState,
  FriendPresence,
  GameTile,
  InviteWidget,
  PlatformHero,
  QuickAction,
  SectionHeader,
} from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import {
  activityFromHistory,
  challengeViewModel,
  dailySummary,
  lastPbEvent,
} from "@/lib/platform/adapters";
import { formatLevel, formatPlayScore, greeting } from "@/lib/platform/format";
import { defaultBoardMode, lowerIsBetter } from "@/lib/platform/modes";

export default function HomePage() {
  const player = usePlayer();
  const store = useStore();
  const lv = levelFromXp(player.xp);
  const returning = player.history.length > 0;
  const quests = dailyQuests(player.dayKey);
  const dailies = dailySummary(player);
  const rec = useMemo(
    () =>
      recommend({
        history: player.history.map((h) => ({ gameId: h.gameId, durationMs: h.durationMs, at: h.at })),
        playedIds: store.playedIds(),
        challengeGameIds: quests.map((q) => q.gameId).filter((id): id is string => Boolean(id)),
        friendsPlaying: player.friends.filter((f) => f.presence === "playing").map((f) => f.gameId ?? ""),
      }),
    [player, quests, store],
  );
  const hero = getManifest(rec[0]) ?? GAME_MANIFESTS[0];
  useAccent(hero.accent);
  const pb = store.personalBest(hero.id, defaultBoardMode(hero.id), lowerIsBetter(hero.id));
  const pbLabel = formatPlayScore(hero.id, pb);
  const continueGames = store.continuePlaying().slice(0, 4);
  const forYou = rec.map((id) => getManifest(id)!).filter(Boolean);
  const friendsNow = player.friends.filter((f) => f.status === "accepted" && f.presence !== "offline");
  const lastPb = lastPbEvent(player.history);
  const lastPbGame = lastPb ? getManifest(lastPb.gameId) : null;
  const activity = activityFromHistory(player.history, 4);

  const contextBits = returning
    ? [
        formatLevel(lv.level),
        player.streak > 0 ? `${player.streak} day streak` : null,
        `${dailies.done}/${dailies.total} dailies`,
        lastPb && lastPbGame ? `Last PB: ${lastPbGame.title} ${formatPlayScore(lastPb.gameId, lastPb.score)}` : null,
      ].filter(Boolean)
    : [];

  return (
    <div>
      <PlatformHero
        slug={hero.slug}
        kicker={returning ? "Continue" : "Instant play"}
        title={hero.title}
        tagline={hero.tagline}
        context={
          returning ? (
            <p className="mt-2 text-[14px] text-white/70">
              {greeting()}, {player.displayName}
              {contextBits.length ? ` · ${contextBits.slice(0, 2).join(" · ")}` : ""}
            </p>
          ) : null
        }
        metrics={[pbLabel ? pbLabel : null, hero.sessionHint, contextBits[2], contextBits[3]].filter(Boolean).join(" · ")}
        actions={
          <>
            <PlayButton href={`/play/${hero.slug}`} />
            <InviteWidget slug={hero.slug} compact />
          </>
        }
      />

      <div className="space-y-12 px-5 py-10 md:px-10">
        <section>
          <SectionHeader title="Continue playing" />
          {continueGames.length ? (
            <div className="mt-4 flex flex-col gap-2">
              {continueGames.map((g) => {
                const best = store.personalBest(g.id, defaultBoardMode(g.id), lowerIsBetter(g.id));
                return (
                  <GameTile
                    key={g.id}
                    game={g}
                    variant="wide"
                    href={`/play/${g.slug}`}
                    kicker="Resume"
                    pb={best}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState title="Pick your first game." action={<QuickAction href="/play">Browse</QuickAction>} />
          )}
        </section>

        <section>
          <SectionHeader title="Daily challenges" meta={`${dailies.done}/${dailies.total}`} />
          <div className="mt-2 divide-y divide-[var(--line)]">
            {quests.map((q) => (
              <ChallengeWidget key={q.id} view={challengeViewModel(player, q)} variant="compact" />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Friends playing" action={<QuickAction href="/friends" tone="quiet">All</QuickAction>} />
          {friendsNow.length ? (
            <div className="mt-2 divide-y divide-[var(--line)]">
              {friendsNow.map((f) => (
                <FriendPresence key={f.id} friend={f} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No friends online"
              body="Games are better with rivals."
              action={<QuickAction href="/friends">Invite</QuickAction>}
            />
          )}
        </section>

        <section>
          <SectionHeader title="For you" />
          <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-none">
            {forYou.map((g) => (
              <div key={g.id} className="w-[240px] shrink-0">
                <GameTile game={g} />
              </div>
            ))}
          </div>
        </section>

        {activity.length ? (
          <section>
            <SectionHeader title="Recent" />
            <div className="mt-2">
              <ActivityFeed items={activity} />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
