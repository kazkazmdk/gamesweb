import { createHash } from "node:crypto";
import { appUrl, isVercelProduction } from "@/lib/env";
import { jsonError } from "@/lib/api/errors";

export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return null;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) {
    // Same-site navigations and some test clients omit Origin. Allow when Host matches.
    if (host) return null;
    return jsonError("ORIGIN_DENIED", "Missing origin.", 403);
  }
  let allowed: string[] = [appUrl()];
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
