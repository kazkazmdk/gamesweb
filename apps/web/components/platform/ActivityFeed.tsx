import type { ActivityItem } from "@/lib/platform/adapters";
import { EmptyState } from "./EmptyState";
import { QuickAction } from "./QuickAction";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <EmptyState title="No history yet" body="Finish a run to start the feed." action={<QuickAction href="/play">Play</QuickAction>} />;
  }
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} className="flex items-baseline justify-between gap-3 border-t border-[var(--line)] py-3 first:border-t-0">
          <div>
            <p className="text-[15px]">{item.title}</p>
            <p className="text-[12px] text-[var(--text-dim)]">
              {item.event}
              {item.timeLabel ? ` · ${item.timeLabel}` : ""}
            </p>
          </div>
          {item.scoreLabel ? <p className="metric text-[20px]">{item.scoreLabel}</p> : null}
        </li>
      ))}
    </ul>
  );
}
