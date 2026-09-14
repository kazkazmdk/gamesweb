"use client";

import { useToasts } from "@/lib/player";

export function Toasts() {
  const toasts = useToasts();
  return (
    <div className="pointer-events-none fixed top-16 right-4 z-50 flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow)]"
          role="status"
        >
          <p className="text-[13px] font-medium">{t.title}</p>
          {t.body ? <p className="mt-0.5 text-[12px] text-[var(--text-dim)]">{t.body}</p> : null}
        </div>
      ))}
    </div>
  );
}
