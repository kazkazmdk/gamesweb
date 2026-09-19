"use client";

import { GAME_MANIFESTS, GRAND_PRIX_PLAYLIST, dailyArcadeEvents, getManifest, utcDayKey } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import {
  AchievementStrip,
  ChallengeWidget,
  FriendPresence,
  RecordWidget,
  SectionHeader,
} from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { useArcade } from "@/lib/social/use-arcade";
import {
  achievementProgress,
  challengeViewModel,
  dailySummary,
  gameRecordFor,
  latestUnlocks,
} from "@/lib/platform/adapters";
import { formatPlayScore, hasRecord } from "@/lib/platform/format";
import { EventRoute, GameBackdrop, ProgressionStrip, useUtcCountdown } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";

export function ArcadeHub() {
  const player = usePlayer();
  const store = useStore();
  const arcade = useArcade();
  const lv = levelFromXp(player.xp);
  const dailies = dailySummary(player);
  const day = utcDayKey();
  const dailyEvents = dailyArcadeEvents(day);
  const dailyDone = arcade.daily.day === day ? arcade.daily.completed.length : 0;
  const dailyLeft = Math.max(0, dailyEvents.length - dailyDone);
  const friendsNow = player.friends.filter((f) => f.status === "accepted" && f.presence === "playing");
  const unlocks = latestUnlocks(player, 3);
  const ach = achievementProgress(player);
  const { label: countdown } = useUtcCountdown();
  const openChallenge = arcade.challenges.find((c) => c.status === "open" && c.challengerId !== player.id);
  const gpCurrent = GRAND_PRIX_PLAYLIST.find((_, i) => arcade.grandPrix.scores[i] == null) ?? GRAND_PRIX_PLAYLIST[0];
  const gpGame = getManifest(gpCurrent.gameId);
  const currentDaily = dailyEvents.find((e) => !arcade.daily.completed.includes(`${e.gameId}:${e.mode}`)) ?? dailyEvents[0];
  const currentDailyGame = currentDaily ? getManifest(currentDaily.gameId) : null;
  const last = player.history[0];
  const lastGame = last ? getManifest(last.gameId) : null;

  const hero = openChallenge
    ? {
        slug: getManifest(openChallenge.gameId)?.slug ?? "neon-drift",
        kicker: "Challenge waiting",
        title: `Beat ${openChallenge.challengerName}`,
        body: getManifest(openChallenge.gameId)?.title ?? openChallenge.gameId,
        href: `/c/${openChallenge.publicCode}`,
        cta: "Answer",
      }
    : dailyLeft > 0 && currentDailyGame
      ? {
          slug: currentDailyGame.slug,
          kicker: "Daily Arcade",
          title: currentDailyGame.title,
          body: `${dailyLeft} stage${dailyLeft === 1 ? "" : "s"} still live · ${countdown}`,
          href: `/daily`,
          cta: "Enter today",
        }
      : friendsNow[0]?.gameId
        ? {
            slug: getManifest(friendsNow[0].gameId)?.slug ?? "neon-drift",
            kicker: "Playing now",
            title: friendsNow[0].displayName,
            body: getManifest(friendsNow[0].gameId)?.title ?? "In the arcade",
            href: `/play/${getManifest(friendsNow[0].gameId)?.slug ?? ""}`,
            cta: "Play this game",
          }
        : player.streak > 0
          ? {
              slug: lastGame?.slug ?? currentDailyGame?.slug ?? "neon-drift",
              kicker: "Streak",
              title: `${player.streak} days`,
              body: "Keep the chain alive before reset.",
              href: "/challenges",
              cta: "Protect streak",
            }
          : {
              slug: lastGame?.slug ?? "neon-drift",
              kicker: "Command",
              title: "The floor is open",
              body: "No live challenge. Start a daily or take a record.",
              href: "/daily",
              cta: "Open Daily Arcade",
            };

  useAccent(GAME_MANIFESTS.find((g) => g.slug === hero.slug)?.accent);

  return (
    <div>
      <GameBackdrop slug={hero.slug} className="min-h-[100svh]" dim={0.18} priority>
        <div className="flex min-h-[40vh] flex-col justify-end px-5 pb-6 pt-20 md:min-h-[42vh] md:px-10">
          <p className="meta text-white/50">{hero.kicker}</p>
          <h1 className="display mt-2 text-[48px] text-white md:text-[80px]">Arcade</h1>
          <p className="display mt-3 max-w-[16ch] text-[28px] text-white/90 md:text-[40px]">{hero.title}</p>
          <p className="mt-3 max-w-md text-[15px] text-white/65">{hero.body}</p>
          <div className="mt-7">
            <ChamferButton href={hero.href}>{hero.cta}</ChamferButton>
          </div>
        </div>
        <section className="px-5 pb-10 md:px-10">
          <h2 className="sr-only">Player</h2>
          <ProgressionStrip
            level={lv.level}
            into={lv.intoLevel}
            needed={Math.max(1, lv.needed)}
            streak={player.streak}
            trophies={`${ach.unlocked}/${ach.total}`}
          />
        </section>
      </GameBackdrop>

      {friendsNow.length ? (
        <section className="px-5 md:px-10">
          <SectionHeader title="In the room" />
          <div className="mt-4 grid gap-3">
            {friendsNow.map((f) => (
              <FriendPresence key={f.id} friend={f} />
            ))}
          </div>
        </section>
      ) : last ? (
        <section className="px-5 md:px-10">
          <SectionHeader title="Last run" />
          <p className="mt-3 text-[18px] text-white">
            {lastGame?.title} · {formatPlayScore(last.gameId, last.score) ?? last.result}
          </p>
        </section>
      ) : null}

      <section className="px-5 py-10 md:px-10">
        <h2 className="text-[16px] text-white/72">Daily challenges</h2>
        <div className="mt-5">
          <EventRoute
            steps={dailyEvents.map((e, i) => {
              const g = getManifest(e.gameId);
              const done = arcade.daily.day === day && arcade.daily.completed.includes(`${e.gameId}:${e.mode}`);
              return {
                key: `${e.gameId}:${e.mode}`,
                index: i,
                slug: g?.slug ?? e.gameId,
                title: g?.title ?? e.label,
                kicker: done ? "Cleared" : i === dailyDone ? "Now" : `Stage ${i + 1}`,
                status: done ? "done" : i === dailyDone ? "current" : "open",
                href: "/daily",
              };
            })}
          />
        </div>
        <div className="mt-8">
          {dailies.quests[0] ? <ChallengeWidget view={challengeViewModel(player, dailies.quests[0])} /> : null}
        </div>
      </section>

      <section className="px-5 pb-10 md:px-10">
        <SectionHeader title="Grand Prix" meta={`${arcade.grandPrix.points} pts`} />
        <p className="mt-3 text-[15px] text-white/65">{gpGame?.title ?? "Cup route"}</p>
        <div className="mt-4">
          <EventRoute
            cols={5}
            steps={GRAND_PRIX_PLAYLIST.map((round, i) => {
              const g = getManifest(round.gameId);
              const scored = arcade.grandPrix.scores[i] != null;
              const current = !scored && GRAND_PRIX_PLAYLIST.findIndex((_, j) => arcade.grandPrix.scores[j] == null) === i;
              return {
                key: `${round.gameId}-${i}`,
                index: i,
                slug: g?.slug ?? round.gameId,
                title: g?.title ?? round.gameId,
                kicker: i === GRAND_PRIX_PLAYLIST.length - 1 ? "Final" : `R${i + 1}`,
                status: scored ? "done" : current ? "current" : "locked",
                href: "/grand-prix",
              };
            })}
          />
        </div>
      </section>

      <section className="px-5 pb-12 md:px-10">
        <SectionHeader title="Trophy case" />
        <div className="mt-4">
          {unlocks.length ? (
            <AchievementStrip
              unlocked={ach.unlocked}
              total={ach.total}
              items={unlocks.map((a) => ({
                key: a.key,
                name: a.name,
                description: a.description,
                unlocked: true,
                gameId: a.gameId ?? "platform",
                xp: a.xp,
              }))}
              showcase
            />
          ) : (
            <p className="text-[14px] text-white/50">Trophies unlock in the run, not in a menu.</p>
          )}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {GAME_MANIFESTS.filter((g) => hasRecord(gameRecordFor(player, g.id).score))
            .slice(0, 3)
            .map((g) => {
              const rec = gameRecordFor(player, g.id);
              return <RecordWidget key={g.id} game={g} score={rec.score} modeLabel={rec.mode} />;
            })}
        </div>
        <p className="mt-8 text-[12px] text-white/35">{store.continuePlaying().length} games on this device</p>
      </section>
    </div>
  );
}
