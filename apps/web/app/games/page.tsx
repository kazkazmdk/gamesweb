import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";
import { Breadcrumbs, RelatedRail } from "@/components/seo/PublicArticle";
import { allCollections } from "@/lib/content/collections";
import { allGuides } from "@/lib/content/guides";
import { entityMetadata } from "@/lib/content/metadata";
import { entityByPath } from "@/lib/content/registry";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/content/schema";
import { seoTaxonomy } from "@/lib/content/taxonomy";

const entity = entityByPath("/games")!;

export const metadata: Metadata = entityMetadata(entity);

export default function GamesCatalogPage() {
  const collections = allCollections();
  const guides = allGuides();
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(entity.breadcrumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              "Gamesweb games",
              GAME_MANIFESTS.map((g) => ({ name: g.title, href: `/games/${g.slug}` })),
            ),
          ),
        }}
      />
      <header className="px-5 pb-6 pt-8 md:px-10">
        <Breadcrumbs crumbs={entity.breadcrumbs} />
        <p className="meta mt-6 text-white/45">Catalog</p>
        <h1 className="display mt-2 text-[44px] md:text-[72px]">{entity.h1}</h1>
        <p className="mt-3 max-w-2xl text-[16px] text-[var(--text-dim)]">
          Eight first-party browser games. Arcade stays the live product surface. This catalog is the public, crawlable index.
        </p>
      </header>
      <ol className="grid gap-4 px-5 pb-12 md:grid-cols-2 md:px-10 xl:grid-cols-3">
        {GAME_MANIFESTS.map((game) => {
          const tax = seoTaxonomy(game.slug);
          return (
            <li key={game.slug} className="gw-stage overflow-hidden">
              <Link href={`/games/${game.slug}`} className="block">
                <GameArt slug={game.slug} variant="tile" className="h-40 w-full" />
                <div className="p-4">
                  <p className="meta text-white/45">{tax.shortKind}</p>
                  <h2 className="display mt-1 text-[28px]">{game.title}</h2>
                  <p className="mt-2 text-[14px] text-[var(--text-dim)]">{game.tagline}</p>
                  <p className="mt-3 text-[12px] text-[var(--text-faint)]">
                    {game.sessionHint} · {game.inputMethods.join(" / ")} · solo
                    {game.ghostSupport ? " · ghost" : ""}
                    {game.partySupport ? " · party code" : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <section className="px-5 pb-10 md:px-10">
        <h2 className="meta">Collections</h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
          {collections.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`} className="text-white/75 hover:text-white">
                {c.title} ›
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="meta mt-8">Guides</h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
          <li>
            <Link href="/guides" className="text-white/75 hover:text-white">
              All guides ›
            </Link>
          </li>
          {guides.slice(0, 8).map((g) => (
            <li key={g.entity.path}>
              <Link href={g.entity.path} className="text-white/75 hover:text-white">
                {g.entity.h1} ›
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="px-5 pb-16 md:px-10">
        <RelatedRail links={entity.relatedLinks} />
      </div>
    </article>
  );
}
