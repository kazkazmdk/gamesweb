import type { IndexStatus } from "./types";

export const APP_PATH_PREFIXES = [
  "/play",
  "/settings",
  "/me",
  "/friends",
  "/inbox",
  "/party",
  "/crew",
  "/auth",
  "/challenges",
  "/c/",
  "/arcade",
  "/leaderboards",
  "/achievements",
  "/daily",
  "/grand-prix",
  "/profile",
] as const;

export function isPrivatePath(path: string): boolean {
  if (path === "/play" || path.startsWith("/play/")) return true;
  return APP_PATH_PREFIXES.some((prefix) => {
    if (prefix.endsWith("/")) return path.startsWith(prefix);
    return path === prefix || path.startsWith(`${prefix}/`);
  });
}

export function robotsForStatus(status: IndexStatus): {
  robots: { index: boolean; follow: boolean; nocache?: boolean; googleBot?: { index: boolean; follow: boolean } };
} {
  if (status === "INDEXABLE") {
    return { robots: { index: true, follow: true } };
  }
  if (status === "NOINDEX_APP") {
    return { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } };
  }
  return { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } };
}

export const NOINDEX_APP = robotsForStatus("NOINDEX_APP");
export const NOINDEX_PRIVATE = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
} as const;
export const INDEX = robotsForStatus("INDEXABLE");
