import { getManifest, type GameManifest } from "@gamesweb/game-sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameCatalogGrid } from "@/components/seo/SeoChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeoLandingView, TrackedLink } from "@/components/seo/SeoAnalytics";
import { Breadcrumbs } from "@/components/seo/SeoChrome";
import { COLLECTIONS, collectionBySlug, seoPageByPath } from "@/content";
import { breadcrumbJsonLd, itemListJsonLd, metadataForPath } from "@/lib/seo";

const CHALLENGE_LABEL: Record<string, string> = {
  "beat-score": "Beat score",
  "same-seed": "Same seed",
  "beat-time": "Beat time",
  "beat-ghost": "Beat ghost",
  "survive-longer": "Survive longer",
  "beat-route": "Beat route",
  "beat-build": "Beat build",
  "survive-seed": "Survive seed",
};

function primaryInput(game: GameManifest) {
  const first = game.controls[0];
  return first ? `${first.input}: ${first.action}` : game.inputMethods[0];
}

function scoreRule(game: GameManifest) {
  const direction = game.scoreDirection === "higher" ? "Higher score wins" : "Lower result wins";
  return `${direction} — ${game.tagline}`;
}

function challengeMode(game: GameManifest) {
  return game.challengeTypes.map((type) => CHALLENGE_LABEL[type] ?? type).join(", ");
}

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return metadataForPath(`/collections/${slug}`);
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const col = collectionBySlug(slug);
  const page = seoPageByPath(`/collections/${slug}`);
  if (!col || !page) notFound();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
    { name: col.h1, path: page.path },
  ];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          itemListJsonLd(
            col.title,
            col.games.map((id) => ({ name: getManifest(id)?.title ?? id, path: `/games/${id}` })),
          ),
        ]}
      />
      <SeoLandingView path={page.path} kind="collection" />
      <article className="px-5 py-10 md:px-10">
        <Breadcrumbs items={crumbs} />
        <h1 className="display mt-6 text-[48px] md:text-[72px]">{page.h1}</h1>
        <p className="mt-4 max-w-2xl text-[16px] text-[var(--text-dim)]">{col.rationale}</p>
        <p className="mt-4 max-w-2xl text-[15px] text-[var(--text-dim)]">{col.audience}</p>
        <p className="mt-3 max-w-2xl text-[15px] text-[var(--text-dim)]">{col.pick}</p>
        <div className="mt-10">
          <GameCatalogGrid slugs={col.games} />
        </div>
        <div className="overflow-x-auto">
          <table className="mt-10 w-full border-collapse text-left text-[13px]">
            <caption className="mb-3 text-left text-[15px] text-[var(--text)]">
              {col.h1}: genre, session length, primary input, score rule, and challenge mode
            </caption>
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                <th scope="col" className="py-2 pr-3 font-medium">Game</th>
                <th scope="col" className="py-2 pr-3 font-medium">Genre</th>
                <th scope="col" className="py-2 pr-3 font-medium">Session</th>
                <th scope="col" className="py-2 pr-3 font-medium">Primary Input</th>
                <th scope="col" className="py-2 pr-3 font-medium">Score Rule</th>
                <th scope="col" className="py-2 font-medium">Challenge Mode</th>
              </tr>
            </thead>
            <tbody>
              {col.games.map((id) => {
                const game = getManifest(id);
                if (!game) return null;
                return (
                  <tr key={game.slug} className="border-t border-[var(--line)] align-top">
                    <th scope="row" className="py-3 pr-3 font-medium text-[var(--text)]">
                      <TrackedLink
                        href={`/games/${game.slug}`}
                        event="collection_to_game"
                        props={{ collection: slug, gameId: game.slug }}
                        className="hover:underline"
                      >
                        {game.title}
                      </TrackedLink>
                    </th>
                    <td className="py-3 pr-3">{game.genre}</td>
                    <td className="py-3 pr-3">{game.sessionHint}</td>
                    <td className="py-3 pr-3">{primaryInput(game)}</td>
                    <td className="py-3 pr-3">{scoreRule(game)}</td>
                    <td className="py-3">{challengeMode(game)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="mt-8 flex flex-wrap gap-3 text-[13px]">
          {col.games.map((id) => (
            <li key={id}>
              <TrackedLink
                href={`/games/${id}`}
                event="collection_to_game"
                props={{ collection: slug, gameId: id }}
                className="text-[var(--text-dim)] hover:text-[var(--text)]"
              >
                Open {getManifest(id)?.title} hub ›
              </TrackedLink>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
