import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";
import { homeGameLabel, homeStage } from "@/components/home/home-stage";

export type EventRouteStep = {
  key: string;
  index: number;
  slug: string;
  title: string;
  kicker: string;
  meta?: string;
  status: "done" | "current" | "locked" | "open";
  href?: string;
};

export function EventRoute({
  steps,
  cols,
}: {
  steps: EventRouteStep[];
  cols?: number;
}) {
  return (
    <ol className="gw-route" style={{ ["--gw-route-cols" as string]: String(cols ?? steps.length) }} aria-label="Event route">
      {steps.map((step) => {
        const dir = homeStage(step.slug);
        const current = step.status === "current";
        const done = step.status === "done";
        const locked = step.status === "locked";
        const inner = (
          <>
            <span className="meta mb-2 block text-white/40">{step.kicker}</span>
            <span
              className={`relative block overflow-hidden ${current ? "h-36 md:h-44" : "h-20 md:h-24"} ${done ? "opacity-70" : ""} ${locked ? "opacity-40" : ""}`}
            >
              <GameArt slug={step.slug} variant="tile" position={dir.tile} className="h-full w-full" />
              <span className={`${current ? "gw-frame" : "gw-ticks"} pointer-events-none absolute inset-0`} aria-hidden />
              {done ? (
                <span className="absolute inset-x-3 bottom-2 text-[10px] tracking-[0.16em] text-[var(--accent)]">CLEARED</span>
              ) : null}
              {locked ? (
                <span className="absolute inset-x-3 bottom-2 text-[10px] tracking-[0.16em] text-white/50">LOCKED</span>
              ) : null}
            </span>
            <span className={`mt-2 block ${current ? "display text-[22px] text-white md:text-[28px]" : "text-[13px] text-white/80"}`}>
              {homeGameLabel(step.slug, step.title)}
            </span>
            {step.meta ? <span className="mt-1 block text-[12px] text-white/50">{step.meta}</span> : null}
          </>
        );
        return (
          <li key={step.key} className={`gw-route-step ${current ? "gw-frame bg-black/25 p-3" : "p-1"}`}>
            {step.href && !locked ? (
              <Link href={step.href} className="block">
                {inner}
              </Link>
            ) : (
              <div>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
