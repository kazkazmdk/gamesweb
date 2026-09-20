"use client";

import { brand, levelFromXp } from "@gamesweb/config";
import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { analytics } from "@gamesweb/analytics";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useArcade } from "@/lib/social/use-arcade";
import { usePlayer } from "@/lib/player";
import { SavePrompt } from "@/components/meta/SavePrompt";
import { Toasts } from "@/components/meta/Toasts";
import { Search } from "@/components/shell/Search";

export const PLATFORM_ACCENT = "#d7c4a3";

const DESKTOP_NAV = [
  { href: "/", label: "Games", match: (p: string) => p === "/" },
  { href: "/arcade", label: "Arcade", match: (p: string) => p.startsWith("/arcade") || p.startsWith("/challenges") || p.startsWith("/achievements") || p.startsWith("/daily") || p.startsWith("/grand-prix") },
  { href: "/games", label: "Catalog", match: (p: string) => p === "/games" || p.startsWith("/collections") },
  { href: "/guides", label: "Guides", match: (p: string) => p.startsWith("/guides") || p.startsWith("/learn") },
];

const MOBILE_NAV = [
  { href: "/", label: "Games", match: (p: string) => p === "/", icon: HomeIcon },
  { href: "/arcade", label: "Arcade", match: (p: string) => p.startsWith("/arcade") || p.startsWith("/challenges") || p.startsWith("/achievements"), icon: ArcadeIcon },
  { href: "/friends", label: "Friends", match: (p: string) => p.startsWith("/friends") || p.startsWith("/inbox"), icon: FriendsIcon },
  { href: "/me", label: "Me", match: (p: string) => p.startsWith("/me") || p.startsWith("/profile") || p.startsWith("/settings"), icon: MeIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  const playing = path.startsWith("/play/") && path !== "/play";
  const player = usePlayer();
  const [query, setQuery] = useState(false);
  const unread = useArcade().inbox.filter((i) => !i.read).length;

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
          home ? "bg-gradient-to-b from-black/28 to-transparent" : "bg-gradient-to-b from-black/70 via-black/35 to-transparent"
        }`}
      >
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5" aria-label={brand.wordmark}>
            <BrandMark />
            <span className="display text-[15px] tracking-[0.2em] text-white uppercase">{brand.wordmark}</span>
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuery(true)}
            className="hidden h-10 w-10 place-items-center text-white/70 md:grid"
            aria-label="Search games"
          >
            <SearchIcon />
          </button>
          <Link href="/inbox" className="relative grid h-10 w-10 place-items-center text-white/70" aria-label={unread ? `Inbox, ${unread} unread` : "Inbox"}>
            <InboxIcon />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 h-2 w-2 bg-[var(--accent)]" />
            ) : null}
          </Link>
          <Link href="/me" className="relative flex h-11 items-center gap-2 pl-1" aria-label="Profile">
            <Avatar id={player.avatar} size={28} />
            <span className="hidden text-[11px] tracking-[0.16em] text-white/70 uppercase md:block">
              {levelFromXp(player.xp).level}
            </span>
            {player.backend === "local" ? (
              <span className="absolute right-0 top-1 h-2 w-2 bg-[var(--accent)]" title="Saved on this device" />
            ) : null}
          </Link>
        </div>
      </header>
      <main className={home ? "" : "pb-28 pt-[var(--header-h)] md:pb-16"}>{children}</main>
      {!home ? (
        <footer className="hidden border-t border-[var(--line)] px-8 py-6 text-[12px] text-[var(--text-faint)] md:flex md:flex-wrap md:gap-6">
          <Link href="/games">Games</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/learn">Learn</Link>
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

function InboxIcon() {
  return (
    <IconFrame>
      <rect x="3.2" y="4.5" width="11.6" height="9" rx="1.2" />
      <path d="M4 5.4 9 9.2 14 5.4" />
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

function BrandMark() {
  return (
    <svg className="home-brand-mark" width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M2 2.2 H12.2 L15.8 5.8 V16 H5.8 L2 12.2 Z" />
      <path d="M7 6.2 L12.1 9 L7 11.8 Z" className="home-brand-mark-play" />
    </svg>
  );
}

function avatarIndex(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 33 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 8;
}

function AvatarGlyph({ n }: { n: number }) {
  if (n === 0) return <path d="M6 9 L13 16 L6 23 M14 9 L21 16 L14 23" />;
  if (n === 1) return <path d="M16 6 L26 16 L16 26 L6 16 Z" />;
  if (n === 2) return <path d="M7 7 H14 V25 H7 Z M18 7 H25 V25 H18 Z" />;
  if (n === 3) return <path d="M9 6 H6 V26 H9 M23 6 H26 V26 H23" />;
  if (n === 4) return <path d="M7 7 H25 V11 H7 Z M7 14 H25 V18 H7 Z M7 21 H25 V25 H7 Z" />;
  if (n === 5) return <circle cx="16" cy="16" r="8" />;
  if (n === 6) return <path d="M16 6 L26 25 H6 Z" />;
  return <path d="M15 5 H17 V14 H26 V16 H17 V27 H15 V16 H6 V14 H15 Z" />;
}

export function Avatar({ id, size = 32 }: { id: string; size?: number }) {
  const n = avatarIndex(String(id || "0"));
  const hues = [28, 340, 192, 18, 210, 12, 46, 158];
  return (
    <span
      className="gw-avatar inline-grid place-items-center"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, hsl(${hues[n]} 16% 28%), hsl(${hues[n]} 22% 12%))`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,.16), 0 0 0 ${size >= 72 ? 2 : 1}px color-mix(in srgb, var(--accent) 40%, transparent)`,
      }}
      aria-hidden
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32" fill="none">
        <g
          stroke={`hsl(${hues[n]} 42% 78%)`}
          strokeWidth="1.7"
          fill={n === 1 ? `hsl(${hues[n]} 38% 70%)` : "none"}
        >
          <AvatarGlyph n={n} />
        </g>
      </svg>
    </span>
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
