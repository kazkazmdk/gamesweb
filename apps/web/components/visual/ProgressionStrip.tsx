import { ProgressWidget } from "@/components/platform/ProgressWidget";

export function ProgressionStrip({
  level,
  into,
  needed,
  streak,
  trophies,
  next,
}: {
  level: number;
  into: number;
  needed: number;
  streak?: number;
  trophies?: string;
  next?: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_auto]">
      <div>
        <p className="display text-[48px] text-white md:text-[64px]">Lv {level}</p>
        <div className="mt-4 max-w-md">
          <ProgressWidget value={into} max={Math.max(1, needed)} caption={next} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 self-end">
        {streak && streak > 0 ? (
          <div>
            <dt className="text-[12px] text-white/45">Streak</dt>
            <dd className="stat mt-1 text-[32px] text-white">{streak}</dd>
          </div>
        ) : null}
        {trophies ? (
          <div>
            <dt className="text-[12px] text-white/45">Trophies</dt>
            <dd className="stat mt-1 text-[32px] text-white">{trophies}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
