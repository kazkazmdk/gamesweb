"use client";

import type { ModeOption } from "@/lib/platform/modes";

export function GameModeSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ModeOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (options.length <= 1) {
    return (
      <p className="meta">
        {label} · {options[0]?.label ?? "Default"}
      </p>
    );
  }
  return (
    <div>
      <p className="meta mb-2">{label}</p>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto scrollbar-none"
        onKeyDown={(e) => {
          const i = options.findIndex((o) => o.id === value);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(options[(i + 1) % options.length].id);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(options[(i - 1 + options.length) % options.length].id);
          }
        }}
      >
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`min-h-11 shrink-0 px-3 text-[13px] ${selected ? "text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)]" : "text-[var(--text-dim)]"}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(opt.id)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
