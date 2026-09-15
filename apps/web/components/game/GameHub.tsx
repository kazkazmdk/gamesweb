"use client";

import { GAME_MANIFESTS, type GameManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PlayButton } from "@/components/game/GameCard";
import {
  AchievementStrip,
  EmptyState,
  FriendPresence,
  GameModeSelector,
  GameTile,
  PlatformHero,
  RankWidget,
  SectionHeader,
} from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { achievementProgress, dailySummary, friendOnBoard, rankViewModel } from "@/lib/platform/adapters";
import { formatFraction, formatPlayScore } from "@/lib/platform/format";
import { defaultBoardMode, loadPlayIndex, lowerIsBetter, playModeOptions, savePlayIndex } from "@/lib/platform/modes";

export function GameHub({ game }: { game: GameManifest }) {
  useAccent(game.accent);
  const store = useStore();
  const player = usePlayer();
  const [playMode, setPlayMode] = useState("0");
  useEffect(() => {
    setPlayMode(String(loadPlayIndex(game.id)));
  }, [game.id]);
  const modes = playModeOptions(game.id);
  const boardMode = defaultBoardMode(game.id);
  const pb = store.personalBest(game.id, boardMode, lowerIsBetter(game.id));
  const related = GAME_MANIFESTS.filter((g) => g.id !== game.id);
  const board = store.leaderboard(game.id, boardMode);
  const rank = rankViewModel(board, game.id);
  const friend = friendOnBoard(board, player.friends);
  const dailies = dailySummary(player);
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
        <div className="mt-4 flex flex-wrap items-end gap-8">
          <Metric value={formatPlayScore(game.id, pb) ?? "—"} label="Personal best" />
          <Metric value={rank.rank ? `#${rank.rank}` : "—"} label="Rank" />
          <Metric value={formatFraction(dailies.done, dailies.total)} label="Daily" />
          <Metric
            value={friend ? `${friend.name}` : "—"}
            label={friend ? `Friend · ${formatPlayScore(game.id, friend.score)}` : "Friend to beat"}
          />
          <PlayButton href={`/play/${game.slug}`}>Play</PlayButton>
        </div>
        <div className="mt-6 max-w-xl">
          <GameModeSelector
            label={game.id === "neon-drift" ? "Track" : game.id === "velocity-run" ? "Course" : "Mode"}
            options={modes}
            value={playMode}
            onChange={(id) => {
              setPlayMode(id);
              savePlayIndex(game.id, Number(id));
            }}
          />
          {selected?.hint ? <p className="mt-2 text-[12px] text-[var(--text-dim)]">{selected.hint}</p> : null}
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
            </div>
          </section>
          <section>
            <SectionHeader title="Friends" />
            {friendsHere.length ? (
              <div className="mt-2 divide-y divide-[var(--line)]">
                {friendsHere.map((f) => (
                  <FriendPresence key={f.id} friend={f} compact />
                ))}
              </div>
            ) : (
              <EmptyState title="No friends in this world right now." />
            )}
          </section>
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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="stat text-[32px] md:text-[40px]">{value}</p>
      <p className="meta mt-1">{label}</p>
    </div>
  );
}
