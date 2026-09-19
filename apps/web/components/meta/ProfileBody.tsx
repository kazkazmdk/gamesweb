"use client";

import { GAME_MANIFESTS, allAchievements, getManifest } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import { useEffect, useState } from "react";
import {
  ActivityFeed,
  EmptyState,
  ProgressWidget,
  QuickAction,
  RecordWidget,
  SectionHeader,
  StatsWidget,
} from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { PlayerIdentity, TrophyShelf } from "@/components/visual";
import { usePlayer } from "@/lib/player";
import {
  activityFromHistory,
  favoriteGameId,
  gameRecordFor,
  latestUnlocks,
  playerStatsFromSnapshot,
} from "@/lib/platform/adapters";
import { formatPlayScore, formatRelativeTime, hasRecord } from "@/lib/platform/format";
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
  const favoriteGame = (favorite ? getManifest(favorite) : null) ?? GAME_MANIFESTS[0];
  const showcase = latestUnlocks(player, 3);
  const activity = activityFromHistory(player.history, 10);
  const friends = player.friends.filter((f) => f.status === "accepted").length;

  return (
    <div>
      <PlayerIdentity
        name={player.displayName}
        username={player.username}
        avatar={player.avatar}
        level={lv.level}
        stat={player.streak > 0 ? `${player.streak} day streak` : favoriteGame ? `Main · ${favoriteGame.title}` : undefined}
        slug={favoriteGame?.slug}
        action={
          <QuickAction href="/settings" tone="quiet">
            Settings
          </QuickAction>
        }
      />
      <div className="px-5 py-8 md:px-10">
        <div className="max-w-md">
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

        <RecordsBlock />

        <section className="mt-12">
          <SectionHeader title="Trophy shelf" action={<QuickAction href="/achievements" tone="quiet">All</QuickAction>} />
          <div className="mt-4">
            {showcase.length ? (
              <TrophyShelf
                featured
                items={showcase.map((a) => ({
                  id: a.key,
                  name: a.name,
                  description: a.description,
                  unlocked: true,
                  gameId: a.gameId ?? "platform",
                  xp: a.xp,
                }))}
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

function RecordsBlock({ scores }: { scores?: PublicProfileView["records"] }) {
  const player = usePlayer();
  const rows = GAME_MANIFESTS.map((g) => {
    const rec = scores ? scores.find((s) => s.gameId === g.id) : gameRecordFor(player, g.id);
    const score = rec && "score" in rec ? rec.score : 0;
    return { g, rec, score };
  }).filter((row) => hasRecord(row.score));
  return (
    <section className="mt-12">
      <SectionHeader title="Games" />
      {rows.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {rows.map(({ g, rec, score }) => (
            <RecordWidget key={g.id} game={g} score={score} modeLabel={rec && "mode" in rec ? rec.mode : undefined} />
          ))}
        </div>
      ) : (
        <EmptyState title="No records yet" body="Finish a run to pin a game here." action={<QuickAction href="/">Play</QuickAction>} />
      )}
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
    <div>
      <PlayerIdentity
        name={data.displayName}
        username={data.username}
        avatar={data.avatar}
        level={data.level}
        stat={favorite ? `Main · ${favorite.title}` : undefined}
        slug={favorite?.slug}
        action={
          friend?.presence === "playing" && friend.gameId ? (
            <QuickAction href={`/play/${getManifest(friend.gameId)?.slug ?? ""}`}>Play this game</QuickAction>
          ) : undefined
        }
      />
      <div className="px-5 py-8 md:px-10">
      <RecordsBlock scores={data.records} />

      <section className="mt-12">
        <SectionHeader title="Achievements" />
        <div className="mt-4">
          {unlocked.length ? (
            <TrophyShelf
              featured
              items={unlocked.slice(0, 3).map((a) => ({
                id: a.key,
                name: a.name,
                description: a.description,
                unlocked: true,
                gameId: a.gameId ?? "platform",
                xp: a.xp,
              }))}
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
    </div>
  );
}
