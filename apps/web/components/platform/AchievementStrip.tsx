import { AchievementIcon } from "@/components/achievements/AchievementIcon";
import { StatusPill } from "./StatusPill";
import { ProgressWidget } from "./ProgressWidget";

export type AchievementItem = {
  key: string;
  name: string;
  description: string;
  unlocked: boolean;
  gameId?: string;
  xp?: number;
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
  const shown = (showcase ? items.filter((a) => a.unlocked) : [...items].sort((a, b) => Number(b.unlocked) - Number(a.unlocked))).slice(
    0,
    showcase ? 3 : 6,
  );
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="stat text-[32px]">
            {unlocked}
            <span className="ml-1 text-[14px] font-normal text-[var(--text-faint)]">/ {total}</span>
          </p>
          <p className="meta mt-1">Unlocked</p>
        </div>
        <div className="min-w-[140px] flex-1 max-w-xs">
          <ProgressWidget value={unlocked} max={total} size="md" />
        </div>
      </div>
      <ul className={`mt-4 ${showcase ? "grid gap-4 md:grid-cols-3" : "flex gap-3 overflow-x-auto scrollbar-none"}`}>
        {shown.map((a) => (
          <li key={a.key} className={showcase ? "gw-float min-h-[160px] p-4" : "min-w-[200px] max-w-[220px] shrink-0 py-1"}>
            <AchievementIcon id={a.key} gameId={a.gameId ?? "platform"} unlocked={a.unlocked} />
            <p className={`mt-3 ${a.unlocked ? "text-[15px]" : "text-[15px] text-[var(--text-dim)]"}`}>{a.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusPill kind={a.unlocked ? "complete" : "locked"} />
              {a.xp ? <span className="text-[11px] text-[var(--text-faint)]">+{a.xp} XP</span> : null}
            </div>
            <p className="mt-1 text-[12px] text-[var(--text-faint)]">{a.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
