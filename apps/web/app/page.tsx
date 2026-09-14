"use client";

import { dailyQuests, GAME_MANIFESTS, getManifest, recommend } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import Link from "next/link";
import { useMemo } from "react";
import { GameArt } from "@/components/game/GameArt";
import { GameCard, PlayButton } from "@/components/game/GameCard";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { formatScore } from "@/lib/player-store";

export default function HomePage() {
  const player = usePlayer();
  const store = useStore();
  const lv = levelFromXp(player.xp);
  const returning = player.history.length > 0;
  const quests = dailyQuests(player.dayKey);
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
  const pb = store.personalBest(hero.id, hero.id === "velocity-run" ? "course-1" : hero.id === "swarm-protocol" ? "survival" : "circuit", hero.id === "velocity-run");
  const continueGames = store.continuePlaying().slice(0, 4);
  const forYou = rec.map((id) => getManifest(id)!).filter(Boolean);

  return (
    <div>
      <section className="relative min-h-[78vh] overflow-hidden md:min-h-[86vh]">
        <GameArt slug={hero.slug} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_55%,transparent)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        <div className="relative flex min-h-[78vh] flex-col justify-end px-5 pb-10 pt-10 md:min-h-[86vh] md:px-10 md:pb-16">
          <p className="text-[12px] uppercase tracking-[0.22em] text-white/55">
            {returning ? greeting() : "Instant play"}
          </p>
          {returning ? (
            <p className="mt-2 text-[14px] text-white/70">
              {greeting()}, {player.displayName} · Lv {lv.level}
            </p>
          ) : null}
          <h1 className="display mt-4 max-w-[16ch] text-[56px] md:text-[88px]">{hero.title}</h1>
          <p className="mt-3 max-w-md text-[16px] text-white/75">{hero.tagline}</p>
          <p className="mt-4 text-[13px] text-white/55">
            {Number.isFinite(pb) && pb > 0 && pb < 1e12 ? `Your best ${formatScore(hero.id, pb)}` : "Weekly event"}
            {" · "}
            {hero.sessionHint}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PlayButton href={`/play/${hero.slug}`} />
            <button
              type="button"
              className="h-12 rounded-full border border-white/15 px-5 text-[13px]"
              onClick={async () => {
                const url = store.inviteLink(hero.slug);
                await navigator.clipboard.writeText(url);
                store.markInvite();
                store.toast({ kind: "info", title: "Invite copied" });
              }}
            >
              Invite
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-12 px-5 py-10 md:px-10">
        <section>
          <RowTitle>Continue playing</RowTitle>
          {continueGames.length ? (
            <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-none">
              {continueGames.map((g) => (
                <div key={g.id} className="w-[260px] shrink-0">
                  <GameCard game={g} kicker="Resume" />
                </div>
              ))}
            </div>
          ) : (
            <Empty>Pick your first game.</Empty>
          )}
        </section>

        <section>
          <RowTitle>Daily challenges</RowTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {quests.map((q) => {
              const progress = player.questProgress[q.id] ?? 0;
              const done = player.questCompleted.includes(q.id);
              const game = q.gameId ? getManifest(q.gameId) : null;
              return (
                <Link
                  key={q.id}
                  href={game ? `/play/${game.slug}` : "/play"}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                    {done ? "Complete" : "Today"} · {q.xp} XP
                  </p>
                  <p className="mt-2 text-[16px]">{q.title}</p>
                  <p className="mt-1 text-[13px] text-[var(--text-dim)]">{q.description}</p>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[var(--accent)]"
                      style={{ width: `${Math.min(100, (progress / q.target) * 100)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <RowTitle>Friends playing</RowTitle>
          {player.friends.filter((f) => f.status === "accepted" && f.presence !== "offline").length ? (
            <ul className="mt-4 space-y-2">
              {player.friends
                .filter((f) => f.status === "accepted")
                .map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3">
                    <span>
                      {f.displayName}
                      <span className="ml-2 text-[12px] text-[var(--text-dim)]">
                        {f.presence === "playing" && f.gameId ? `playing ${getManifest(f.gameId)?.title}` : f.presence}
                      </span>
                    </span>
                    {f.gameId ? (
                      <Link href={`/play/${getManifest(f.gameId)?.slug}`} className="text-[12px] text-[var(--accent)]">
                        Join
                      </Link>
                    ) : null}
                  </li>
                ))}
            </ul>
          ) : (
            <Empty>
              Games are better with rivals.{" "}
              <Link href="/friends" className="text-[var(--text)] underline-offset-2 hover:underline">
                Invite
              </Link>
            </Empty>
          )}
        </section>

        <section>
          <RowTitle>For you</RowTitle>
          <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-none">
            {forYou.map((g) => (
              <div key={g.id} className="w-[260px] shrink-0">
                <GameCard game={g} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function RowTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">{children}</h2>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14px] text-[var(--text-dim)]">{children}</p>;
}
