"use client";

import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlayer, useStore, useToasts } from "@/lib/player";
import { levelFromXp } from "@gamesweb/config";
import { SavePrompt } from "@/components/meta/SavePrompt";
import { Toasts } from "@/components/meta/Toasts";
import { Search } from "@/components/shell/Search";

const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/play", label: "Play", match: (p: string) => p.startsWith("/play") || p.startsWith("/games") },
  { href: "/challenges", label: "Challenges", match: (p: string) => p.startsWith("/challenges") },
  { href: "/friends", label: "Friends", match: (p: string) => p.startsWith("/friends") },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "/";
  const playing = path.startsWith("/play/") && path !== "/play";
  const player = usePlayer();
  const lv = levelFromXp(player.xp);
  const [query, setQuery] = useState(false);

  useEffect(() => {
    analytics.page(path);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (playing) {
    return (
      <>
        {children}
        <Toasts />
        <SavePrompt />
      </>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex h-[var(--header-h)] items-center justify-between px-5 pt-[var(--safe-top)] md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="display text-[22px] tracking-[-0.06em]">
            {brand.wordmark}
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-[var(--text-dim)] md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.match(path) ? "text-[var(--text)]" : "hover:text-[var(--text)]"}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/leaderboards" className={path.startsWith("/leaderboards") ? "text-[var(--text)]" : "hover:text-[var(--text)]"}>
              Boards
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuery(true)}
            className="hidden h-9 items-center rounded-full border border-[var(--line)] px-3 text-[12px] text-[var(--text-dim)] md:flex"
            aria-label="Search games"
          >
            Search
            <kbd className="ml-2 text-[10px] text-[var(--text-faint)]">⌘K</kbd>
          </button>
          <Link href="/me" className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3">
            <span className="hidden text-right text-[11px] leading-tight md:block">
              <span className="block text-[var(--text-dim)]">{player.streak}d streak</span>
              <span className="text-[var(--text)]">Lv {lv.level}</span>
            </span>
            <Avatar id={player.avatar} />
          </Link>
        </div>
      </header>
      <main className="pb-24 md:pb-16">{children}</main>
      <footer className="hidden border-t border-[var(--line)] px-8 py-6 text-[12px] text-[var(--text-faint)] md:flex md:gap-6">
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] pb-[var(--safe-bottom)] backdrop-blur-md md:hidden"
        aria-label="Mobile"
      >
        {[
          ...NAV,
          { href: "/me", label: "Me", match: (p: string) => p.startsWith("/me") || p.startsWith("/profile") },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-14 flex-col items-center justify-center text-[11px] ${item.match(path) ? "text-[var(--text)]" : "text-[var(--text-dim)]"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {query ? <Search games={GAME_MANIFESTS} onClose={() => setQuery(false)} /> : null}
      <Toasts />
      <SavePrompt />
    </div>
  );
}

export function Avatar({ id, size = 32 }: { id: string; size?: number }) {
  const n = Number(String(id).replace(/\D/g, "") || 0) % 8;
  const hues = [28, 340, 190, 18, 210, 12, 45, 160];
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 210deg, hsl(${hues[n]} 18% 62%), hsl(${hues[n]} 10% 22%))`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)",
      }}
      aria-hidden
    />
  );
}

export function useAccent(color?: string) {
  const store = useStore();
  void store;
  useEffect(() => {
    if (!color) return;
    document.documentElement.style.setProperty("--accent", color);
  }, [color]);
}
