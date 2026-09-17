"use client";

import { dailyArcadeEvents, getManifest, utcDayKey } from "@gamesweb/game-sdk";
import { useArcade } from "@/lib/social/use-arcade";
import Link from "next/link";

export default function DailyArcadePage() {
  const day = utcDayKey();
  const events = dailyArcadeEvents(day);
  const arcade = useArcade();
  const progress = arcade.daily.day === day ? arcade.daily : { completed: [], score: 0, day };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10" data-testid="daily-arcade">
      <p className="meta text-white/45">Daily Arcade</p>
      <h1 className="display mt-2 text-4xl">Same seeds. Everyone.</h1>
      <p className="mt-3 text-white/60">Normalized score across different units. Friends and rivals boards share this rotation.</p>
      <p className="mt-4 text-[13px] text-white/45">Today {progress.score} pts · {progress.completed.length}/{events.length} done</p>
      <ul className="mt-8 space-y-3">
        {events.map((e) => {
          const game = getManifest(e.gameId);
          const done = progress.completed.includes(`${e.gameId}:${e.mode}`);
          return (
            <li key={`${e.gameId}:${e.mode}`} className="rounded-2xl border border-white/10 p-4">
              <p className="text-[13px] text-white/45">Event {e.index + 1}</p>
              <p className="mt-1 text-xl">{game?.title}</p>
              <p className="text-white/55">{e.mode} · seed {e.seed.slice(-8)}</p>
              <Link
                href={`/play/${e.gameId}?daily=1&seed=${encodeURIComponent(e.seed)}`}
                className="mt-3 inline-block rounded-full bg-[var(--accent)] px-4 py-2 text-[#140d12]"
              >
                {done ? "Replay" : "Play"}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
