"use client";

import { brand } from "@gamesweb/config";
import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { usePlayer } from "@/lib/player";
import { SavePrompt } from "@/components/meta/SavePrompt";
import { Toasts } from "@/components/meta/Toasts";
import { Search } from "@/components/shell/Search";

export const PLATFORM_ACCENT = "#d7c4a3";

const DESKTOP_NAV = [
  { href: "/", label: "Games", match: (p: string) => p === "/" },
  { href: "/arcade", label: "Arcade", match: (p: string) => p.startsWith("/arcade") || p.startsWith("/challenges") || p.startsWith("/achievements") },
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

  const home = path === "/";

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
      <header
        className={`fixed inset-x-0 top-0 z-40 flex h-[var(--header-h)] items-center justify-between px-5 pt-[var(--safe-top)] md:px-8 ${
          home ? "bg-gradient-to-b from-black/55 to-transparent" : "bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-md"
        }`}
      >
        <div className="flex items-center gap-7">
          <Link href="/" className="display text-[13px] tracking-[0.22em] text-white/45 uppercase">
            {brand.wordmark}
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] text-white/55 md:flex" aria-label="Primary">
            {DESKTOP_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.match(path) ? "nav-active pb-0.5 text-white" : "hover:text-white"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuery(true)}
            className="grid h-10 w-10 place-items-center text-white/70"
            aria-label="Search games"
          >
            <SearchIcon />
          </button>
          <Link href="/settings" className="grid h-10 w-10 place-items-center text-white/70" aria-label="Settings">
            <SettingsIcon />
          </Link>
          <Link href="/me" className="relative grid h-10 w-10 place-items-center" aria-label="Profile">
            <Avatar id={player.avatar} size={28} />
            {player.backend === "local" ? (
              <span
                className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[var(--accent)]"
                title="Saved on this device"
              />
            ) : null}
          </Link>
        </div>
      </header>
      <main className={home ? "" : "pb-28 pt-[var(--header-h)] md:pb-16"}>{children}</main>
      {!home ? (
        <footer className="hidden border-t border-[var(--line)] px-8 py-6 text-[12px] text-[var(--text-faint)] md:flex md:gap-6">
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </footer>
      ) : null}
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

function SettingsIcon() {
  return (
    <IconFrame>
      <circle cx="9" cy="9" r="2.2" />
      <path d="M9 3.4 V5.2 M9 12.8 V14.6 M3.4 9 H5.2 M12.8 9 H14.6 M5 5 L6.3 6.3 M11.7 11.7 L13 13 M13 5 L11.7 6.3 M6.3 11.7 L5 13" />
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
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,.12), 0 0 0 ${size >= 72 ? 3 : 2}px color-mix(in srgb, var(--accent) 35%, transparent)`,
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
