import { AchievementIcon } from "@/components/achievements/AchievementIcon";

export type TrophyItem = {
  id: string;
  name: string;
  description?: string;
  unlocked: boolean;
  gameId: string;
  xp?: number;
};

export function TrophyShelf({
  items,
  featured,
}: {
  items: TrophyItem[];
  featured?: boolean;
}) {
  return (
    <ul className={`grid gap-3 ${featured ? "md:grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
      {items.map((a) => (
        <li key={a.id} className={`gw-stage p-3 ${a.unlocked ? "gw-frame" : "opacity-55"}`}>
          <AchievementIcon id={a.id} gameId={a.gameId} unlocked={a.unlocked} />
          <p className={`mt-3 ${featured ? "text-[16px]" : "text-[13px]"}`}>{a.unlocked ? a.name : a.name}</p>
          {a.xp ? <p className="mt-1 text-[11px] tracking-[0.12em] text-white/40 uppercase">+{a.xp} XP</p> : null}
          {featured && a.description ? <p className="mt-1 text-[12px] text-white/50">{a.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}
