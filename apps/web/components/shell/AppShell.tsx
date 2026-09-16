"use client";

import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { usePlayer } from "@/lib/player";
import { levelFromXp } from "@gamesweb/config";
import { SavePrompt } from "@/components/meta/SavePrompt";
import { Toasts } from "@/components/meta/Toasts";
import { Search } from "@/components/shell/Search";

export const PLATFORM_ACCENT = "#d7c4a3";

const DESKTOP_NAV = [
  { href: "/", label: "Games", match: (p: string) => p === "/" },
  { href: "/arcade", label: "Arcade", match: (p: string) => p.startsWith("/arcade") || p.startsWith("/challenges") || p.startsWith("/achievements") },
  { href: "/leaderboards", label: "Boards", match: (p: string) => p.startsWith("/leaderboards") },
  { href: "/friends", label: "Friends", match: (p: string) => p.startsWith("/friends") },
];

const MOBILE_NAV = [
  { href: "/", label: "Games", match: (p: string) => p === "/", icon: HomeIcon },
  { href: "/arcade", label: "Arcade", match: (p: string) => p.startsWith("/arcade") || p.startsWith("/challenges") || p.startsWith("/achievements"), icon: ArcadeIcon },
  { href: "/friends", label: "Friends", match: (p: string) => p.startsWith("/friends"), icon: FriendsIcon },
  { href: "/me", label: "Me", match: (p: string) => p.startsWith("/me") || p.startsWith("/profile") || p.startsWith("/settings"), icon: MeIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  const playing = path.startsWith("/play/") && path !== "/play";
  const player = usePlayer();
  const lv = levelFromXp(player.xp);
  const [query, setQuery] = useState(false);

  useEffect(() => {
    analytics.page(path);
  }, [path]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", player.settings.reducedMotion);
  }, [player.settings.reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery(true);
      }
      if (e.key === "Escape" && query) {
        e.preventDefault();
        setQuery(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query]);

  if (playing) {
    return (
      <>
        {children}
        <Toasts />
      </>
    );
  }

  return (
    <div className="min-h-dvh">
      {player.backend === "local" ? (
        <p className="bg-[color-mix(in_srgb,var(--accent)_16%,var(--bg))] px-5 py-2 text-center text-[12px] text-[var(--text-dim)] md:px-8">
          Guest / this device. Scores stay local. No account sync.
        </p>
      ) : null}
      <header className="sticky top-0 z-40 flex h-[var(--header-h)] items-center justify-between px-5 pt-[var(--safe-top)] md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="display text-[22px] tracking-[-0.06em]">
            {brand.wordmark}
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-[var(--text-dim)] md:flex" aria-label="Primary">
            {DESKTOP_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.match(path) ? "nav-active pb-0.5" : "hover:text-[var(--text)]"}
              >
                {item.label}
              </Link>
            ))}
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
      <main className="pb-28 md:pb-16">{children}</main>
      <footer className="hidden border-t border-[var(--line)] px-8 py-6 text-[12px] text-[var(--text-faint)] md:flex md:gap-6">
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] pb-[var(--safe-bottom)] backdrop-blur-md md:hidden"
        aria-label="Mobile"
      >
        {MOBILE_NAV.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${item.match(path) ? "text-[var(--text)]" : "text-[var(--text-dim)]"}`}
          >
            <item.icon />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          aria-label="Search"
          className="flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] text-[var(--text-dim)]"
          onClick={() => setQuery(true)}
        >
          <SearchIcon />
          Search
        </button>
        {MOBILE_NAV.slice(2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${item.match(path) ? "text-[var(--text)]" : "text-[var(--text-dim)]"}`}
          >
            <item.icon />
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

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <IconFrame>
      <path d="M3 8.2 9 3.5 15 8.2V15H11.2V11H6.8v4H3Z" />
    </IconFrame>
  );
}

function ArcadeIcon() {
  return (
    <IconFrame>
      <rect x="4" y="6" width="10" height="8" rx="1.5" />
      <path d="M7 6V4.5h4V6" />
      <circle cx="7.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </IconFrame>
  );
}

function SearchIcon() {
  return (
    <IconFrame>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M10.6 10.6 14 14" />
    </IconFrame>
  );
}

function FriendsIcon() {
  return (
    <IconFrame>
      <circle cx="7" cy="6.5" r="2.1" />
      <path d="M3.4 14c.4-2.2 2-3.4 3.6-3.4S10.2 11.8 10.6 14" />
      <circle cx="12.2" cy="7" r="1.7" />
      <path d="M12 10.8c1.4.1 2.6 1.2 3 3.2" />
    </IconFrame>
  );
}

function MeIcon() {
  return (
    <IconFrame>
      <circle cx="9" cy="6.4" r="2.2" />
      <path d="M4.2 14.2c.6-2.6 2.4-3.8 4.8-3.8s4.2 1.2 4.8 3.8" />
    </IconFrame>
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
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", color || PLATFORM_ACCENT);
    return () => {
      document.documentElement.style.setProperty("--accent", PLATFORM_ACCENT);
    };
  }, [color]);
}
