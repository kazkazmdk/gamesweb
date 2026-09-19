import { Avatar } from "@/components/shell/AppShell";
import { formatRank } from "@/lib/platform/format";

export type PodiumRow = {
  name: string;
  score: string;
  you?: boolean;
  avatar?: string;
};

export function RankPodium({ rows }: { rows: PodiumRow[] }) {
  if (rows.length === 1) {
    const row = rows[0];
    return (
      <ol className="gw-podium gw-podium--solo" aria-label="Top 3">
        <li className="gw-stage gw-sheet gw-frame p-6 md:min-h-[220px]">
          <p className="meta text-white/45">{row.you ? "Your standing" : formatRank(1)}</p>
          <div className="mt-5 flex items-center gap-4">
            <Avatar id={row.avatar ?? row.name} size={72} />
            <div className="min-w-0">
              <p className="truncate text-[20px] text-white">
                {row.name}
                {row.you ? " · you" : ""}
              </p>
              <p className="stat mt-2 text-[40px] leading-none text-white">{row.score}</p>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-[13px] text-white/45">No other verified scores on this board yet.</p>
        </li>
      </ol>
    );
  }

  const order = [rows[1], rows[0], rows[2]].filter(Boolean);
  const heights = ["md:min-h-[168px]", "md:min-h-[210px]", "md:min-h-[148px]"];
  return (
    <ol className="gw-podium" aria-label="Top 3">
      {order.map((row, i) => {
        const place = row === rows[0] ? 1 : row === rows[1] ? 2 : 3;
        return (
          <li key={`${row.name}-${place}`} className={`gw-stage gw-sheet p-4 ${heights[i]} ${place === 1 ? "gw-frame" : ""}`}>
            <p className="meta text-white/45">{formatRank(place)}</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar id={row.avatar ?? row.name} size={place === 1 ? 56 : 40} />
              <div className="min-w-0">
                <p className={`truncate ${row.you ? "text-white" : "text-white/80"}`}>
                  {row.name}
                  {row.you ? " · you" : ""}
                </p>
                <p className="stat mt-1 text-[28px] text-white">{row.score}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
