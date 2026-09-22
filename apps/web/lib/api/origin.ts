import { createHash } from "node:crypto";
import { appUrl, isVercelProduction } from "@/lib/env";
import { jsonError } from "@/lib/api/errors";

const SAFE_FETCH_SITES = new Set(["", "same-origin", "same-site", "none"]);

export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return null;

  const site = (req.headers.get("sec-fetch-site") ?? "").toLowerCase();
  if (site === "cross-site") {
    return jsonError("ORIGIN_DENIED", "Cross-site request blocked.", 403);
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) {
    // Playwright, unit tests, and server-to-server omit Sec-Fetch-Site.
    // Browser same-origin POSTs may omit Origin but send same-origin / none.
    if (SAFE_FETCH_SITES.has(site)) return null;
    return jsonError("ORIGIN_DENIED", "Missing origin.", 403);
  }

  const allowed = [appUrl()];
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? (isVercelProduction() ? "https" : "http");
    allowed.push(`${proto}://${host}`);
  }
  try {
    const o = new URL(origin).origin;
    if (allowed.some((a) => new URL(a).origin === o)) return null;
  } catch {
    return jsonError("ORIGIN_DENIED", "Invalid origin.", 403);
  }
  return jsonError("ORIGIN_DENIED", "Cross-origin request blocked.", 403);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "local";
}

export function hashKey(value: string): string {
  return createHash("sha256").update(value.toLowerCase()).digest("hex").slice(0, 32);
}
