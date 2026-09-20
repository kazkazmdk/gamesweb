import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { GameArt } from "@/components/game/GameArt";
import { SeoHero, SeoLinkRail, SeoSection } from "./SeoChrome";
import { SeoGameLink, SeoPlayButton, SeoTracker } from "./SeoTracker";
import { entryByPath, entriesByKind } from "@/lib/seo-content/registry";

export function CatalogPage() {
  const entry = entryByPath("/games");
  if (!entry) return null;
  const collections = entriesByKind("collection");
  const guides = entriesByKind("guide-hub");
  return (
    <article data-seo-page="catalog">
      <SeoTracker kind={entry.kind} slug={entry.slug} />
      <SeoHero entry={entry} kicker="Public catalog">
        <p className="mt-5 text-[13px] text-white/55">Arcade stays your personal shelf. This page is the crawlable one.</p>
      </SeoHero>
      <div className="space-y-16 px-5 py-12 md:px-10">
        <section>
          <h2 className="meta">The eight</h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {GAME_MANIFESTS.map((game) => (
              <li key={game.id} className="gw-frame overflow-hidden">
                <SeoGameLink
                  href={`/games/${game.slug}`}
                  gameId={game.id}
                  sourceType="catalog"
                  sourceSlug="games"
                  className="block"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <GameArt
                      slug={game.slug}
                      alt={`${game.title} — ${game.genre} browser game, ${game.sessionHint}`}
                    />
                  </div>
                  <div className="p-4">
                    <p className="meta">{game.genre}</p>
                    <h2 className="display mt-2 text-[28px]">{game.title}</h2>
                    <p className="mt-2 text-[13px] text-[var(--text-dim)]">
                      {game.sessionHint} · {game.inputMethods.join(" / ")} · {game.supportedDevices.join(" · ")}
                    </p>
                    <p className="mt-3 text-[14px] leading-6 text-[var(--text-dim)]">{game.tagline}</p>
                  </div>
                </SeoGameLink>
                <div className="flex flex-wrap items-center gap-3 px-4 pb-4">
                  <SeoPlayButton href={`/play/${game.slug}`} gameId={game.id} sourceType="catalog" sourceSlug="games" />
                  <SeoGameLink
                    href={`/guides/${game.slug}`}
                    gameId={game.id}
                    sourceType="catalog"
                    sourceSlug="games"
                    event="seo_guide_to_game"
                    className="home-secondary"
                  >
                    Guides ›
                  </SeoGameLink>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <SeoSection heading={entry.sections[0].heading} body={entry.sections[0].body} />
        <SeoSection heading={entry.sections[1].heading} body={entry.sections[1].body} />
        <SeoLinkRail
          title="Collections"
          items={collections.map((c) => ({ href: c.path, label: c.h1, meta: c.intent }))}
        />
        <SeoLinkRail title="Guides" items={guides.map((g) => ({ href: g.path, label: g.h1, meta: g.summary }))} />
        <SeoLinkRail title="Learn" items={[{ href: "/learn", label: "Game types", meta: "Drift, parkour, survivor, stack, crowd." }]} />
      </div>
    </article>
  );
}
