const LOCAL = /localhost|127\.0\.0\.1|::1/;

export function siteOrigin() {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return raw;
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
  const prod = process.env.VERCEL_ENV === "production";
  return Boolean(prod && isLocalhostUrl(siteOrigin()));
}
