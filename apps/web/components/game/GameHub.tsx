"use client";

import { GAME_MANIFESTS, type GameManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PlayButton } from "@/components/game/GameCard";
import {
  AchievementStrip,
  ActivityCard,
  ActivityRail,
  FriendPresence,
  GameTile,
  InlineError,
  PlatformHero,
  RankWidget,
  SectionHeader,
} from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { achievementProgress, friendOnBoard, rankViewModel } from "@/lib/platform/adapters";
import { formatPlayScore } from "@/lib/platform/format";
import { focusedGameContext } from "@/lib/platform/focus";
import { boardModeFromPlayIndex, loadPlayIndex, lowerIsBetter, playModeOptions, savePlayIndex } from "@/lib/platform/modes";

export function GameHub({ game }: { game: GameManifest }) {
  useAccent(game.accent);
  const store = useStore();
  const player = usePlayer();
  const [playMode, setPlayMode] = useState("0");
  useEffect(() => {
    setPlayMode(String(loadPlayIndex(game.id)));
  }, [game.id]);
  useEffect(() => {
    void store.ensureBoard(game.id, boardModeFromPlayIndex(game.id, Number(playMode)));
  }, [store, game.id, playMode]);
  const modes = playModeOptions(game.id);
  const boardMode = boardModeFromPlayIndex(game.id, Number(playMode));
  const pb = store.personalBest(game.id, boardMode, lowerIsBetter(game.id));
  const related = GAME_MANIFESTS.filter((g) => g.id !== game.id);
  const board = store.leaderboard(game.id, boardMode);
  const personal = store.personalRank(game.id, boardMode);
  const rank = rankViewModel(board, game.id, personal);
  const friend = friendOnBoard(board, player.friends);
  const ctx = focusedGameContext(player, game, Number(playMode), board);
  const ach = achievementProgress(player, game.id);
  const friendsHere = player.friends.filter(
    (f) => f.status === "accepted" && f.presence === "playing" && f.gameId === game.id,
  );
  const selected = modes.find((m) => m.id === playMode);

  return (
    <article>
      <PlatformHero
        slug={game.slug}
        kicker={game.genre}
        title={game.title}
        tagline={game.tagline}
        metrics={[formatPlayScore(game.id, pb), game.sessionHint].filter(Boolean).join(" · ")}
        actions={
          <>
            <PlayButton href={`/play/${game.slug}`}>{player.history.some((h) => h.gameId === game.id) ? "Resume" : "Play"}</PlayButton>
            <Link href="/leaderboards" className="inline-flex min-h-11 items-center px-4 text-[13px] text-white/70">
              Leaderboard
            </Link>
          </>
        }
        minHeight="hub"
      />

      <section className="border-y border-[var(--line)] px-5 py-6 md:px-10">
        <SectionHeader title="Your run" />
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <PlayButton href={`/play/${game.slug}`}>{player.history.some((h) => h.gameId === game.id) ? "Continue" : "Play"}</PlayButton>
          <p className="text-[14px] text-[var(--text-dim)]">
            {formatPlayScore(game.id, pb) ?? "No record yet"} · {selected?.label ?? "Mode"}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={game.id === "neon-drift" ? "Track" : game.id === "velocity-run" ? "Course" : "Mode"}>
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={playMode === m.id}
              className={`min-h-11 px-3 text-[13px] ${playMode === m.id ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)]" : "text-[var(--text-dim)]"}`}
              onClick={() => {
                setPlayMode(m.id);
                savePlayIndex(game.id, Number(m.id));
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        {selected?.hint ? <p className="mt-2 text-[12px] text-[var(--text-dim)]">{selected.hint}</p> : null}
      </section>

      <section className="px-5 py-8 md:px-10" aria-label="Activities">
        <SectionHeader title="Activities" />
        <div className="mt-4">
          <ActivityRail>
            {ctx.daily ? (
              <ActivityCard
                featured
                slug={game.slug}
                kicker="Daily"
                title={ctx.daily.label}
                progress={Number(ctx.daily.current.replace(/[^\d.-]/g, "")) || 0}
                target={Number(ctx.daily.target.replace(/[^\d.-]/g, "")) || 1}
                reward={ctx.daily.done ? "Complete" : "+XP"}
                href={`/play/${game.slug}`}
                cta={ctx.daily.done ? "Replay" : "Continue"}
              />
            ) : (
              <ActivityCard
                featured
                slug={game.slug}
                kicker="Session"
                title={game.title}
                meta={ctx.pbLabel ? `${ctx.modeLabel} · ${ctx.pbLabel}` : "Set a first record"}
                href={`/play/${game.slug}`}
                cta={ctx.playLabel}
              />
            )}
            {ctx.nextTrophy ? (
              <ActivityCard
                slug={game.slug}
                kicker="Next trophy"
                title={ctx.nextTrophy.name}
                meta={ctx.nextTrophy.description}
                href="/achievements"
                cta="Trophies"
              />
            ) : null}
            <ActivityCard
              slug={game.slug}
              kicker="Record"
              title={ctx.pbLabel ?? "No record yet"}
              meta={ctx.modeLabel}
              href={`/play/${game.slug}`}
              cta="Play"
            />
          </ActivityRail>
        </div>
      </section>

      <div className="grid gap-12 px-5 py-10 md:grid-cols-[1.3fr_.8fr] md:px-10">
        <div className="space-y-10">
          <section>
            <SectionHeader title="Achievements" />
            <div className="mt-4">
              <AchievementStrip
                unlocked={ach.unlocked}
                total={ach.total}
                items={ach.defs.map((a) => ({
                  key: a.key,
                  name: a.name,
                  description: a.description,
                  unlocked: player.achievements.includes(`${game.id}:${a.key}`),
                  gameId: game.id,
                  xp: a.xp,
                }))}
              />
            </div>
          </section>
          <section>
            <h2 className="meta">The game</h2>
            <p className="mt-3 max-w-2xl text-[15px] text-[var(--text-dim)]">{game.description}</p>
          </section>
          <section>
            <h2 className="meta">Features</h2>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--text-dim)]">
              {game.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
              <li>{game.sessionHint}</li>
              <li>{game.supportedDevices.join(" · ")}</li>
            </ul>
          </section>
          <section>
            <h2 className="meta">How to play</h2>
            <ul className="mt-3 space-y-2 text-[15px] text-[var(--text-dim)]">
              {game.howToPlay.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="meta">Controls</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px]">
              {game.controls.map((c) => (
                <div key={c.input} className="border-t border-[var(--line)] pt-2">
                  <dt className="meta">{c.input}</dt>
                  <dd>{c.action}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="meta">FAQ</h2>
            {game.faq.map((f) => (
              <div key={f.q} className="mt-3 border-t border-[var(--line)] pt-3">
                <p className="text-[14px]">{f.q}</p>
                <p className="text-[13px] text-[var(--text-dim)]">{f.a}</p>
              </div>
            ))}
          </section>
        </div>
        <aside className="space-y-10">
          <section>
            <SectionHeader title="Board" />
            <div className="mt-4">
              {store.boardError(game.id, boardMode) ? (
                <InlineError
                  title="Global board unavailable"
                  body="Your local PB is still here."
                  onRetry={() => void store.ensureBoard(game.id, boardMode, true)}
                />
              ) : (
                <RankWidget
                  gameId={game.id}
                  gameTitle={game.title}
                  slug={game.slug}
                  rows={board}
                  rank={rank.rank}
                  youScore={rank.you?.score}
                  gap={rank.gap}
                  friend={friend}
                />
              )}
            </div>
          </section>
          {friendsHere.length ? (
          <section>
            <SectionHeader title="Friends" />
            <div className="mt-2 divide-y divide-[var(--line)]">
              {friendsHere.map((f) => (
                <FriendPresence key={f.id} friend={f} compact />
              ))}
            </div>
          </section>
          ) : null}
          <section>
            <SectionHeader title="Related" />
            <div className="mt-3 space-y-2">
              {related.map((g) => (
                <GameTile key={g.id} game={g} variant="wide" />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}
