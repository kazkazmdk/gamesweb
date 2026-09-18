"use client";

import { useEffect, useRef } from "react";
import type { GameManifest } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";

export type RailMark = "challenge" | "daily" | "continue" | "new" | null;

export function GameRail({
  games,
  focus,
  marks,
  reduced,
  onFocus,
  onPlay,
}: {
  games: GameManifest[];
  focus: number;
  marks: RailMark[];
  reduced: boolean;
  onFocus: (index: number) => void;
  onPlay: (index: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scroller.current;
    const tile = root?.querySelector<HTMLElement>(`[data-rail-index="${focus}"]`);
    tile?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [focus, reduced]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black/70 to-transparent md:w-12" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/70 to-transparent md:w-16" />
      <div
        ref={scroller}
        role="listbox"
        aria-label="Games"
        className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-1 md:gap-3"
      >
        {games.map((g, i) => {
          const on = i === focus;
          const mark = marks[i];
          return (
            <button
              key={g.id}
              type="button"
              role="option"
              data-rail-index={i}
              aria-selected={on}
              aria-label={g.title}
              onClick={() => (on ? onPlay(i) : onFocus(i))}
              className={`group relative shrink-0 snap-center overflow-hidden text-left ${
                reduced ? "" : "transition-[width,box-shadow,opacity] duration-[320ms] ease-[var(--ease-out)]"
              } ${on ? "w-[min(72vw,17.5rem)] opacity-100 md:w-[20rem]" : "w-[7.25rem] opacity-75 hover:opacity-95 md:w-[8.5rem]"}`}
              style={{ aspectRatio: on ? "16 / 9" : "4 / 5" }}
            >
              <GameArt
                slug={g.slug}
                variant="tile"
                className={`h-full w-full ${reduced ? "" : "transition-transform duration-300 group-hover:scale-[1.03]"}`}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              {on ? (
                <span className="home-select-frame absolute inset-0" aria-hidden />
              ) : (
                <span className="absolute inset-y-2 left-0 w-0.5 bg-white/0 group-hover:bg-white/35" aria-hidden />
              )}
              <span className="absolute inset-x-0 bottom-0 p-2.5 md:p-3">
                {mark ? <span className="meta mb-1 block text-[10px] text-[var(--accent)]">{railCopy(mark)}</span> : null}
                <span className={`display block text-white ${on ? "text-[20px] md:text-[26px]" : "text-[13px] md:text-[15px]"}`}>
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
