"use client";

import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import Link from "next/link";
import {
  AchievementStrip,
  ActivityFeed,
  ChallengeWidget,
  EmptyState,
  FriendPresence,
  InviteWidget,
  PlayerCard,
  ProgressWidget,
  QuickAction,
  RecordWidget,
  SectionHeader,
} from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { activityFromHistory, achievementProgress, challengeViewModel, dailySummary, gameRecordFor, latestUnlocks } from "@/lib/platform/adapters";
import { formatCountdown, formatLevel, hasRecord, msUntilUtcMidnight } from "@/lib/platform/format";
import { useEffect, useState } from "react";

export function ArcadeHub() {
  useAccent();
  const player = usePlayer();
  const store = useStore();
  const lv = levelFromXp(player.xp);
  const dailies = dailySummary(player);
  const friendsNow = player.friends.filter((f) => f.status === "accepted" && f.presence === "playing");
  const records = GAME_MANIFESTS.map((g) => ({ game: g, rec: gameRecordFor(player, g.id) })).filter((r) =>
    hasRecord(r.rec.score),
  );
  const unlocks = latestUnlocks(player, 3);
  const ach = achievementProgress(player);
  const activity = activityFromHistory(player.history, 8);
  const [remain, setRemain] = useState(msUntilUtcMidnight());
  useEffect(() => {
    const t = window.setInterval(() => setRemain(msUntilUtcMidnight()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="px-5 py-8 md:px-10">
      <p className="meta">Welcome hub</p>
      <h1 className="display mt-2 text-[44px] md:text-[64px]">Arcade</h1>
      <p className="mt-3 max-w-xl text-[15px] text-[var(--text-dim)]">
        Progression, dailies, friends, and records — the meta layer around the games.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <SectionHeader title="Player" action={<QuickAction href="/me" tone="quiet">Profile</QuickAction>} />
          <div className="mt-4">
            <PlayerCard
              name={player.displayName}
              username={player.username}
              avatar={player.avatar}
              level={lv.level}
              stat={player.streak > 0 ? `${player.streak}d streak` : formatLevel(lv.level)}
              size="md"
            />
            <div className="mt-5 max-w-md">
              <ProgressWidget value={lv.intoLevel} max={Math.max(1, lv.needed)} caption="Into next level" />
            </div>
          </div>
        </section>

        <section className="lg:col-span-5">
          <SectionHeader
            title="Daily challenges"
            meta={`${dailies.done}/${dailies.total} · ${formatCountdown(remain)}`}
            action={<QuickAction href="/challenges" tone="quiet">All</QuickAction>}
          />
          <div className="mt-2 divide-y divide-[var(--line)]">
            {dailies.quests.map((q) => (
              <ChallengeWidget key={q.id} view={challengeViewModel(player, q)} variant="compact" />
            ))}
          </div>
        </section>

        <section className="lg:col-span-6">
          <SectionHeader title="Friends playing" action={<QuickAction href="/friends" tone="quiet">All</QuickAction>} />
          {friendsNow.length ? (
            <div className="mt-2 divide-y divide-[var(--line)]">
              {friendsNow.map((f) => (
                <FriendPresence key={f.id} friend={f} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No friends playing"
              body="Invite someone to chase your Neon score."
              action={<InviteWidget compact />}
            />
          )}
        </section>

        <section className="lg:col-span-6">
          <SectionHeader title="Recent records" />
          <div className="mt-4 space-y-5">
            {records.length ? (
              records.map((r) => <RecordWidget key={r.game.id} game={r.game} score={r.rec.score} modeLabel={r.rec.mode} />)
            ) : (
              <EmptyState title="No records yet" body="Finish a run to pin a personal best." action={<QuickAction href="/">Play</QuickAction>} />
            )}
          </div>
        </section>

        <section className="lg:col-span-4">
          <SectionHeader title="Streak" />
          {player.streak > 0 ? (
            <p className="stat mt-4 text-[56px]">{player.streak}</p>
          ) : (
            <EmptyState
              title="No streak yet"
              body="Finish a daily to start a chain that survives overnight."
              action={<QuickAction href="/challenges">Open dailies</QuickAction>}
            />
          )}
          {player.streak > 0 ? <p className="mt-2 text-[13px] text-[var(--text-dim)]">days in a row.</p> : null}
        </section>

        <section className="lg:col-span-8">
          <SectionHeader title="Achievements" action={<QuickAction href="/achievements" tone="quiet">All</QuickAction>} />
          <div className="mt-4">
            {unlocks.length ? (
              <AchievementStrip
                unlocked={ach.unlocked}
                total={ach.total}
                items={unlocks.map((a) => ({ key: a.key, name: a.name, description: a.description, unlocked: true }))}
                showcase
              />
            ) : (
              <EmptyState title="No trophies yet" body="They unlock in the run, not in a menu." action={<QuickAction href="/achievements" tone="quiet">Browse</QuickAction>} />
            )}
          </div>
        </section>

        <section className="lg:col-span-12">
          <SectionHeader title="Activity" />
          <div className="mt-2 max-w-2xl">
            <ActivityFeed items={activity} />
          </div>
        </section>
      </div>
      <p className="mt-10 text-[11px] text-[var(--text-faint)]">
        <Link href="/achievements" className="underline-offset-4 hover:underline">
          Achievements
        </Link>
        {" · "}
        <Link href="/challenges" className="underline-offset-4 hover:underline">
          Dailies
        </Link>
        {" · "}
        {store.continuePlaying().length} games on this device
      </p>
    </div>
  );
}
