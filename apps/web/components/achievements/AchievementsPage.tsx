"use client";

import { useMemo, useState } from "react";
import { GAME_MANIFESTS, allAchievements } from "@gamesweb/game-sdk";
import { EmptyState, ProgressWidget } from "@/components/platform";
import { TrophyShelf } from "@/components/visual";
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
  const recentList = catalog
    .filter((a) => a.unlocked)
    .slice()
    .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0))
    .slice(0, 3);
  const recent = recentList[0];
  const featuredLocked = catalog
    .filter((a) => !a.unlocked)
    .slice()
    .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))[0];

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

      {recentList.length ? (
        <section className="mt-10">
          <p className="meta text-white/40">Recently unlocked</p>
          <div className="mt-4">
            <TrophyShelf
              featured
              items={recentList.map((a) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                unlocked: true,
                gameId: a.gameId ?? "platform",
                xp: a.xp,
              }))}
            />
          </div>
        </section>
      ) : (
        <section className="mt-10 gw-stage p-6">
          <p className="meta text-white/40">Shelf</p>
          <p className="mt-2 text-[18px]">Nothing unlocked yet</p>
          <p className="mt-2 max-w-lg text-[14px] text-[var(--text-dim)]">
            Trophies stay locked until a real run earns them. Play any of the eight games — the first unlock lands here, not a fake collection.
          </p>
        </section>
      )}
      {featuredLocked ? (
        <section className="mt-8">
          <p className="meta text-white/40">Still out of reach</p>
          <div className="mt-4">
            <TrophyShelf
              featured
              items={[
                {
                  id: featuredLocked.id,
                  name: featuredLocked.name,
                  description: featuredLocked.description,
                  unlocked: false,
                  gameId: featuredLocked.gameId ?? "platform",
                  xp: featuredLocked.xp,
                },
              ]}
            />
          </div>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap items-end gap-6">
        <div role="tablist" aria-label="Achievement filters" className="max-w-full overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`mr-1 min-h-9 px-2 text-[12px] ${
                filter === f.id ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)]" : "text-[var(--text-faint)]"
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
              className={`mr-1 min-h-9 px-2 text-[12px] ${
                sort === s.id ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)]" : "text-[var(--text-faint)]"
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
        <div className="mt-8">
          <p className="meta text-white/40">Shelf</p>
          <div className="mt-4">
            <TrophyShelf
              items={filtered.map((a) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                unlocked: a.unlocked,
                gameId: a.gameId ?? "platform",
                xp: a.xp,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
