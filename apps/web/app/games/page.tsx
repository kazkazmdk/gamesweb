import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";
import { Breadcrumbs, GameCatalogGrid } from "@/components/seo/SeoChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoLandingView } from "@/components/seo/SeoAnalytics";
import { COLLECTIONS, seoPageByPath } from "@/content";
import { breadcrumbJsonLd, itemListJsonLd, metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/games");

export default function GamesCatalogPage() {
  const page = seoPageByPath("/games")!;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Games", path: "/games" },
  ];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd(
            "Gamesweb catalog",
            GAME_MANIFESTS.map((g) => ({ name: g.title, path: `/games/${g.slug}` })),
          ),
        ]}
      />
      <SeoLandingView path="/games" kind="catalog" />
      <section className="relative min-h-[42vh] overflow-hidden">
        <GameArt slug={GAME_MANIFESTS[0].slug} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_55%,transparent)] to-black/20" />
        <div className="relative px-5 pb-10 pt-20 md:px-10 md:pb-14">
          <Breadcrumbs items={crumbs} />
          <h1 className="display mt-6 max-w-[12ch] text-[48px] text-white md:text-[80px]">{page.h1}</h1>
          <p className="mt-4 max-w-xl text-[16px] text-white/70">{page.description}</p>
        </div>
      </section>
      <div className="px-5 py-10 md:px-10">
        <GameCatalogGrid />
        <section className="mt-14">
          <h2 className="meta">Collections</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {COLLECTIONS.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="gw-frame inline-flex min-h-11 items-center px-4 text-[13px]">
                  {c.h1}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link href="/guides" className="text-[13px] text-[var(--text-dim)] hover:text-[var(--text)]">
              Browse guides ›
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
