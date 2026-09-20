import { appUrl, isVercelProduction } from "@/lib/env";

const LOCAL = /localhost|127\.0\.0\.1|::1/;

export function siteOrigin() {
  return appUrl();
}

export function absoluteUrl(path: string) {
  const origin = siteOrigin();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isLocalhostUrl(url: string) {
  return LOCAL.test(url);
}

export function productionUsesLocalhost() {
  return Boolean(isVercelProduction() && isLocalhostUrl(siteOrigin()));
}
