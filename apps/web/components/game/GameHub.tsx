"use client";

import { GAME_MANIFESTS, type GameManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";
import { GameCard, PlayButton } from "@/components/game/GameCard";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { formatScore } from "@/lib/player-store";

export function GameHub({ game }: { game: GameManifest }) {
  useAccent(game.accent);
  const store = useStore();
  const player = usePlayer();
  const mode = game.id === "velocity-run" ? "course-1" : game.id === "swarm-protocol" ? "survival" : "circuit";
  const pb = store.personalBest(game.id, mode, game.id === "velocity-run");
  const related = GAME_MANIFESTS.filter((g) => g.id !== game.id);
  const board = store.leaderboard(game.id, mode);
  const friends = player.friends.filter((f) => f.gameId === game.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    genre: game.genre,
    gamePlatform: "Web Browser",
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative min-h-[70vh] overflow-hidden">
        <GameArt slug={game.slug} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_25%,transparent)] to-transparent" />
        <div className="relative flex min-h-[70vh] flex-col justify-end px-5 pb-10 md:px-10">
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/50">{game.genre}</p>
          <h1 className="display mt-3 text-[56px] md:text-[84px]">{game.title}</h1>
          <p className="mt-2 max-w-lg text-[16px] text-white/75">{game.tagline}</p>
          <p className="mt-4 text-[13px] text-white/55">
            {Number.isFinite(pb) && pb > 0 && pb < 1e12 ? `PB ${formatScore(game.id, pb)}` : "Be the first to set the pace."}
          </p>
          <div className="mt-6 flex gap-3">
            <PlayButton href={`/play/${game.slug}`}>{player.history.some((h) => h.gameId === game.id) ? "Resume" : "Play"}</PlayButton>
            <Link href="/leaderboards" className="inline-flex h-12 items-center px-4 text-[13px] text-white/70">
              Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-10 px-5 py-10 md:grid-cols-[1.3fr_.8fr] md:px-10">
        <div className="space-y-8">
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">How to play</h2>
            <ul className="mt-3 space-y-2 text-[15px] text-[var(--text-dim)]">
              {game.howToPlay.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Controls</h2>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
              {game.controls.map((c) => (
                <div key={c.input} className="rounded-xl bg-[var(--surface)] px-3 py-2">
                  <dt className="text-[11px] text-[var(--text-faint)]">{c.input}</dt>
                  <dd>{c.action}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Achievements</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {game.achievements.map((a) => {
                const unlocked = player.achievements.includes(`${game.id}:${a.key}`);
                return (
                  <li key={a.key} className="rounded-xl border border-[var(--line)] px-3 py-3">
                    <p className="text-[14px]">
                      {a.name} {unlocked ? "·" : ""}
                    </p>
                    <p className="text-[12px] text-[var(--text-dim)]">{a.description}</p>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">FAQ</h2>
            {game.faq.map((f) => (
              <div key={f.q} className="mt-3">
                <p className="text-[14px]">{f.q}</p>
                <p className="text-[13px] text-[var(--text-dim)]">{f.a}</p>
              </div>
            ))}
          </section>
        </div>
        <aside className="space-y-8">
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Board</h2>
            {board.length ? (
              <ol className="mt-3 space-y-2">
                {board.map((row, i) => (
                  <li key={row.name} className="flex justify-between text-[14px]">
                    <span>
                      {i + 1} {row.name}
                    </span>
                    <span className="text-[var(--text-dim)]">{formatScore(game.id, row.score)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-[14px] text-[var(--text-dim)]">Be the first to set the pace.</p>
            )}
          </section>
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Friends</h2>
            {friends.length ? (
              <ul className="mt-3 text-[14px]">
                {friends.map((f) => (
                  <li key={f.id}>{f.displayName} is playing</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[14px] text-[var(--text-dim)]">Games are better with rivals.</p>
            )}
          </section>
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Related</h2>
            <div className="mt-3 space-y-3">
              {related.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}
