import type { ReactNode } from "react";
import { GameArt } from "@/components/game/GameArt";

export function PlatformHero({
  slug,
  kicker,
  title,
  tagline,
  context,
  metrics,
  actions,
  minHeight = "home",
}: {
  slug: string;
  kicker?: string;
  title: string;
  tagline?: string;
  context?: ReactNode;
  metrics?: string;
  actions?: ReactNode;
  minHeight?: "home" | "play" | "hub";
}) {
  const height =
    minHeight === "play"
      ? "min-h-[40vh] md:min-h-[58vh]"
      : minHeight === "hub"
        ? "min-h-[52vh] md:min-h-[70vh]"
        : "min-h-[52vh] md:min-h-[86vh]";
  return (
    <section className={`relative overflow-hidden ${height}`}>
      <GameArt slug={slug} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_55%,transparent)] to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
      <div className={`relative flex ${height} flex-col justify-end px-5 pb-10 pt-10 md:px-10 md:pb-16`}>
        {kicker ? <p className="meta text-white/55">{kicker}</p> : null}
        {context}
        <h1 className="display mt-4 max-w-[16ch] text-[40px] md:text-[56px]">{title}</h1>
        {tagline ? <p className="mt-3 max-w-md text-[16px] text-white/75">{tagline}</p> : null}
        {metrics ? <p className="mt-4 text-[13px] text-white/55">{metrics}</p> : null}
        {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
