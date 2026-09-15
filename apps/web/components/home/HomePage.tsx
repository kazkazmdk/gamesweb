"use client";

import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameArt } from "@/components/game/GameArt";
import { GameModeSelector, QuickAction } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { focusedGameContext } from "@/lib/platform/focus";
import { formatLevel } from "@/lib/platform/format";
import { boardModeFromPlayIndex, loadPlayIndex, playModeOptions, savePlayIndex } from "@/lib/platform/modes";

export default function HomePage() {
  const player = usePlayer();
  const store = useStore();
  const router = useRouter();
  const [focus, setFocus] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const game = GAME_MANIFESTS[focus] ?? GAME_MANIFESTS[0];
  useAccent(game.accent);
  const lv = levelFromXp(player.xp);
  const reduced = player.settings.reducedMotion;

  useEffect(() => {
    setPlayIndex(loadPlayIndex(game.id));
  }, [game.id]);

  const board = store.leaderboard(game.id, boardModeFromPlayIndex(game.id, playIndex));
  const ctx = useMemo(
    () => focusedGameContext(player, game, playIndex, board),
    [player, game, playIndex, board],
  );

  useEffect(() => {
    void store.ensureBoard(game.id, ctx.boardMode);
  }, [store, game.id, ctx.boardMode]);

  const setFocusSafe = useCallback(
    (index: number) => {
      const next = (index + GAME_MANIFESTS.length) % GAME_MANIFESTS.length;
      setFocus(next);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable) return;
      if (document.querySelector('[role="dialog"][aria-label="Search"]')) return;
      if (el.closest('[role="tablist"]')) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocusSafe(focus + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusSafe(focus - 1);
      }
      if (e.key === "Enter") {
        if (el.closest("a,button")) return;
        e.preventDefault();
        router.push(`/play/${game.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, game.slug, router, setFocusSafe]);

  const onlineFriends = player.friends.filter((f) => f.status === "accepted" && f.presence !== "offline").length;
  const modes = playModeOptions(game.id);
  const next = GAME_MANIFESTS[(focus + 1) % GAME_MANIFESTS.length];

  return (
    <div className="relative min-h-[calc(100dvh-var(--header-h))] md:min-h-[calc(100dvh-var(--header-h))]" data-testid="games-home">
      <div className={`absolute inset-0 overflow-hidden ${reduced ? "" : "transition-opacity duration-[280ms]"}`}>
        <GameArt slug={game.slug} variant="backdrop" className="absolute inset-0 h-full w-full" />
        {next && next.id !== game.id ? (
          <div className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
            <GameArt slug={next.slug} variant="backdrop" className="h-full w-full" />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_42%,transparent)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-[color-mix(in_srgb,var(--bg)_35%,transparent)] md:to-transparent" />
      </div>

      <div className="relative flex min-h-[calc(100dvh-var(--header-h))] flex-col px-5 pb-8 pt-4 md:px-10 md:pb-12">
        <div className="flex items-center justify-between gap-4 text-[12px] text-white/60">
          <p>
            {formatLevel(lv.level)}
            {player.streak > 0 ? ` · ${player.streak}d streak` : ""}
            {onlineFriends > 0 ? ` · ${onlineFriends} online` : ""}
          </p>
        </div>

        <div
          className="mt-5 flex items-end gap-3 overflow-x-auto pb-2 scrollbar-none md:mt-6"
          role="listbox"
          aria-label="Games"
          onTouchStart={(e) => {
            const x = e.changedTouches[0]?.clientX ?? 0;
            (e.currentTarget as HTMLElement).dataset.x = String(x);
          }}
          onTouchEnd={(e) => {
            const start = Number((e.currentTarget as HTMLElement).dataset.x ?? 0);
            const x = e.changedTouches[0]?.clientX ?? start;
            const dx = x - start;
            if (dx < -40) setFocusSafe(focus + 1);
            if (dx > 40) setFocusSafe(focus - 1);
          }}
        >
          {GAME_MANIFESTS.map((g, i) => {
            const on = i === focus;
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => setFocus(i)}
                className={`relative shrink-0 overflow-hidden rounded-sm transition-[width,opacity,transform] ${
                  reduced ? "" : "duration-300"
                } ${on ? "w-[168px] md:w-[200px] opacity-100" : "w-[96px] md:w-[112px] opacity-55"}`}
              >
                <span className="block aspect-[16/10]">
                  <GameArt slug={g.slug} variant="tile" className="h-full w-full" />
                </span>
                <span className={`mt-2 block text-left text-[12px] ${on ? "text-white" : "text-white/55"}`}>{g.title}</span>
              </button>
            );
          })}
        </div>

        <div className={`mt-auto max-w-xl pt-8 md:pt-10 ${reduced ? "" : "transition-all duration-300"}`}>
          <p className="meta text-white/55">{game.genre}</p>
          <h1 className="display mt-3 text-[56px] text-white md:text-[88px]">{game.title}</h1>
          <p className="mt-3 max-w-md text-[16px] text-white/75">{game.tagline}</p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
            <Metric label="PB" value={ctx.pbLabel ?? "—"} />
            <Metric label="Mode" value={ctx.modeLabel} />
            {ctx.friendBest?.scoreLabel ? (
              <Metric label="Friend best" value={`${ctx.friendBest.name} ${ctx.friendBest.scoreLabel}`} />
            ) : null}
            {ctx.daily ? (
              <Metric label="Daily" value={`${ctx.daily.current} / ${ctx.daily.target}`} />
            ) : null}
          </dl>

          <div className="mt-6 max-w-lg">
            <GameModeSelector
              label={game.id === "neon-drift" ? "Track" : game.id === "velocity-run" ? "Course" : "Mode"}
              options={modes}
              value={String(playIndex)}
              onChange={(id) => {
                const index = Number(id);
                setPlayIndex(index);
                savePlayIndex(game.id, index);
              }}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuickAction href={`/play/${game.slug}`}>{ctx.playLabel}</QuickAction>
            <QuickAction href={`/games/${game.slug}`} tone="quiet">
              Game Hub
            </QuickAction>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="meta text-white/45">{label}</dt>
      <dd className="stat mt-1 text-[28px] text-white md:text-[36px]">{value}</dd>
    </div>
  );
}
