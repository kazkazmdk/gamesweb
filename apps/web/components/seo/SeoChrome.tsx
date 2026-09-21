import { GAME_MANIFESTS, getManifest } from "@gamesweb/game-sdk";
import Link from "next/link";
import { GameArt } from "@/components/game/GameArt";
import { editorialFor, type SeoPage } from "@/content";
import { TrackedLink } from "./SeoAnalytics";

export function Breadcrumbs({ items }: { items: Array<{ name: string; path: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12px] tracking-[0.12em] text-white/45 uppercase">
      <ol className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {i === items.length - 1 ? (
              <span className="text-white/70">{item.name}</span>
            ) : (
              <Link href={item.path} className="hover:text-white">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ClusterNav({ slug, current }: { slug: string; current: string }) {
  const game = getManifest(slug);
  const ed = editorialFor(slug);
  if (!game) return null;
  const links = [
    { href: `/games/${slug}`, label: "Hub" },
    { href: `/games/${slug}/guide`, label: "Guide" },
    { href: `/games/${slug}/how-to-play`, label: "How to play" },
    { href: `/games/${slug}/controls`, label: "Controls" },
    ...(ed.strategy.length ? [{ href: `/games/${slug}/strategy`, label: "Strategy" }] : []),
    { href: `/games/${slug}/achievements`, label: "Achievements" },
    ...(ed.tracks?.length ? [{ href: `/games/${slug}/tracks`, label: "Tracks" }] : []),
    ...(ed.courses?.length ? [{ href: `/games/${slug}/courses`, label: "Courses" }] : []),
    ...(ed.scoring ? [{ href: `/games/${slug}/scoring`, label: "Scoring" }] : []),
  ];
  return (
    <nav aria-label={`${game.title} pages`} className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`min-h-10 px-3 text-[12px] tracking-[0.12em] uppercase ${
            current === l.href ? "gw-frame text-[var(--text)]" : "text-[var(--text-dim)] hover:text-[var(--text)]"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function PlayCta({ slug, source }: { slug: string; source: "hub" | "guide" }) {
  const game = getManifest(slug);
  return (
    <TrackedLink
      href={`/play/${slug}`}
      event={source === "hub" ? "game_hub_to_play" : "guide_to_play"}
      props={{ gameId: slug }}
      className="home-play inline-flex min-h-12 items-center justify-center gap-3 px-7 py-3 text-[16px] font-semibold"
    >
      <span className="home-play-mark" aria-hidden />
      Play {game?.title ?? "now"}
    </TrackedLink>
  );
}

export function RelatedGames({ slugs, title = "Related" }: { slugs: string[]; title?: string }) {
  const games = slugs.map((s) => getManifest(s)).filter(Boolean);
  if (!games.length) return null;
  return (
    <section>
      <h2 className="meta">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {games.map((game) =>
          game ? (
            <TrackedLink
              key={game.slug}
              href={`/games/${game.slug}`}
              event="related_game_click"
              props={{ to: game.slug }}
              className="group relative block overflow-hidden"
              >
              <span className="sr-only">{game.title}</span>
              <GameArt slug={game.slug} className="aspect-[16/10] w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 display text-[22px] text-white">{game.title}</span>
            </TrackedLink>
          ) : null,
        )}
      </div>
    </section>
  );
}

export function GameCatalogGrid({ slugs }: { slugs?: string[] }) {
  const list = (slugs ?? GAME_MANIFESTS.map((g) => g.slug))
    .map((s) => getManifest(s))
    .filter(Boolean);
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {list.map((game) =>
        game ? (
          <li key={game.slug}>
            <Link href={`/games/${game.slug}`} className="group grid grid-cols-[140px_1fr] overflow-hidden md:grid-cols-[180px_1fr]">
              <GameArt slug={game.slug} className="h-full min-h-[96px] w-full object-cover" />
              <span className="flex flex-col justify-center px-4 py-3">
                <span className="meta">{game.genre}</span>
                <span className="display mt-1 text-[26px]">{game.title}</span>
                <span className="mt-1 text-[13px] text-[var(--text-dim)]">{game.tagline}</span>
                <span className="mt-2 text-[12px] text-[var(--text-faint)]">{game.sessionHint}</span>
              </span>
            </Link>
          </li>
        ) : null,
      )}
    </ul>
  );
}

export function SeoArticle({
  page,
  crumbs,
  children,
}: {
  page: SeoPage;
  crumbs: Array<{ name: string; path: string }>;
  children: React.ReactNode;
}) {
  return (
    <article className="px-5 pb-16 pt-6 md:px-10">
      <Breadcrumbs items={crumbs} />
      <p className="meta mt-6 text-[var(--text-faint)]">Gamesweb</p>
      <h1 className="display mt-3 max-w-[16ch] text-[44px] md:text-[72px]">{page.h1}</h1>
      <p className="mt-4 max-w-2xl text-[16px] text-[var(--text-dim)]">{page.description}</p>
      {page.gameSlug ? (
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <PlayCta slug={page.gameSlug} source="guide" />
          <ClusterNav slug={page.gameSlug} current={page.path} />
        </div>
      ) : null}
      <div className="mt-10 max-w-3xl space-y-8 text-[15px] text-[var(--text-dim)]">{children}</div>
    </article>
  );
}
