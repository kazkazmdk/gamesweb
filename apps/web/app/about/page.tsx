import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="display text-[48px]">About</h1>
      <p className="mt-4 text-[16px] text-[var(--text-dim)]">
        {brand.productName} is a browser arcade. Play first, keep a streak, and carry one identity across eight
        first-party games. This public beta is still being hardened — guest play works offline, while accounts, global
        boards, and friends need a configured backend.
      </p>
      <p className="mt-6 text-[14px]">
        <Link href="/games" className="text-white/80 hover:text-white">
          Public game catalog ›
        </Link>
      </p>
      <ul className="mt-4 space-y-2 text-[14px] text-[var(--text-dim)]">
        {GAME_MANIFESTS.map((g) => (
          <li key={g.slug}>
            <Link href={`/games/${g.slug}`} className="hover:text-white">
              {g.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
