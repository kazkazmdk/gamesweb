import { QuickAction } from "./QuickAction";

export function InlineError({
  title,
  body,
  onRetry,
}: {
  title: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="py-3">
      <p className="text-[14px]">{title}</p>
      {body ? <p className="mt-1 text-[13px] text-[var(--text-dim)]">{body}</p> : null}
      {onRetry ? (
        <div className="mt-2">
          <QuickAction tone="ghost" onClick={onRetry}>
            Retry
          </QuickAction>
        </div>
      ) : null}
    </div>
  );
}
