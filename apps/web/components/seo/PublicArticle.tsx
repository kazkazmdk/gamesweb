import Link from "next/link";
import type { ReactNode } from "react";
import { GameArt } from "@/components/game/GameArt";
import type { IndexableEntity } from "@/lib/content/types";

export function Breadcrumbs({ crumbs }: { crumbs: IndexableEntity["breadcrumbs"] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12px] text-white/45">
      <ol className="flex flex-wrap gap-x-2 gap-y-1">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {i === crumbs.length - 1 ? (
              <span className="text-white/70">{c.name}</span>
            ) : (
              <Link href={c.href} className="hover:text-white">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function RelatedRail({ links, title = "Continue" }: { links: IndexableEntity["relatedLinks"]; title?: string }) {
  const seen = new Set<string>();
  const unique = links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
  return (
    <aside className="mt-14 border-t border-white/8 pt-8">
      <p className="meta text-white/40">{title}</p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
        {unique.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-white/70 hover:text-white">
              {l.label} ›
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function PublicHero({
  slug,
  kicker,
  h1,
  lead,
  crumbs,
  actions,
}: {
  slug: string;
  kicker?: string;
  h1: string;
  lead: string;
  crumbs: IndexableEntity["breadcrumbs"];
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0">
        <GameArt slug={slug} variant="hero" priority className="h-full min-h-[42vh] w-full md:min-h-[52vh]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-black/20" />
      </div>
      <div className="relative flex min-h-[42vh] flex-col justify-end px-5 pb-10 pt-16 md:min-h-[52vh] md:px-10">
        <Breadcrumbs crumbs={crumbs} />
        {kicker ? <p className="meta mt-4 text-white/55">{kicker}</p> : null}
        <h1 className="display mt-2 max-w-[18ch] text-[40px] text-white md:text-[64px]">{h1}</h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/72">{lead}</p>
        {actions ? <div className="mt-6 flex flex-wrap gap-4">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-2xl space-y-8 text-[15px] leading-relaxed text-[var(--text-dim)]">{children}</div>;
}
