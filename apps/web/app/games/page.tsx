import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { GameTile } from "@/components/platform";
import { SeoCta, SeoPage } from "@/components/seo/SeoPage";
import { COLLECTIONS } from "@/content/collections";
import { INDEX, metadataFromPage } from "@/lib/seo";

export const metadata: Metadata = {
  ...metadataFromPage({
    title: "Gamesweb games catalog",
    description: "All eight Gamesweb games with genre, controls, session length, and links to hubs and guides.",
    path: "/games",
  }),
  ...INDEX,
};

export default function GamesCatalogPage() {
  return (
    <SeoPage
      kicker="Catalog"
      title="The eight games"
      lede="Each title is a different world on the same Gamesweb identity. Filter by how you want to play, then open the hub — Play stays a separate, noindex surface."
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/games", label: "Games" },
      ]}
    >
      <ul className="grid gap-6 md:grid-cols-2">
        {GAME_MANIFESTS.map((game) => (
          <li key={game.id} className="border-t border-white/10 pt-4">
            <GameTile game={game} variant="wide" />
            <p className="mt-3 text-[13px] text-white/55">
              {game.genre} · {game.sessionHint} · {game.inputMethods.join(" / ")}
            </p>
            <p className="mt-2 text-[14px] text-white/70">{game.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
              <Link href={`/games/${game.slug}`} className="text-white/80">
                Hub
              </Link>
              <Link href={`/guides/${game.slug}/how-to-play`} className="text-white/80">
                How to play
              </Link>
              <Link href={`/guides/${game.slug}/tips`} className="text-white/80">
                Tips
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <section>
        <h2 className="meta">Collections</h2>
        <ul className="mt-3 space-y-2 text-[14px] text-white/70">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`}>{c.title}</Link>
            </li>
          ))}
        </ul>
      </section>
      <SeoCta href="/guides">Open the guides ›</SeoCta>
    </SeoPage>
  );
}
