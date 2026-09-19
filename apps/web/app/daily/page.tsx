"use client";

import { dailyArcadeEvents, getManifest, utcDayKey } from "@gamesweb/game-sdk";
import { useArcade } from "@/lib/social/use-arcade";
import { EventRoute, GameBackdrop, useUtcCountdown } from "@/components/visual";
import { ChamferButton } from "@/components/visual/ChamferButton";
import { useAccent } from "@/components/shell/AppShell";

export default function DailyArcadePage() {
  const day = utcDayKey();
  const events = dailyArcadeEvents(day);
  const arcade = useArcade();
  const progress = arcade.daily.day === day ? arcade.daily : { completed: [], score: 0, day };
  const { label: countdown } = useUtcCountdown();
  const steps = events.map((e) => {
    const game = getManifest(e.gameId);
    const done = progress.completed.includes(`${e.gameId}:${e.mode}`);
    return {
      event: e,
      game,
      done,
      href: `/play/${e.gameId}?daily=1&seed=${encodeURIComponent(e.seed)}`,
    };
  });
  const current = steps.find((s) => !s.done) ?? steps[steps.length - 1];
  const doneCount = steps.filter((s) => s.done).length;
  const cleared = doneCount === steps.length && steps.length > 0;
  useAccent(current?.game?.accent);

  return (
    <div data-testid="daily-arcade">
      <GameBackdrop slug={current?.game?.slug ?? "neon-drift"} className="min-h-[100svh]" dim={0.18} priority>
        <div className="flex min-h-[40vh] flex-col justify-end px-5 pb-6 pt-20 md:min-h-[42vh] md:px-10">
          <h1 className="display mt-3 max-w-[12ch] text-[52px] text-white md:text-[84px]">
            {cleared ? "Cleared" : current?.game?.title ?? "Daily Arcade"}
          </h1>
          <p className="mt-4 max-w-md text-[15px] text-white/70">
            Same run for everyone today. {doneCount}/{steps.length} stages · {countdown} to reset
          </p>
          {progress.score > 0 ? <p className="metric mt-3 text-[28px] text-white/90">{progress.score} pts</p> : null}
          {current?.game ? (
            <div className="mt-7">
              <ChamferButton href={current.href}>{cleared ? "Replay stage" : doneCount ? "Continue" : "Enter stage"}</ChamferButton>
            </div>
          ) : null}
        </div>
        <section className="px-5 pb-10 md:px-10">
          <div className="mt-2">
            <EventRoute
              steps={steps.map((s, i) => ({
                key: `${s.event.gameId}:${s.event.mode}`,
                index: i,
                slug: s.game?.slug ?? s.event.gameId,
                title: s.game?.title ?? s.event.label,
                kicker: s.done ? "Cleared" : s === current && !cleared ? "Now" : `Stage ${i + 1}`,
                meta: s.event.mode.replace(/-/g, " "),
                status: s.done ? "done" : s === current ? "current" : "open",
                href: s.href,
              }))}
            />
          </div>
        </section>
      </GameBackdrop>
    </div>
  );
}
