export function ProgressWidget({
  value,
  max,
  label,
  caption,
  size = "md",
}: {
  value: number;
  max: number;
  label?: string;
  caption?: string;
  size?: "sm" | "md";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      {label ? (
        <p className="stat text-[28px] md:text-[32px]">
          {value}
          <span className="ml-1 text-[13px] font-normal text-[var(--text-faint)]">/ {max}</span>
        </p>
      ) : null}
      {caption ? <p className="meta mt-1">{caption}</p> : null}
      <div
        className={`progress-track mt-2 ${size === "sm" ? "h-[3px]" : "h-1"}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
