"use client";

import { analytics } from "@gamesweb/analytics";
import { useEffect, useRef } from "react";
import type { GameManifest } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";
import { Avatar } from "@/components/shell/AppShell";
import { homeStage } from "./home-stage";

export type RailMark = "challenge" | "daily" | "continue" | null;
export type RailPresence = Array<{ name: string; avatar: string }>;

export function GameRail({
  games,
  focus,
  marks,
  presence,
  reduced,
  onFocus,
  onPlay,
}: {
  games: GameManifest[];
  focus: number;
  marks: RailMark[];
  presence: RailPresence[];
  reduced: boolean;
  onFocus: (index: number) => void;
  onPlay: (index: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);

  useEffect(() => {
    const root = scroller.current;
    const tile = root?.querySelector<HTMLElement>(`[data-rail-index="${focus}"]`);
    if (!root || !tile) return;
    const quiet =
      reduced ||
      document.documentElement.classList.contains("reduce-motion") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const align = () => {
      const inset = window.innerWidth < 768 ? 4 : Math.max(0, (root.clientWidth - tile.offsetWidth) / 2);
      root.scrollTo({ left: Math.max(0, tile.offsetLeft - inset), behavior: quiet ? "auto" : "smooth" });
    };
    align();
    const id = window.setTimeout(align, quiet ? 0 : 340);
    return () => window.clearTimeout(id);
  }, [focus, reduced]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-black/70 to-transparent md:w-8" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-7 bg-gradient-to-l from-black/70 to-transparent md:w-12" />
      <div
        ref={scroller}
        role="listbox"
        aria-label="Games"
        className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-1 md:gap-2.5 max-md:snap-start"
        onScroll={() => {
          if (scrolled.current) return;
          scrolled.current = true;
          analytics.track("home_rail_scrolled", { focus });
        }}
      >
        {games.map((g, i) => {
          const on = i === focus;
          const mark = marks[i];
          const live = presence[i] ?? [];
          const dir = homeStage(g.slug);
          return (
            <button
              key={g.id}
              type="button"
              role="option"
              data-rail-index={i}
              aria-selected={on}
              aria-label={g.title}
              onClick={() => (on ? onPlay(i) : onFocus(i))}
              className={`group relative shrink-0 snap-start overflow-hidden text-left md:snap-center ${
                reduced ? "" : "transition-[width,opacity,transform] duration-[300ms] ease-[var(--ease-out)]"
              } ${on ? "w-[min(58vw,17.75rem)] opacity-100 md:w-[18rem]" : "w-[10.5rem] opacity-[0.78] hover:opacity-100 md:w-[11.25rem]"}`}
              style={{ aspectRatio: on ? "16 / 9" : "16 / 10" }}
            >
              <GameArt
                slug={g.slug}
                variant="tile"
                position={dir.tile}
                className={`h-full w-full brightness-110 ${
                  reduced ? "" : `transition-transform duration-300 ${on ? "scale-[1.04]" : "group-hover:scale-[1.03]"}`
                }`}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/10 to-transparent" />
              {on ? <span className="home-select-frame absolute inset-0" aria-hidden /> : null}
              <span className="home-rail-index" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              {mark === "daily" ? <span className="home-daily-dot" aria-hidden title="Daily" /> : null}
              {mark === "challenge" ? <span className="home-rail-vs">VS</span> : null}
              {mark === "continue" ? <span className="home-rail-continue" aria-hidden /> : null}
              {live.length ? (
                <span className="absolute right-2 top-2 flex -space-x-1.5">
                  {live.map((p) => (
                    <Avatar key={p.avatar + p.name} id={p.avatar} size={20} />
                  ))}
                </span>
              ) : null}
              {!on ? (
                <span className="absolute inset-x-0 bottom-0 p-2 md:p-2.5">
                  <span className="display block text-[13px] leading-[1.08] text-white md:text-[15px]">{g.title}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
