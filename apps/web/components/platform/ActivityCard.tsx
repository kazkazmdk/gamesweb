import type { ReactNode } from "react";
import { GameArt } from "@/components/game/GameArt";
import { QuickAction } from "./QuickAction";
import { ProgressWidget } from "./ProgressWidget";

export function ActivityCard({
  slug,
  kicker,
  title,
  meta,
  progress,
  target,
  reward,
  href,
  cta = "Play",
  featured,
}: {
  slug: string;
  kicker: string;
  title: string;
  meta?: string;
  progress?: number;
  target?: number;
  reward?: string;
  href: string;
  cta?: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`gw-interactive group relative isolate min-h-[220px] overflow-hidden ${featured ? "md:min-h-[280px]" : ""}`}
    >
      <div className="absolute inset-0">
        <GameArt slug={slug} variant={featured ? "hero" : "tile"} className="h-full w-full origin-center transition-[transform,filter] duration-[var(--motion-standard)] ease-[var(--ease-out)] group-hover:scale-[1.04] group-hover:brightness-110 group-focus-within:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      </div>
      <div className="relative flex h-full min-h-[220px] flex-col justify-end p-5">
        <p className="meta text-white/70">{kicker}</p>
        <h3 className={`mt-1 text-white ${featured ? "display text-[32px] md:text-[40px]" : "text-[20px] tracking-[-0.03em]"}`}>
          {title}
        </h3>
        {meta ? <p className="mt-1 text-[13px] text-white/70">{meta}</p> : null}
        {progress !== undefined && target !== undefined ? (
          <div className="mt-3 max-w-xs">
            <p className="stat text-[22px] text-white">
              {progress}
              <span className="ml-1 text-[12px] font-normal text-white/50">/ {target}</span>
            </p>
            <ProgressWidget value={progress} max={target} size="sm" />
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[12px] text-white/70">{reward}</span>
          <QuickAction href={href}>{cta}</QuickAction>
        </div>
      </div>
    </article>
  );
}

export function ActivityRail({ children }: { children: ReactNode }) {
  return <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none md:grid md:grid-cols-3 md:overflow-visible">{children}</div>;
}
