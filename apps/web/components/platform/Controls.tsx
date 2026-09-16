"use client";

export function SwitchControl({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-[14px]">{label}</p>
        {description ? <p className="mt-0.5 text-[12px] text-[var(--text-faint)]">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full ${checked ? "bg-[var(--accent)]" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-[var(--text)] transition-transform duration-[var(--motion-fast)] ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export function SliderControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="mt-3 flex items-center justify-between gap-6 py-2">
      <span className="text-[14px]">{label}</span>
      <span className="flex min-w-[180px] flex-1 items-center gap-3">
        <input
          className="gw-slider w-full"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="w-8 text-right text-[12px] text-[var(--text-faint)]">{Math.round(value * 100)}</span>
      </span>
    </label>
  );
}
