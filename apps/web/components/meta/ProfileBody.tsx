"use client";

import { GAME_MANIFESTS, allAchievements, getManifest } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import { useEffect, useState } from "react";
import {
  AchievementStrip,
  ActivityFeed,
  EmptyState,
  ProgressWidget,
  QuickAction,
  RecordWidget,
  SectionHeader,
  StatsWidget,
} from "@/components/platform";
import { Avatar, useAccent } from "@/components/shell/AppShell";
import { GameArt } from "@/components/game/GameArt";
import { usePlayer } from "@/lib/player";
import {
  activityFromHistory,
  favoriteGameId,
  gameRecordFor,
  latestUnlocks,
  playerStatsFromSnapshot,
} from "@/lib/platform/adapters";
import { boardModeOptions } from "@/lib/platform/modes";
import { formatLevel, formatPlayScore, formatRelativeTime, hasRecord } from "@/lib/platform/format";
import { playerApi } from "@/lib/player-api";
import type { PublicProfileView } from "@/lib/platform/focus";

export function ProfileBody({ self, username }: { self?: boolean; username?: string }) {
  useAccent();
  const player = usePlayer();
  if (self || (username && username === player.username)) {
    return <SelfProfile />;
  }
  return <PublicProfile username={username ?? ""} />;
}

function SelfProfile() {
  const player = usePlayer();
  const lv = levelFromXp(player.xp);
  const stats = playerStatsFromSnapshot(player);
  const favorite = favoriteGameId(player);
  const favoriteGame = favorite ? getManifest(favorite) : null;
  const showcase = latestUnlocks(player, 3);
  const activity = activityFromHistory(player.history, 10);
  const friends = player.friends.filter((f) => f.status === "accepted").length;

  return (
    <div className="relative overflow-hidden px-5 py-8 md:px-10">
      {favoriteGame ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] overflow-hidden opacity-40">
          <GameArt slug={favoriteGame.slug} variant="backdrop" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg)]" />
        </div>
      ) : null}
      <div className="relative">
        <div className="flex flex-wrap items-end gap-6">
          <Avatar id={player.avatar} size={96} />
          <div>
            <p className="meta">Player</p>
            <h1 className="display mt-2 text-[48px] md:text-[72px]">{player.displayName}</h1>
            <p className="mt-2 text-[14px] text-[var(--text-dim)]">
              @{player.username} · {formatLevel(lv.level)}
              {player.streak > 0 ? ` · ${player.streak} day streak` : ""}
            </p>
            {favoriteGame ? <p className="mt-2 text-[13px] text-[var(--text-dim)]">Main game · {favoriteGame.title}</p> : null}
          </div>
        </div>
        <div className="mt-4">
          <QuickAction href="/settings" tone="quiet">
            Settings
          </QuickAction>
        </div>
        <div className="mt-8 max-w-md">
          <ProgressWidget value={lv.intoLevel} max={Math.max(1, lv.needed)} caption="Level progress" />
        </div>

        <div className="mt-10">
          <StatsWidget
            items={[
              { value: stats.runs, label: "Runs" },
              { value: stats.pbs, label: "PBs" },
              { value: stats.achievements, label: "Achievements" },
              { value: stats.games, label: "Games" },
              ...(friends ? [{ value: friends, label: "Friends" }] : []),
            ]}
          />
        </div>

        <RecordsBlock playerId="self" />

        <section className="mt-12">
          <SectionHeader title="Latest unlocks" action={<QuickAction href="/achievements" tone="quiet">All</QuickAction>} />
          <div className="mt-4">
            {showcase.length ? (
              <AchievementStrip
                unlocked={stats.achievements}
                total={allAchievements().length}
                items={showcase.map((a) => ({ key: a.key, name: a.name, description: a.description, unlocked: true }))}
                showcase
              />
            ) : (
              <EmptyState title="No unlocks yet" body="Finish a run to start a showcase." action={<QuickAction href="/">Play</QuickAction>} />
            )}
          </div>
        </section>

        <section className="mt-12 max-w-lg">
          <SectionHeader title="Activity" />
          <div className="mt-2">
            <ActivityFeed items={activity} />
          </div>
        </section>
      </div>
    </div>
  );
}

function RecordsBlock({ scores }: { playerId: string; scores?: PublicProfileView["records"] }) {
  const player = usePlayer();
  return (
    <section className="mt-12">
      <SectionHeader title="Records" />
      <div className="mt-6 space-y-8">
        {GAME_MANIFESTS.map((g) => {
          const modes = boardModeOptions(g.id).filter((m) => m.id !== "circuit");
          const rows = modes
            .map((m) => {
              const rec = scores
                ? scores.find((s) => s.gameId === g.id && s.mode === m.id)
                : gameRecordFor(player, g.id, m.id);
              const score = rec && "score" in rec ? rec.score : 0;
              return { mode: m, score };
            })
            .filter((r) => hasRecord(r.score));
          if (!rows.length) {
            return (
              <div key={g.id}>
                <p className="meta">{g.title}</p>
                <EmptyState title={`No ${g.title} record`} body="Play a mode to pin a time or score." action={<QuickAction href={`/play/${g.slug}`}>Play</QuickAction>} />
              </div>
            );
          }
          return (
            <div key={g.id} className="space-y-4">
              {rows.map((r) => (
                <RecordWidget key={`${g.id}-${r.mode.id}`} game={g} score={r.score} modeLabel={r.mode.label} />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PublicProfile({ username }: { username: string }) {
  const player = usePlayer();
  const [state, setState] = useState<"loading" | "error" | "missing" | "ready">("loading");
  const [data, setData] = useState<PublicProfileView | null>(null);

  useEffect(() => {
    let live = true;
    setState("loading");
    void playerApi.publicProfile(username).then((res) => {
      if (!live) return;
      if (!res.ok) {
        setState(res.status === 404 ? "missing" : "error");
        return;
      }
      setData(res.data);
      setState("ready");
    });
    return () => {
      live = false;
    };
  }, [username]);

  const friend = player.friends.find((f) => f.username.toLowerCase() === username.toLowerCase() && f.status === "accepted");
  const favorite = data?.favoriteGameId ? getManifest(data.favoriteGameId) : null;

  if (state === "loading") {
    return (
      <div className="px-5 py-10 md:px-10">
        <p className="meta">Player</p>
        <div className="mt-6 h-16 w-48 animate-pulse bg-[var(--elevated)]" />
      </div>
    );
  }
  if (state === "missing") {
    return (
      <div className="px-5 py-10 md:px-10">
        <h1 className="display text-[48px]">Player not found</h1>
        <p className="mt-3 text-[14px] text-[var(--text-dim)]">No public profile matches @{username}.</p>
      </div>
    );
  }
  if (state === "error" || !data) {
    return (
      <div className="px-5 py-10 md:px-10">
        <h1 className="display text-[48px]">Profile unavailable</h1>
        <p className="mt-3 text-[14px] text-[var(--text-dim)]">Could not load this player right now.</p>
      </div>
    );
  }

  const unlocked = allAchievements().filter((a) => data.achievements.includes(`${a.gameId ?? "platform"}:${a.key}`));
  const activity =
    data.activity === null
      ? null
      : data.activity.map((h, i) => ({
          id: `${h.at}-${i}`,
          gameId: h.gameId,
          title: getManifest(h.gameId)?.title ?? h.gameId,
          event: h.event,
          scoreLabel: formatPlayScore(h.gameId, h.score),
          at: h.at,
          timeLabel: formatRelativeTime(h.at),
        }));

  return (
    <div className="px-5 py-8 md:px-10">
      <div className="flex flex-wrap items-end gap-6">
        <Avatar id={data.avatar} size={96} />
        <div>
          <h1 className="display text-[48px] md:text-[72px]">{data.displayName}</h1>
          <p className="mt-2 text-[14px] text-[var(--text-dim)]">
            @{data.username} · {formatLevel(data.level)}
          </p>
          {favorite ? <p className="mt-2 text-[13px] text-[var(--text-dim)]">Main game · {favorite.title}</p> : null}
        </div>
      </div>
      {friend?.presence === "playing" && friend.gameId ? (
        <div className="mt-6">
          <QuickAction href={`/play/${getManifest(friend.gameId)?.slug ?? ""}`}>Join</QuickAction>
        </div>
      ) : null}

      <RecordsBlock playerId={data.username} scores={data.records} />

      <section className="mt-12">
        <SectionHeader title="Achievements" />
        <div className="mt-4">
          {unlocked.length ? (
            <AchievementStrip
              unlocked={unlocked.length}
              total={allAchievements().length}
              items={unlocked.slice(0, 3).map((a) => ({ key: a.key, name: a.name, description: a.description, unlocked: true }))}
              showcase
            />
          ) : (
            <EmptyState title="No public trophies yet" />
          )}
        </div>
      </section>

      <section className="mt-12 max-w-lg">
        <SectionHeader title="Activity" />
        {activity === null ? (
          <EmptyState title="Activity is private" body="This player keeps recent runs off their public profile." />
        ) : (
          <div className="mt-2">
            <ActivityFeed items={activity} />
          </div>
        )}
      </section>
    </div>
  );
}
