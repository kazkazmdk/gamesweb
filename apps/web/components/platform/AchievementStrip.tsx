import { StatusPill } from "./StatusPill";
import { ProgressWidget } from "./ProgressWidget";

export type AchievementItem = {
  key: string;
  name: string;
  description: string;
  unlocked: boolean;
};

export function AchievementStrip({
  unlocked,
  total,
  items,
  showcase,
}: {
  unlocked: number;
  total: number;
  items: AchievementItem[];
  showcase?: boolean;
}) {
  const shown = showcase ? items.filter((a) => a.unlocked).slice(0, 3) : items;
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="metric text-[32px]">
            {unlocked}
            <span className="ml-1 text-[14px] text-[var(--text-faint)]">/ {total}</span>
          </p>
          <p className="meta mt-1">Unlocked</p>
        </div>
        <div className="min-w-[140px] flex-1 max-w-xs">
          <ProgressWidget value={unlocked} max={total} size="md" />
        </div>
      </div>
      <ul className="mt-4 flex gap-3 overflow-x-auto scrollbar-none">
        {shown.map((a) => (
          <li key={a.key} className="min-w-[180px] max-w-[220px] shrink-0 py-1">
            <p className={a.unlocked ? "text-[14px]" : "text-[14px] text-[var(--text-dim)]"}>{a.name}</p>
            <div className="mt-1">
              <StatusPill kind={a.unlocked ? "complete" : "locked"} />
            </div>
            <p className="mt-1 text-[12px] text-[var(--text-faint)]">{a.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
