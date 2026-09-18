"use client";

import { analytics } from "@gamesweb/analytics";
import { useEffect, useRef } from "react";
import type { GameManifest } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";
import { Avatar } from "@/components/shell/AppShell";
import { homeStage } from "./home-stage";

export type RailMark = "challenge" | "daily" | "continue" | "new" | null;
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
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-black/75 to-transparent md:w-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black/75 to-transparent md:w-14" />
      <div
        ref={scroller}
        role="listbox"
        aria-label="Games"
        className="scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 pt-1 md:gap-3 max-md:snap-start"
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
                reduced ? "" : "transition-[width,opacity] duration-[320ms] ease-[var(--ease-out)]"
              } ${on ? "w-[min(70vw,21rem)] opacity-100 md:w-[22rem]" : "w-[9.75rem] opacity-80 hover:opacity-100 md:w-[11.5rem]"}`}
              style={{ aspectRatio: on ? "16 / 9" : "16 / 10" }}
            >
              <GameArt
                slug={g.slug}
                variant="tile"
                position={dir.tile}
                className={`h-full w-full brightness-110 ${reduced ? "" : "transition-transform duration-300 group-hover:scale-[1.03]"}`}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/15 to-transparent" />
              {on ? <span className="home-select-frame absolute inset-0" aria-hidden /> : null}
              {live.length ? (
                <span className="absolute right-2 top-2 flex -space-x-1.5">
                  {live.map((p) => (
                    <Avatar key={p.avatar + p.name} id={p.avatar} size={22} />
                  ))}
                </span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 p-2.5 md:p-3">
                {mark ? <span className="meta mb-1 block text-[10px] text-[var(--accent)]">{railCopy(mark)}</span> : null}
                <span className={`display block text-white ${on ? "text-[22px] md:text-[28px]" : "text-[14px] md:text-[16px]"}`}>
                  {on ? g.title : shortTitle(g.title)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function shortTitle(title: string) {
  return title.split(" ")[0] ?? title;
}

function railCopy(mark: Exclude<RailMark, null>) {
  if (mark === "challenge") return "Challenge";
  if (mark === "daily") return "Daily";
  if (mark === "continue") return "Continue";
  return "New";
}
