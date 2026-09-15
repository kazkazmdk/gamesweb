"use client";

import { GAME_MANIFESTS, PLATFORM_ACHIEVEMENTS, allAchievements } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import { useState } from "react";
import {
  AchievementStrip,
  ActivityFeed,
  EmptyState,
  PlayerCard,
  ProgressWidget,
  QuickAction,
  RecordWidget,
  SectionHeader,
  StatsWidget,
} from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer } from "@/lib/player";
import {
  activityFromHistory,
  favoriteGameId,
  gameRecordFor,
  latestUnlocks,
  playerStatsFromSnapshot,
} from "@/lib/platform/adapters";
import { formatLevel } from "@/lib/platform/format";

export function ProfileBody({ self, username }: { self?: boolean; username?: string }) {
  useAccent();
  const player = usePlayer();
  const lv = levelFromXp(player.xp);
  const [showAll, setShowAll] = useState(false);
  if (!self && username && username !== player.username) {
    return (
      <div className="px-5 py-10 md:px-10">
        <h1 className="display text-[48px]">{username}</h1>
        <p className="mt-2 text-[14px] text-[var(--text-dim)]">Public profile appears when they play on this arcade.</p>
      </div>
    );
  }
  const stats = playerStatsFromSnapshot(player);
  const favorite = favoriteGameId(player);
  const favoriteTitle = GAME_MANIFESTS.find((g) => g.id === favorite)?.title;
  const showcase = latestUnlocks(player, 3);
  const activity = activityFromHistory(player.history, 10);

  return (
    <div className="px-5 py-8 md:px-10">
      <PlayerCard
        name={player.displayName}
        username={player.username}
        avatar={player.avatar}
        level={lv.level}
        stat={`${player.streak}d streak${favoriteTitle ? ` · ${favoriteTitle}` : ""}`}
        size="md"
        heading
      />
      <p className="mt-4 text-[13px] text-[var(--text-dim)]">
        {player.isGuest ? "Guest" : "Account"} · {formatLevel(lv.level)}
      </p>
      <div className="mt-4 max-w-md">
        <ProgressWidget value={lv.intoLevel} max={Math.max(1, lv.needed)} caption="Level progress" />
      </div>

      <div className="mt-10">
        <StatsWidget
          items={[
            { value: stats.runs, label: "Runs" },
            { value: stats.pbs, label: "PBs" },
            { value: stats.achievements, label: "Achievements" },
            { value: stats.games, label: "Games" },
          ]}
        />
      </div>

      <section className="mt-12">
        <SectionHeader title="Records" />
        <div className="mt-4 space-y-6">
          {GAME_MANIFESTS.some((g) => {
            const rec = gameRecordFor(player, g.id);
            return Number.isFinite(rec.score) && rec.score > 0 && rec.score < 1e12;
          }) ? (
            GAME_MANIFESTS.map((g) => {
              const rec = gameRecordFor(player, g.id);
              if (!Number.isFinite(rec.score) || rec.score <= 0 || rec.score >= 1e12) return null;
              return <RecordWidget key={g.id} game={g} score={rec.score} modeLabel={rec.mode} />;
            })
          ) : (
            <EmptyState title="No records yet" body="Finish a run to pin a personal best." action={<QuickAction href="/play">Play</QuickAction>} />
          )}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader
          title="Latest unlocks"
          action={
            <button type="button" className="min-h-11 text-[13px] text-[var(--text-dim)]" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Hide" : "View all"}
            </button>
          }
        />
        <div className="mt-4">
          {showcase.length ? (
            <AchievementStrip
              unlocked={stats.achievements}
              total={allAchievements().length}
              items={showcase.map((a) => ({ key: a.key, name: a.name, description: a.description, unlocked: true }))}
              showcase
            />
          ) : (
            <EmptyState title="No unlocks yet" body="Finish a run to start a showcase." action={<QuickAction href="/play">Play</QuickAction>} />
          )}
        </div>
        {showAll ? (
          <ul className="mt-6 max-w-lg divide-y divide-[var(--line)]">
            {PLATFORM_ACHIEVEMENTS.map((a) => {
              const on = player.achievements.includes(`platform:${a.key}`);
              return (
                <li key={a.key} className="py-3">
                  <p className={on ? "text-[14px]" : "text-[14px] text-[var(--text-dim)]"}>{a.name}</p>
                  <p className="text-[12px] text-[var(--text-faint)]">{a.description}</p>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="mt-12 max-w-lg">
        <SectionHeader title="History" />
        <div className="mt-2">
          <ActivityFeed items={activity} />
        </div>
      </section>
    </div>
  );
}
