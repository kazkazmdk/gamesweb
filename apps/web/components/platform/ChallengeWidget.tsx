"use client";

import { GameArt } from "@/components/game/GameArt";
import type { ChallengeView } from "@/lib/platform/adapters";
import { ProgressWidget } from "./ProgressWidget";
import { QuickAction } from "./QuickAction";

export function ChallengeWidget({
  view,
  variant = "full",
}: {
  view: ChallengeView;
  variant?: "compact" | "full";
}) {
  const done = view.done;
  const href = view.slug ? `/play/${view.slug}` : "/";
  const featured = variant === "full";

  return (
    <article className={`relative overflow-hidden ${featured ? "min-h-[240px]" : "min-h-[132px]"}`}>
      {view.slug ? (
        <div className="absolute inset-0">
          <GameArt slug={view.slug} variant={featured ? "hero" : "tile"} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
        </div>
      ) : null}
      <div className="relative flex h-full flex-col justify-between p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="meta text-white/65">{done ? "Complete" : view.gameTitle ?? "Daily"}</p>
          <p className="text-[12px] text-[var(--accent)]">{done ? "Claimed" : `+${view.quest.xp} XP`}</p>
        </div>
        <div>
          <h3 className={`text-white ${featured ? "display mt-6 text-[32px]" : "mt-3 text-[20px] tracking-[-0.03em]"}`}>
            {view.quest.title}
          </h3>
          {featured ? <p className="mt-1 max-w-md text-[13px] text-white/65">{view.quest.description}</p> : null}
          <div className="mt-4 max-w-sm">
            <p className="stat text-[24px] text-white">
              {view.currentLabel}
              <span className="ml-2 text-[12px] font-normal text-white/45">/ {view.targetLabel}</span>
            </p>
            <ProgressWidget value={view.progress} max={view.quest.target} size="sm" />
          </div>
          <div className="mt-4">
            {done ? <p className="text-[13px] text-[var(--ok)]">Reward claimed</p> : <QuickAction href={href}>{view.gameTitle ? `Play ${view.gameTitle}` : "Play"}</QuickAction>}
          </div>
        </div>
      </div>
    </article>
  );
}
