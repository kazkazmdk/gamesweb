import { getManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import type { ReactNode } from "react";
import { GameArt } from "@/components/game/GameArt";
import { GameBackdrop } from "@/components/visual/GameBackdrop";
import { crumbsFor } from "@/lib/seo-content/schema";
import type { SeoEntry } from "@/lib/seo-content/types";
import { SeoGameLink, SeoPlayButton } from "./SeoTracker";

export function SeoCrumbs({ entry }: { entry: SeoEntry }) {
  const crumbs = crumbsFor(entry);
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-white/50">
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-2">
          {i > 0 ? <span aria-hidden>/</span> : null}
          {i === crumbs.length - 1 ? (
            <span className="text-white/70">{c.name}</span>
          ) : (
            <Link href={c.path} className="hover:text-white">
              {c.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function SeoHero({
  entry,
  kicker,
  children,
}: {
  entry: SeoEntry;
  kicker?: string;
  children?: ReactNode;
}) {
  const slug = entry.gameId ?? entry.relatedGameIds[0] ?? "neon-drift";
  return (
    <GameBackdrop slug={slug} className="min-h-[42vh] md:min-h-[48vh]" dim={0.2} variant="hero" priority>
      <div className="flex min-h-[42vh] flex-col justify-end px-5 pb-10 pt-20 md:min-h-[48vh] md:px-10 md:pb-14">
        <SeoCrumbs entry={entry} />
        {kicker ? <p className="meta mt-4 text-white/55">{kicker}</p> : null}
        <h1 className="display mt-3 max-w-[18ch] text-[44px] text-white md:text-[72px]">{entry.h1}</h1>
        <p className="mt-4 max-w-xl text-[16px] text-white/75">{entry.summary}</p>
        {children}
      </div>
    </GameBackdrop>
  );
}

export function SeoSection({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="max-w-2xl">
      <h2 className="display text-[28px] md:text-[34px]">{heading}</h2>
      <p className="mt-3 text-[15px] leading-7 text-[var(--text-dim)]">{body}</p>
    </section>
  );
}

export function SeoFaq({ faqs }: { faqs?: { q: string; a: string }[] }) {
  if (!faqs?.length) return null;
  return (
    <section className="max-w-2xl">
      <h2 className="display text-[28px] md:text-[34px]">Questions</h2>
      <div className="mt-4 space-y-5">
        {faqs.map((f) => (
          <div key={f.q} className="border-t border-[var(--line)] pt-4">
            <p className="text-[15px]">{f.q}</p>
            <p className="mt-1 text-[14px] text-[var(--text-dim)]">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SeoGameCard({
  gameId,
  sourceType,
  sourceSlug,
  reason,
}: {
  gameId: string;
  sourceType: string;
  sourceSlug: string;
  reason?: string;
}) {
  const game = getManifest(gameId);
  if (!game) return null;
  return (
    <article className="gw-frame overflow-hidden">
      <SeoGameLink href={`/games/${game.slug}`} gameId={game.id} sourceType={sourceType} sourceSlug={sourceSlug} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          <GameArt slug={game.slug} alt={`${game.title} artwork — ${game.genre}, ${game.sessionHint}`} />
        </div>
        <div className="p-4">
          <p className="meta">{game.genre}</p>
          <h3 className="display mt-2 text-[26px]">{game.title}</h3>
          <p className="mt-2 text-[13px] text-[var(--text-dim)]">
            {game.sessionHint} · {game.inputMethods.join(" · ")} · {game.supportedDevices.slice(0, 2).join(" / ")}
          </p>
          <p className="mt-3 text-[14px] text-[var(--text-dim)]">{reason ?? game.tagline}</p>
        </div>
      </SeoGameLink>
      <div className="flex gap-3 px-4 pb-4">
        <SeoPlayButton href={`/play/${game.slug}`} gameId={game.id} sourceType={sourceType} sourceSlug={sourceSlug} />
        <SeoGameLink
          href={`/games/${game.slug}`}
          gameId={game.id}
          sourceType={sourceType}
          sourceSlug={sourceSlug}
          className="home-secondary self-center"
        >
          Hub ›
        </SeoGameLink>
      </div>
    </article>
  );
}

export function SeoLinkRail({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; meta?: string }[];
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="meta">{title}</h2>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="block border-t border-[var(--line)] py-3 hover:text-white">
              <span className="display text-[22px]">{item.label}</span>
              {item.meta ? <span className="mt-1 block text-[13px] text-[var(--text-dim)]">{item.meta}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
