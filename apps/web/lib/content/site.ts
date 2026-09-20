import { brand } from "@gamesweb/config";

const CONTENT_STAMP = "2026-09-20";

export const CONTENT_UPDATED = CONTENT_STAMP;

export function publicOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const origin = publicOrigin();
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isoDate(day = CONTENT_STAMP): string {
  return `${day}T00:00:00.000Z`;
}

export function gameImage(slug: string, variant: "hero" | "tile" | "backdrop" = "hero"): string {
  if (variant === "backdrop") return `/art/${slug}-backdrop.jpg`;
  if (variant === "tile") return `/art/${slug}-hero.jpg`;
  return `/art/${slug}-hero.jpg`;
}

export const SITE = {
  name: brand.productName,
  tagline: brand.tagline,
  description: brand.description,
} as const;
