import { Avatar } from "@/components/shell/AppShell";
import { formatRank } from "@/lib/platform/format";

export type PodiumRow = {
  name: string;
  score: string;
  you?: boolean;
  avatar?: string;
};

export function RankPodium({ rows }: { rows: PodiumRow[] }) {
  if (rows.length === 1 && rows[0]) {
    const row = rows[0];
    return (
      <div className="gw-podium-solo">
        <p className="stat text-[56px] text-white md:text-[72px]">{formatRank(1)}</p>
        <div className="mt-4 flex items-center gap-4">
          <Avatar id={row.avatar ?? row.name} size={72} />
          <div className="min-w-0">
            <p className="truncate text-[18px] text-white">
              {row.name}
              {row.you ? " · you" : ""}
            </p>
            <p className="stat mt-2 text-[36px] text-white md:text-[44px]">{row.score}</p>
          </div>
        </div>
        <p className="mt-5 text-[15px] text-white/60">Set the pace.</p>
      </div>
    );
  }

  const order = [rows[1], rows[0], rows[2]].filter(Boolean);
  const heights = ["md:min-h-[188px]", "md:min-h-[236px]", "md:min-h-[164px]"];
  return (
    <ol className="gw-podium" aria-label="Top 3">
      {order.map((row, i) => {
        const place = row === rows[0] ? 1 : row === rows[1] ? 2 : 3;
        return (
          <li key={`${row.name}-${place}`} className={`gw-podium-step ${heights[i]} ${place === 1 ? "is-first" : ""}`}>
            <p className="stat text-[28px] text-white/80 md:text-[36px]">{formatRank(place)}</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar id={row.avatar ?? row.name} size={place === 1 ? 64 : 44} />
              <div className="min-w-0">
                <p className={`truncate ${row.you ? "text-white" : "text-white/80"}`}>
                  {row.name}
                  {row.you ? " · you" : ""}
                </p>
                <p className="stat mt-1 text-[28px] text-white md:text-[34px]">{row.score}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
