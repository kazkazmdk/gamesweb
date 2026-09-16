"use client";

import { useMemo, useState } from "react";
import { GAME_MANIFESTS, allAchievements } from "@gamesweb/game-sdk";
import { EmptyState, ProgressWidget, StatusPill } from "@/components/platform";
import { AchievementIcon } from "@/components/achievements/AchievementIcon";
import { useAccent } from "@/components/shell/AppShell";
import { usePlayer } from "@/lib/player";
import { achievementCatalog } from "@/lib/platform/focus";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "platform", label: "Platform" },
  ...GAME_MANIFESTS.map((g) => ({ id: g.id, label: g.title })),
];

const SORTS = [
  { id: "catalog", label: "Catalog" },
  { id: "recent", label: "Recently unlocked" },
  { id: "complete", label: "Completion" },
] as const;

function formatUnlock(at?: number) {
  if (!at) return null;
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AchievementsPage() {
  useAccent();
  const player = usePlayer();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("catalog");
  const [open, setOpen] = useState<string | null>(null);
  const catalog = useMemo(() => achievementCatalog(player), [player]);
  const totalXp = allAchievements()
    .filter((a) => player.achievements.includes(`${a.gameId ?? "platform"}:${a.key}`))
    .reduce((n, a) => n + a.xp, 0);
  const filtered = (filter === "all" ? catalog : catalog.filter((a) => a.gameId === filter)).slice();
  if (sort === "recent") {
    filtered.sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0) || Number(b.unlocked) - Number(a.unlocked));
  } else if (sort === "complete") {
    filtered.sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  }
  const unlocked = catalog.filter((a) => a.unlocked).length;
  const pct = catalog.length ? Math.round((unlocked / catalog.length) * 100) : 0;
  const recent = catalog
    .filter((a) => a.unlocked)
    .slice()
    .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0))[0];

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
            {recent.unlockedAt ? <p className="mt-1 text-[12px] text-[var(--text-faint)]">{formatUnlock(recent.unlockedAt)}</p> : null}
          </div>
        ) : null}
      </div>
      <div className="mt-6 max-w-sm">
        <ProgressWidget value={unlocked} max={catalog.length || 1} />
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        <div role="tablist" aria-label="Achievement filters">
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
        <div role="tablist" aria-label="Achievement sort">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={sort === s.id}
              onClick={() => setSort(s.id)}
              className={`mr-1 min-h-11 px-3 text-[13px] ${
                sort === s.id ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)]" : "text-[var(--text-dim)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing in this filter" body="Switch games — trophies live with the run that earned them." />
      ) : (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {filtered.map((a) => {
            const expanded = open === a.id;
            const date = a.unlocked ? formatUnlock(a.unlockedAt) : null;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : a.id)}
                  className={`flex w-full items-start gap-4 px-4 py-4 text-left ${
                    a.unlocked ? "gw-selected" : "gw-float"
                  }`}
                >
                  <AchievementIcon id={a.id} gameId={a.gameId} unlocked={a.unlocked} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="meta">
                          {a.gameTitle} · {a.xp} XP
                        </p>
                        <p className={`mt-1 text-[16px] ${a.unlocked ? "text-[var(--text)]" : "text-[var(--text)]"}`}>{a.name}</p>
                        <p className="mt-1 text-[13px] text-[var(--text-dim)]">{a.description}</p>
                        {date ? <p className="mt-1 text-[12px] text-[var(--text-faint)]">Unlocked {date}</p> : null}
                      </div>
                      <StatusPill kind={a.unlocked ? "complete" : "locked"} />
                    </div>
                    {expanded ? (
                      <p className="mt-3 text-[12px] text-[var(--text-faint)]">
                        {a.how} · {a.gameTitle}
                      </p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
