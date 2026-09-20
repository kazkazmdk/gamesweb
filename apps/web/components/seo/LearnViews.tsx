import { notFound } from "next/navigation";
import { SeoFaq, SeoGameCard, SeoHero, SeoLinkRail, SeoSection } from "./SeoChrome";
import { SeoTracker } from "./SeoTracker";
import { entriesByKind, entryByPath, relatedEntries } from "@/lib/seo-content/registry";

export function LearnIndexView() {
  const entry = entryByPath("/learn");
  if (!entry) return null;
  const pages = entriesByKind("learn");
  return (
    <article data-seo-page="learn-index">
      <SeoTracker kind={entry.kind} slug={entry.slug} />
      <SeoHero entry={entry} kicker="Types, not keywords" />
      <div className="space-y-12 px-5 py-12 md:px-10">
        {entry.sections.map((s) => (
          <SeoSection key={s.heading} heading={s.heading} body={s.body} />
        ))}
        <SeoLinkRail title="Topics" items={pages.map((p) => ({ href: p.path, label: p.h1, meta: p.intent }))} />
      </div>
    </article>
  );
}

export function LearnView({ slug }: { slug: string }) {
  const entry = entryByPath(`/learn/${slug}`);
  if (!entry) notFound();
  const related = relatedEntries(entry);
  return (
    <article data-seo-page="learn">
      <SeoTracker kind={entry.kind} slug={slug} />
      <SeoHero entry={entry} kicker="Learn" />
      <div className="space-y-14 px-5 py-12 md:px-10">
        {entry.sections.map((s) => (
          <SeoSection key={s.heading} heading={s.heading} body={s.body} />
        ))}
        <section>
          <h2 className="meta">Playable here</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {entry.relatedGameIds.map((id) => (
              <SeoGameCard key={id} gameId={id} sourceType="learn" sourceSlug={slug} />
            ))}
          </div>
        </section>
        <SeoFaq faqs={entry.faqs} />
        <SeoLinkRail
          title="Guides"
          items={related.guides.map((g) => ({ href: g.path, label: g.h1, meta: g.intent }))}
        />
        <SeoLinkRail
          title="Collections"
          items={related.collections.map((c) => ({ href: c.path, label: c.h1 }))}
        />
      </div>
    </article>
  );
}
