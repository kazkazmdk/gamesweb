import { getManifest } from "@gamesweb/game-sdk";
import { notFound } from "next/navigation";
import { SeoFaq, SeoHero, SeoLinkRail, SeoSection } from "./SeoChrome";
import { SeoPlayButton, SeoTracker } from "./SeoTracker";
import { entriesByKind, entryByPath, guideByPath, relatedEntries } from "@/lib/seo-content/registry";

export function GuideIndexView() {
  const entry = entryByPath("/guides");
  if (!entry) return null;
  const hubs = entriesByKind("guide-hub");
  return (
    <article data-seo-page="guide-index">
      <SeoTracker kind={entry.kind} slug={entry.slug} />
      <SeoHero entry={entry} kicker="From the shipped build" />
      <div className="space-y-12 px-5 py-12 md:px-10">
        {entry.sections.map((s) => (
          <SeoSection key={s.heading} heading={s.heading} body={s.body} />
        ))}
        <SeoLinkRail title="By game" items={hubs.map((h) => ({ href: h.path, label: h.h1, meta: h.summary }))} />
      </div>
    </article>
  );
}

export function GuideHubView({ gameSlug }: { gameSlug: string }) {
  const entry = entryByPath(`/guides/${gameSlug}`);
  const game = getManifest(gameSlug);
  if (!entry || !game) notFound();
  const related = relatedEntries(entry);
  return (
    <article data-seo-page="guide-hub">
      <SeoTracker kind={entry.kind} slug={entry.slug} />
      <SeoHero entry={entry} kicker={game.title}>
        <div className="mt-6 flex flex-wrap gap-3">
          <SeoPlayButton href={`/play/${game.slug}`} gameId={game.id} sourceType="guide-hub" sourceSlug={gameSlug}>
            Play {game.title}
          </SeoPlayButton>
        </div>
      </SeoHero>
      <div className="space-y-14 px-5 py-12 md:px-10">
        {entry.sections.map((s) => (
          <SeoSection key={s.heading} heading={s.heading} body={s.body} />
        ))}
        <SeoLinkRail title="Guides" items={related.guides.map((g) => ({ href: g.path, label: g.h1, meta: g.summary }))} />
        <SeoLinkRail
          title="Collections"
          items={related.collections.map((c) => ({ href: c.path, label: c.h1 }))}
        />
      </div>
    </article>
  );
}

export function GuideArticleView({ gameSlug, article }: { gameSlug: string; article: string }) {
  const path = `/guides/${gameSlug}/${article}`;
  const entry = guideByPath(path) ?? entryByPath(path);
  const game = getManifest(gameSlug);
  if (!entry || !game) notFound();
  const related = relatedEntries(entry);
  return (
    <article data-seo-page="guide">
      <SeoTracker kind={entry.kind} slug={`${gameSlug}/${article}`} />
      <SeoHero entry={entry} kicker={game.title}>
        <div className="mt-6 flex flex-wrap gap-3">
          <SeoPlayButton href={`/play/${game.slug}`} gameId={game.id} sourceType="guide" sourceSlug={article}>
            Open {game.title}
          </SeoPlayButton>
        </div>
      </SeoHero>
      <div className="space-y-14 px-5 py-12 md:px-10">
        {entry.sections.map((s) => (
          <SeoSection key={s.heading} heading={s.heading} body={s.body} />
        ))}
        <SeoFaq faqs={entry.faqs} />
        <SeoLinkRail
          title="Keep reading"
          items={[
            { href: `/games/${game.slug}`, label: `${game.title} hub`, meta: "Play, modes, PB." },
            { href: `/guides/${game.slug}`, label: `${game.title} guides` },
            ...related.guides.map((g) => ({ href: g.path, label: g.h1 })),
          ]}
        />
        <SeoLinkRail
          title="Collections"
          items={related.collections.map((c) => ({ href: c.path, label: c.h1 }))}
        />
      </div>
    </article>
  );
}
