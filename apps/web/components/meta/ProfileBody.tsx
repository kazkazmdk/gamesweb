"use client";

import { GAME_MANIFESTS, PLATFORM_ACHIEVEMENTS } from "@gamesweb/game-sdk";
import { levelFromXp } from "@gamesweb/config";
import { Avatar } from "@/components/shell/AppShell";
import { usePlayer, useStore } from "@/lib/player";
import { formatScore } from "@/lib/player-store";

export function ProfileBody({ self, username }: { self?: boolean; username?: string }) {
  const player = usePlayer();
  const store = useStore();
  const lv = levelFromXp(player.xp);
  const pct = Math.round((lv.intoLevel / Math.max(1, lv.needed)) * 100);
  if (!self && username && username !== player.username) {
    return (
      <div className="px-5 py-10 md:px-10">
        <h1 className="display text-[48px]">{username}</h1>
        <p className="mt-2 text-[14px] text-[var(--text-dim)]">Public profile appears when they play on this arcade.</p>
      </div>
    );
  }
  return (
    <div className="px-5 py-8 md:px-10">
      <div className="flex items-center gap-4">
        <Avatar id={player.avatar} size={64} />
        <div>
          <h1 className="display text-[40px]">{player.displayName}</h1>
          <p className="text-[13px] text-[var(--text-dim)]">
            @{player.username} · {player.isGuest ? "guest" : "account"} · {player.streak}d streak
          </p>
        </div>
      </div>
      <p className="mt-6 text-[14px]">
        Level {lv.level}
        <span className="ml-2 text-[var(--text-dim)]">
          {lv.intoLevel} / {lv.needed} XP
        </span>
      </p>
      <div className="mt-2 h-1 max-w-md overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>

      <h2 className="mt-10 text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Records</h2>
      <ul className="mt-3 grid gap-2 md:grid-cols-3">
        {GAME_MANIFESTS.map((g) => {
          const mode = g.id === "velocity-run" ? "course-1" : g.id === "swarm-protocol" ? "survival" : "circuit";
          const pb = store.personalBest(g.id, mode, g.id === "velocity-run");
          return (
            <li key={g.id} className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="text-[12px] text-[var(--text-faint)]">{g.title}</p>
              <p className="mt-1 text-[18px]">{Number.isFinite(pb) && pb > 0 && pb < 1e12 ? formatScore(g.id, pb) : "—"}</p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Achievements</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {PLATFORM_ACHIEVEMENTS.map((a) => {
          const on = player.achievements.includes(`platform:${a.key}`);
          return (
            <li key={a.key} className="rounded-xl border border-[var(--line)] px-3 py-3">
              <p className={on ? "" : "text-[var(--text-dim)]"}>{a.name}</p>
              <p className="text-[12px] text-[var(--text-faint)]">{a.description}</p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-[13px] uppercase tracking-[0.18em] text-[var(--text-faint)]">History</h2>
      {player.history.length ? (
        <ul className="mt-3 max-w-lg space-y-2 text-[14px]">
          {player.history.slice(0, 12).map((h) => (
            <li key={h.at} className="flex justify-between text-[var(--text-dim)]">
              <span>{GAME_MANIFESTS.find((g) => g.id === h.gameId)?.title}</span>
              <span>{formatScore(h.gameId, h.score)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[14px] text-[var(--text-dim)]">Pick your first game.</p>
      )}
    </div>
  );
}
