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
      <p className="text-[13px] text-white/50">
        {label} · {options[0]?.label ?? "Default"}
      </p>
    );
  }
  return (
    <div>
      <p className="mb-2 text-[12px] text-white/45">{label}</p>
      <div
        role="tablist"
        aria-label={label}
        className="gw-switcher"
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
              className={`gw-chip ${selected ? "is-on" : ""}`}
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
