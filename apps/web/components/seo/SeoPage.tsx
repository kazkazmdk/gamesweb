import Link from "next/link";
import type { ReactNode } from "react";

export function SeoPage({
  kicker,
  title,
  lede,
  crumbs,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  crumbs: Array<{ href: string; label: string }>;
  children: ReactNode;
}) {
  return (
    <article className="px-5 pb-20 pt-8 md:px-10">
      <nav className="meta text-white/40" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c.href}>
            {i > 0 ? <span className="px-2">/</span> : null}
            <Link href={c.href} className="hover:text-white/70">
              {c.label}
            </Link>
          </span>
        ))}
      </nav>
      <p className="meta mt-6 text-white/45">{kicker}</p>
      <h1 className="display mt-2 max-w-[18ch] text-[40px] md:text-[64px]">{title}</h1>
      <p className="mt-4 max-w-2xl text-[16px] text-white/70">{lede}</p>
      <div className="mt-10 max-w-3xl space-y-10">{children}</div>
    </article>
  );
}

export function SeoCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="home-secondary inline-flex">
      {children}
    </Link>
  );
}
