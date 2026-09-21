import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/SeoChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoLandingView } from "@/components/seo/SeoAnalytics";
import { editorialFor, seoPageByPath } from "@/content";
import { breadcrumbJsonLd, itemListJsonLd, metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/guides");

export default function GuidesIndexPage() {
  const page = seoPageByPath("/guides")!;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
  ];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd(
            "Gamesweb guides",
            GAME_MANIFESTS.map((g) => ({ name: `${g.title} guide`, path: `/games/${g.slug}/guide` })),
          ),
        ]}
      />
      <SeoLandingView path="/guides" kind="guides" />
      <article className="px-5 py-10 md:px-10">
        <Breadcrumbs items={crumbs} />
        <h1 className="display mt-6 text-[48px] md:text-[72px]">{page.h1}</h1>
        <p className="mt-4 max-w-2xl text-[16px] text-[var(--text-dim)]">{page.description}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {GAME_MANIFESTS.map((game) => {
            const ed = editorialFor(game.slug);
            return (
              <li key={game.slug} className="border-t border-[var(--line)] pt-4">
                <p className="meta">{game.genre}</p>
                <h2 className="display mt-2 text-[32px]">
                  <Link href={`/games/${game.slug}/guide`}>{game.title}</Link>
                </h2>
                <p className="mt-2 text-[14px] text-[var(--text-dim)]">{ed.guideLead}</p>
                <p className="mt-3 flex flex-wrap gap-3 text-[13px] text-[var(--text-faint)]">
                  <Link href={`/games/${game.slug}/how-to-play`}>How to play</Link>
                  <Link href={`/games/${game.slug}/controls`}>Controls</Link>
                  {ed.strategy.length ? <Link href={`/games/${game.slug}/strategy`}>Strategy</Link> : null}
                  <Link href={`/games/${game.slug}/achievements`}>Achievements</Link>
                </p>
              </li>
            );
          })}
        </ul>
      </article>
    </>
  );
}
