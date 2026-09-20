import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import Link from "next/link";

export function HomeDiscover() {
  return (
    <nav aria-label="Public catalog" className="px-5 pb-20 pt-4 md:px-10">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/55">
        <Link href="/games" className="hover:text-white">
          All games
        </Link>
        <Link href="/guides" className="hover:text-white">
          Guides
        </Link>
        <Link href="/collections" className="hover:text-white">
          Collections
        </Link>
        {GAME_MANIFESTS.map((g) => (
          <Link key={g.slug} href={`/games/${g.slug}`} className="hover:text-white">
            {g.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
