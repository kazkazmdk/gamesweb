import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-4">
      <p className="text-[15px] text-[var(--text)]">{title}</p>
      {body ? <p className="mt-1 max-w-md text-[13px] text-[var(--text-dim)]">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
