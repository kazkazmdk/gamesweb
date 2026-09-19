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
            <span className="mb-2 block text-[12px] text-white/50">{step.kicker}</span>
            <span
              className={`gw-route-art relative block overflow-hidden ${current ? "h-40 md:h-48" : "h-24 md:h-28"} ${done ? "is-done" : ""} ${locked ? "is-locked" : ""}`}
            >
              <GameArt slug={step.slug} variant="tile" position={dir.tile} className="h-full w-full" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" aria-hidden />
              <span className={`${current ? "gw-frame" : "gw-ticks"} pointer-events-none absolute inset-0`} aria-hidden />
              {done ? <span className="gw-route-flag">Cleared</span> : null}
              {locked ? <span className="gw-route-flag is-locked">Locked</span> : null}
              {current ? <span className="gw-route-live" aria-hidden /> : null}
            </span>
            <span className={`mt-2 block ${current ? "display text-[22px] text-white md:text-[28px]" : "text-[13px] text-white/80"}`}>
              {homeGameLabel(step.slug, step.title)}
            </span>
            {step.meta ? <span className="mt-1 block text-[12px] text-white/50">{step.meta}</span> : null}
          </>
        );
        return (
          <li key={step.key} className={`gw-route-step ${current ? "is-current" : ""}`}>
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
