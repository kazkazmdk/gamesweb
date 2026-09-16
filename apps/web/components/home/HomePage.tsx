"use client";

import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameArt } from "@/components/game/GameArt";
import { ActivityCard, ActivityRail, QuickAction } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { focusedGameContext } from "@/lib/platform/focus";
import { loadPlayIndex, playModeOptions, savePlayIndex } from "@/lib/platform/modes";

export default function HomePage() {
  const player = usePlayer();
  const store = useStore();
  const router = useRouter();
  const [focus, setFocus] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const [modeOpen, setModeOpen] = useState(false);
  const game = GAME_MANIFESTS[focus] ?? GAME_MANIFESTS[0];
  useAccent(game.accent);
  const lv = levelFromXp(player.xp);
  const reduced = player.settings.reducedMotion;

  useEffect(() => {
    setPlayIndex(loadPlayIndex(game.id));
  }, [game.id]);

  const board = store.leaderboard(game.id, focusedGameContext(player, game, playIndex, []).boardMode);
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

  const modes = playModeOptions(game.id);
  const fade = reduced ? "" : "duration-[320ms] ease-[var(--ease-out)]";
  const line = [ctx.modeLabel, ctx.pbLabel ? `Personal best ${ctx.pbLabel}` : null].filter(Boolean).join(" · ");

  return (
    <div className="relative min-h-dvh" data-testid="games-home">
      <div className={`absolute inset-0 overflow-hidden ${reduced ? "" : "transition-opacity duration-[320ms]"}`}>
        <GameArt
          slug={game.slug}
          variant="backdrop"
          className="absolute inset-0 h-full w-full max-md:scale-125 max-md:object-[62%_38%]"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[min(52%,36rem)] bg-gradient-to-r from-black/70 via-black/28 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      <div className="relative flex min-h-dvh flex-col px-5 pb-28 pt-[calc(var(--header-h)+12px)] md:px-10 md:pb-16">
        <div
          className={`flex items-end gap-3 overflow-x-auto pb-1 scrollbar-none ${fade}`}
          role="listbox"
          aria-label="Games"
        >
          {GAME_MANIFESTS.map((g, i) => {
            const on = i === focus;
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={on}
                aria-label={g.title}
                onClick={() => setFocus(i)}
                className={`relative shrink-0 overflow-hidden transition-[width,height,opacity] ${fade} ${
                  on ? "h-[88px] w-[148px] opacity-100 md:h-[104px] md:w-[188px]" : "h-[64px] w-[72px] opacity-70 md:h-[72px] md:w-[84px]"
                }`}
              >
                <GameArt slug={g.slug} variant="tile" className="h-full w-full" />
                {on ? (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-[11px] text-white">
                    {g.title}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className={`mt-auto max-w-lg pb-6 pt-16 ${reduced ? "" : "transition-all duration-[300ms]"}`}>
          <p className="meta text-white/60">{game.genre}</p>
          <h1 className="display mt-2 text-[40px] text-white md:text-[56px]">{game.title}</h1>
          <p className="mt-2 max-w-sm text-[15px] text-white/72">{game.tagline}</p>
          <div className="mt-6">
            <QuickAction href={`/play/${game.slug}`}>{ctx.playLabel}</QuickAction>
          </div>
          <p className="mt-3 text-[13px] text-white/55">{line || "Set a first record"}</p>
          {modes.length > 1 ? (
            <div className="relative mt-2">
              <button
                type="button"
                className="text-[12px] text-white/45"
                aria-expanded={modeOpen}
                onClick={() => setModeOpen((v) => !v)}
              >
                {modes.find((m) => String(playIndex) === m.id)?.label ?? "Mode"}
              </button>
              {modeOpen ? (
                <div className="absolute left-0 top-7 z-10 min-w-[180px] bg-black/80 py-1" role="listbox">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="option"
                      aria-selected={String(playIndex) === m.id}
                      className={`block min-h-9 w-full px-3 text-left text-[12px] ${
                        String(playIndex) === m.id ? "text-white" : "text-white/50"
                      }`}
                      onClick={() => {
                        setPlayIndex(Number(m.id));
                        savePlayIndex(game.id, Number(m.id));
                        setModeOpen(false);
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <section className="relative px-5 pb-16 md:px-10" aria-label="Activities">
        <p className="meta">Activities</p>
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
                meta={`${lv.level} · set a first record`}
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
                href={`/achievements`}
                cta="Trophies"
                reward=""
              />
            ) : null}
            {ctx.friendBest?.scoreLabel ? (
              <ActivityCard
                slug={game.slug}
                kicker="Friend score"
                title={ctx.friendBest.name}
                meta={ctx.friendBest.scoreLabel}
                href={`/friends`}
                cta="Friends"
              />
            ) : (
              <ActivityCard
                slug={game.slug}
                kicker="Record"
                title={ctx.pbLabel ? ctx.pbLabel : "No record yet"}
                meta={ctx.pbLabel ? ctx.modeLabel : `Set your first ${game.title} score.`}
                href={`/play/${game.slug}`}
                cta="Play"
              />
            )}
          </ActivityRail>
        </div>
      </section>
    </div>
  );
}
