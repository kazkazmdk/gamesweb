import { notFound } from "next/navigation";
import { SeoFaq, SeoGameCard, SeoHero, SeoLinkRail, SeoSection } from "./SeoChrome";
import { SeoPlayButton, SeoTracker } from "./SeoTracker";
import { collectionBySlug, entriesByKind, entryByPath, relatedEntries } from "@/lib/seo-content/registry";

export function CollectionIndexView() {
  const entry = entryByPath("/collections");
  if (!entry) return null;
  const collections = entriesByKind("collection");
  return (
    <article data-seo-page="collection-index">
      <SeoTracker kind={entry.kind} slug={entry.slug} />
      <SeoHero entry={entry} kicker="Curated sets" />
      <div className="space-y-12 px-5 py-12 md:px-10">
        {entry.sections.map((s) => (
          <SeoSection key={s.heading} heading={s.heading} body={s.body} />
        ))}
        <SeoLinkRail
          title="Collections"
          items={collections.map((c) => ({ href: c.path, label: c.h1, meta: c.summary }))}
        />
      </div>
    </article>
  );
}

export function CollectionView({ slug }: { slug: string }) {
  const record = collectionBySlug(slug);
  const entry = entryByPath(`/collections/${slug}`);
  if (!record || !entry) notFound();
  const related = relatedEntries(entry);
  return (
    <article data-seo-page="collection">
      <SeoTracker kind={entry.kind} slug={entry.slug} />
      <SeoHero entry={entry} kicker="Collection">
        <div className="mt-6">
          <SeoPlayButton
            href={`/play/${record.pick.gameId}`}
            gameId={record.pick.gameId}
            sourceType="collection"
            sourceSlug={slug}
          >
            Play the pick
          </SeoPlayButton>
        </div>
      </SeoHero>
      <div className="space-y-14 px-5 py-12 md:px-10">
        <section className="max-w-2xl">
          <h2 className="display text-[28px] md:text-[34px]">Recommended first</h2>
          <p className="mt-3 text-[15px] leading-7 text-[var(--text-dim)]">{record.pick.reason}</p>
        </section>
        <section>
          <h2 className="meta">In this set</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {record.relatedGameIds.map((id) => (
              <SeoGameCard
                key={id}
                gameId={id}
                sourceType="collection"
                sourceSlug={slug}
                reason={id === record.pick.gameId ? record.pick.reason : undefined}
              />
            ))}
          </div>
        </section>
        {entry.sections.map((s) => (
          <SeoSection key={s.heading} heading={s.heading} body={s.body} />
        ))}
        <SeoFaq faqs={entry.faqs} />
        <SeoLinkRail
          title="Guides"
          items={related.guides.map((g) => ({ href: g.path, label: g.h1, meta: g.intent }))}
        />
        <SeoLinkRail
          title="Related collections"
          items={related.collections.map((c) => ({ href: c.path, label: c.h1, meta: c.intent }))}
        />
      </div>
    </article>
  );
}
