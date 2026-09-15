"use client";

import { GameArt } from "@/components/game/GameArt";
import type { ChallengeView } from "@/lib/platform/adapters";
import { ProgressWidget } from "./ProgressWidget";
import { QuickAction } from "./QuickAction";
import { StatusPill } from "./StatusPill";

export function ChallengeWidget({
  view,
  variant = "full",
}: {
  view: ChallengeView;
  variant?: "compact" | "full";
}) {
  const done = view.done;
  const href = view.slug ? `/play/${view.slug}` : "/";
  const tone = done ? "completed" : variant;

  return (
    <article className={done ? "gw-complete relative overflow-hidden" : "relative overflow-hidden"}>
      {tone === "full" && view.slug ? (
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <GameArt slug={view.slug} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[var(--bg)]/70" />
        </div>
      ) : null}
      <div className="relative py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="meta">{done ? "Completed" : view.gameTitle ?? "Daily"}</p>
          {done ? <StatusPill kind="complete" /> : <p className="meta">+{view.quest.xp} XP</p>}
        </div>
        <h3 className="display mt-2 text-[26px] md:text-[32px]">{view.quest.title}</h3>
        {variant === "full" ? (
          <p className="mt-1 max-w-md text-[13px] text-[var(--text-dim)]">{view.quest.description}</p>
        ) : null}
        <p className="stat mt-4 text-[28px] md:text-[36px]">
          {view.currentLabel}
          <span className="ml-2 text-[13px] font-normal text-[var(--text-faint)]">/ {view.targetLabel}</span>
        </p>
        <div className="mt-3">
          <ProgressWidget value={view.progress} max={view.quest.target} size={variant === "full" ? "md" : "sm"} />
        </div>
        <div className="mt-4">
          {done ? (
            <p className="text-[13px] text-[var(--ok)]">Reward claimed</p>
          ) : (
            <QuickAction href={href}>{view.gameTitle ? `Play ${view.gameTitle}` : "Play"}</QuickAction>
          )}
        </div>
      </div>
    </article>
  );
}
