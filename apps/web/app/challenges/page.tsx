"use client";

import { dailyQuests, getManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { usePlayer } from "@/lib/player";

export default function ChallengesPage() {
  const player = usePlayer();
  const quests = dailyQuests(player.dayKey);
  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Challenges</h1>
      <p className="mt-2 text-[15px] text-[var(--text-dim)]">Three a day. No ads. XP when you close them.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {quests.map((q) => {
          const game = q.gameId ? getManifest(q.gameId) : null;
          const progress = player.questProgress[q.id] ?? 0;
          const done = player.questCompleted.includes(q.id);
          return (
            <Link
              key={q.id}
              href={game ? `/play/${game.slug}` : "/play"}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                {done ? "Complete" : "Daily"} · {q.xp} XP
              </p>
              <p className="mt-3 text-[20px]">{q.title}</p>
              <p className="mt-2 text-[14px] text-[var(--text-dim)]">{q.description}</p>
              <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (progress / q.target) * 100)}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
