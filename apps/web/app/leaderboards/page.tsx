"use client";

import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { useStore } from "@/lib/player";
import { formatScore } from "@/lib/player-store";

export default function LeaderboardsPage() {
  const store = useStore();
  return (
    <div className="px-5 py-8 md:px-10">
      <h1 className="display text-[44px] md:text-[64px]">Leaderboards</h1>
      <p className="mt-2 text-[15px] text-[var(--text-dim)]">Verified when the run looks human. Flagged stays off the board.</p>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {GAME_MANIFESTS.map((g) => {
          const mode = g.id === "velocity-run" ? "course-1" : g.id === "swarm-protocol" ? "survival" : "circuit";
          const rows = store.leaderboard(g.id, mode);
          return (
            <section key={g.id}>
              <h2 className="text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">{g.title}</h2>
              {rows.length ? (
                <ol className="mt-3 space-y-2">
                  {rows.map((r, i) => (
                    <li key={r.name} className="flex justify-between rounded-xl bg-[var(--surface)] px-3 py-2 text-[14px]">
                      <span>
                        {i + 1} {r.name}
                        {r.isYou ? " · you" : ""}
                      </span>
                      <span className="text-[var(--text-dim)]">{formatScore(g.id, r.score)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-[14px] text-[var(--text-dim)]">Be the first to set the pace.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
