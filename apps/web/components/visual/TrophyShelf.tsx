import { AchievementIcon } from "@/components/achievements/AchievementIcon";

export type TrophyItem = {
  id: string;
  name: string;
  description?: string;
  unlocked: boolean;
  gameId: string;
  xp?: number;
};

export function FeaturedTrophy({ item }: { item: TrophyItem }) {
  return (
    <article className="gw-trophy-hero relative overflow-hidden">
      <div className="gw-trophy-motif" aria-hidden />
      <svg className="gw-trophy-ghost text-white" viewBox="0 0 80 80" aria-hidden>
        <path d="M28 16 H52 V28 C62 30 66 40 58 46 C54 49 50 50 50 50 V56 H30 V50 S26 49 22 46 C14 40 18 30 28 28 Z" fill="currentColor" />
        <rect x="26" y="56" width="28" height="6" />
        <rect x="22" y="64" width="36" height="6" />
      </svg>
      <div className="relative grid min-h-[220px] items-center gap-6 p-5 md:min-h-[240px] md:grid-cols-[auto_minmax(0,1fr)] md:p-8">
        <div className="gw-trophy-plinth gw-trophy-plinth-lg">
          <AchievementIcon id={item.id} gameId={item.gameId} unlocked={item.unlocked} size="xl" />
        </div>
        <div className="min-w-0">
          <h2 className="display text-[36px] text-white md:text-[52px]">{item.name}</h2>
          {item.description ? <p className="mt-2 max-w-md text-[14px] text-white/62">{item.description}</p> : null}
          {item.xp ? <p className="stat mt-3 text-[28px] text-white">+{item.xp} XP</p> : null}
        </div>
      </div>
      <div className="gw-trophy-shelf-rail" aria-hidden />
    </article>
  );
}

export function TrophyShelf({
  items,
  featured,
}: {
  items: TrophyItem[];
  featured?: boolean;
}) {
  if (featured && items.length === 1 && items[0]) {
    return <FeaturedTrophy item={items[0]} />;
  }
  return (
    <ul className={`grid gap-3 ${featured ? "md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
      {items.map((a) => (
        <li key={a.id} className={`gw-trophy-slot ${a.unlocked ? "is-open" : "is-locked"}`}>
          <div className="gw-trophy-plinth">
            <AchievementIcon id={a.id} gameId={a.gameId} unlocked={a.unlocked} />
          </div>
          <p className={`mt-3 ${featured ? "text-[16px]" : "text-[13px]"} ${a.unlocked ? "text-white" : "text-white/45"}`}>
            {a.name}
          </p>
          {a.xp && a.unlocked ? <p className="stat mt-1 text-[13px] text-white/70">+{a.xp}</p> : null}
          {featured && a.description ? <p className="mt-1 text-[12px] text-white/50">{a.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}
