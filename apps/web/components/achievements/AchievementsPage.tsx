"use client";

import { useMemo, useState } from "react";
import { GAME_MANIFESTS, allAchievements } from "@gamesweb/game-sdk";
import { EmptyState, ProgressWidget, StatusPill } from "@/components/platform";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer } from "@/lib/player";
import { achievementCatalog } from "@/lib/platform/focus";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "platform", label: "Platform" },
  ...GAME_MANIFESTS.map((g) => ({ id: g.id, label: g.title })),
];

export function AchievementsPage() {
  useAccent();
  const player = usePlayer();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const catalog = useMemo(() => achievementCatalog(player), [player]);
  const totalXp = allAchievements()
    .filter((a) => player.achievements.includes(`${a.gameId ?? "platform"}:${a.key}`))
    .reduce((n, a) => n + a.xp, 0);
  const filtered = filter === "all" ? catalog : catalog.filter((a) => a.gameId === filter);
  const unlocked = catalog.filter((a) => a.unlocked).length;
  const pct = catalog.length ? Math.round((unlocked / catalog.length) * 100) : 0;
  const recent = catalog.find((a) => a.unlocked);

  return (
    <div className="px-5 py-8 md:px-10">
      <p className="meta">Progression</p>
      <h1 className="display mt-2 text-[44px] md:text-[64px]">Achievements</h1>
      <div className="mt-8 flex flex-wrap items-end gap-10">
        <div>
          <p className="stat text-[56px]">
            {unlocked}
            <span className="ml-2 text-[18px] font-normal text-[var(--text-faint)]">/ {catalog.length}</span>
          </p>
          <p className="meta mt-2">unlocked</p>
        </div>
        <div>
          <p className="stat text-[44px]">{pct}%</p>
          <p className="meta mt-2">complete</p>
        </div>
        <div>
          <p className="stat text-[44px]">{totalXp.toLocaleString("en-US")}</p>
          <p className="meta mt-2">XP from trophies</p>
        </div>
        {recent ? (
          <div className="max-w-xs">
            <p className="meta">Recent</p>
            <p className="mt-2 text-[15px]">{recent.name}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-6 max-w-sm">
        <ProgressWidget value={unlocked} max={catalog.length || 1} />
      </div>

      <div className="mt-8" role="tablist" aria-label="Achievement filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`mr-1 min-h-11 px-3 text-[13px] ${
              filter === f.id ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)]" : "text-[var(--text-dim)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing in this filter" body="Switch games — trophies live with the run that earned them." />
      ) : (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {filtered.map((a) => {
            const expanded = open === a.id;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : a.id)}
                  className="w-full border-t border-[var(--line)] py-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="meta">
                        {a.gameTitle} · {a.xp} XP
                      </p>
                      <p className="mt-1 text-[16px]">{a.name}</p>
                      <p className="mt-1 text-[13px] text-[var(--text-dim)]">{a.description}</p>
                    </div>
                    <StatusPill kind={a.unlocked ? "complete" : "locked"} />
                  </div>
                  {expanded ? (
                    <p className="mt-3 text-[12px] text-[var(--text-faint)]">
                      {a.how} · {a.gameTitle}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
