"use client";

import { useToasts } from "@/lib/player";

export function Toasts() {
  const toasts = useToasts();
  return (
    <div className="pointer-events-none fixed top-[calc(var(--header-h)+8px)] right-4 z-50 flex w-[min(280px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto border-l-2 border-[var(--accent)] bg-[var(--surface)] px-4 py-3"
          role="status"
        >
          <p className="meta">{t.kind === "achievement" ? "Achievement" : t.kind === "pb" ? "Record" : t.kind === "quest" ? "Daily" : t.kind}</p>
          <p className="mt-1 text-[14px]">{t.title}</p>
          {t.body ? <p className="mt-0.5 text-[12px] text-[var(--text-dim)]">{t.body}</p> : null}
        </div>
      ))}
    </div>
  );
}
