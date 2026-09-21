"use client";

import { GAME_MANIFESTS, type GameManifest } from "@gamesweb/game-sdk";
import { useEffect, useState } from "react";
import { analytics } from "@gamesweb/analytics";
import { PlayButton } from "@/components/game/GameCard";
import {
  AchievementStrip,
  ActivityCard,
  ActivityRail,
  FriendPresence,
  GameTile,
  InlineError,
  RankWidget,
  SectionHeader,
} from "@/components/platform";
import { GameBackdrop } from "@/components/visual";
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
  const played = player.history.some((h) => h.gameId === game.id);

  return (
    <article>
      <GameBackdrop slug={game.slug} className="min-h-[70vh] md:min-h-[86vh]" dim={0.12} variant="hero" priority>
        <div className="flex min-h-[70vh] flex-col justify-end px-5 pb-10 pt-20 md:min-h-[86vh] md:px-10 md:pb-16">
          <p className="meta text-white/55">{game.genre}</p>
          <h1 className="display mt-3 max-w-[14ch] text-[48px] text-white md:text-[80px]">{game.title}</h1>
          <p className="mt-3 max-w-md text-[16px] text-white/75">{game.tagline}</p>
          <p className="mt-4 text-[13px] text-white/55">
            {[formatPlayScore(game.id, pb) ?? "No record yet", selected?.label, rank.rank ? `#${rank.rank}` : null, friend ? `vs ${friend.name}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {ctx.daily ? (
            <p className="mt-2 text-[13px] text-[var(--accent)]">{ctx.daily.done ? "Daily cleared" : `Daily · ${ctx.daily.label}`}</p>
          ) : null}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <span onClick={() => analytics.track("game_hub_to_play", { gameId: game.id })}>
              <PlayButton href={`/play/${game.slug}`}>{played ? "Continue" : "Play"}</PlayButton>
            </span>
            <a href="#board" className="home-secondary">
              Leaderboard ›
            </a>
          </div>
        </div>
      </GameBackdrop>

      <section className="px-5 py-6 md:px-10" aria-label="Mode">
        <h2 className="sr-only">Your run</h2>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={game.id === "neon-drift" ? "Track" : game.id === "velocity-run" ? "Course" : "Mode"}>
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={playMode === m.id}
              className={`min-h-11 px-3 text-[13px] ${playMode === m.id ? "gw-frame text-[var(--text)]" : "text-[var(--text-dim)]"}`}
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
        </div>
        <aside className="space-y-10">
          <section id="board">
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
              <div className="mt-2">
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

      <p className="sr-only">
        <a href={`/games/${game.slug}/guide`}>Guide</a>
        <a href={`/games/${game.slug}/controls`}>Controls</a>
        <a href="/games">Catalog</a>
      </p>
    </article>
  );
}
