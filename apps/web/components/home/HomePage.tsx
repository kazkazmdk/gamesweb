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

  const setFocusSafe = useCallback((index: number) => {
    const next = (index + GAME_MANIFESTS.length) % GAME_MANIFESTS.length;
    setFocus(next);
  }, []);

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
  const fade = reduced ? "" : "duration-300";

  return (
    <div className="relative md:min-h-[calc(100dvh-var(--header-h))]" data-testid="games-home">
      <div
        className={`relative h-[42vh] overflow-hidden md:absolute md:inset-0 md:h-auto ${reduced ? "" : "transition-opacity duration-[280ms]"}`}
      >
        <GameArt slug={game.slug} variant="backdrop" className="absolute inset-0 h-full w-full" />
        {next && next.id !== game.id ? (
          <div className="pointer-events-none absolute inset-0 opacity-0" aria-hidden>
            <GameArt slug={next.slug} variant="backdrop" className="h-full w-full" />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_18%,transparent)] to-transparent md:bg-gradient-to-r md:from-[var(--bg)] md:via-[color-mix(in_srgb,var(--bg)_42%,transparent)] md:to-transparent" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[var(--bg)] via-transparent to-[color-mix(in_srgb,var(--bg)_35%,transparent)] md:block md:to-transparent" />
      </div>

      <div className="relative flex flex-col px-5 pb-8 pt-4 md:min-h-[calc(100dvh-var(--header-h))] md:px-10 md:pb-12">
        <div className="flex items-center justify-between gap-4 text-[12px] text-white/60">
          <p>
            {formatLevel(lv.level)}
            {player.streak > 0 ? ` · ${player.streak}d streak` : ""}
            {onlineFriends > 0 ? ` · ${onlineFriends} online` : ""}
          </p>
        </div>

        <div className={`mt-6 max-w-xl md:order-2 md:mt-auto md:pt-10 ${reduced ? "" : "transition-all duration-300"}`}>
          <p className="meta text-white/55">{game.genre}</p>
          <h1 className="display mt-2 text-[44px] text-white md:mt-3 md:text-[88px]">{game.title}</h1>
          <p className="mt-2 max-w-md text-[15px] text-white/75 md:mt-3 md:text-[16px]">{game.tagline}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8">
            <QuickAction href={`/play/${game.slug}`}>{ctx.playLabel}</QuickAction>
            <QuickAction href={`/games/${game.slug}`} tone="quiet">
              Game Hub
            </QuickAction>
          </div>
        </div>

        <div
          className={`mt-5 flex items-end gap-3 overflow-x-auto pb-3 scrollbar-none md:order-1 md:mt-6 ${fade}`}
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

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 md:order-3 md:mt-8 md:gap-y-5">
          <Metric label="PB" value={ctx.pbLabel ?? "—"} />
          <Metric label="Mode" value={ctx.modeLabel} />
          {ctx.friendBest?.scoreLabel ? (
            <Metric label="Friend best" value={`${ctx.friendBest.name} ${ctx.friendBest.scoreLabel}`} />
          ) : null}
          {ctx.daily ? <Metric label="Daily" value={`${ctx.daily.current} / ${ctx.daily.target}`} /> : null}
        </dl>

        <div className="mt-5 hidden max-w-lg md:order-4 md:block">
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
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="meta text-white/45">{label}</dt>
      <dd className="stat mt-1 text-[24px] text-white md:text-[36px]">{value}</dd>
    </div>
  );
}
