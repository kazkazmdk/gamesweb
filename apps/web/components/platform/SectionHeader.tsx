import type { ReactNode } from "react";

export function SectionHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="meta">{title}</h2>
        {meta ? <p className="mt-1 text-[13px] text-[var(--text-dim)]">{meta}</p> : null}
      </div>
      {action}
    </div>
  );
}
