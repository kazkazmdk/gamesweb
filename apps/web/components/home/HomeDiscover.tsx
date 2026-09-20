import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import Link from "next/link";

/** Crawlable Home → catalog graph without changing the Home stage layout. */
export function HomeDiscover() {
  return (
    <nav aria-label="Public catalog" className="sr-only">
      <Link href="/games">All games</Link>
      <Link href="/guides">Guides</Link>
      <Link href="/collections">Collections</Link>
      <Link href="/about">About</Link>
      {GAME_MANIFESTS.map((g) => (
        <Link key={g.slug} href={`/games/${g.slug}`}>
          {g.title}
        </Link>
      ))}
    </nav>
  );
}
