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
        <h2 className="text-[16px] tracking-[-0.02em] text-white/72">{title}</h2>
        {meta ? <p className="stat mt-1 text-[18px] text-white">{meta}</p> : null}
      </div>
      {action}
    </div>
  );
}
