import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl, isVercelProduction } from "@/lib/env";

function nonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}

function csp(n: string, dev: boolean) {
  const supabase = supabaseUrl() ?? "";
  const posthog = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  const connect = [
    "'self'",
    supabase,
    supabase.replace("https://", "wss://"),
    posthog,
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://*.posthog.com",
  ]
    .filter(Boolean)
    .join(" ");
  const script = dev
    ? `'self' 'nonce-${n}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'nonce-${n}' 'strict-dynamic' 'unsafe-inline'`;
  // unsafe-inline stays as a CSP3 fallback. Removing it broke Next hydration + Phaser boot in Playwright.
  return [
    `default-src 'self'`,
    `script-src ${script}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src ${connect}`,
    `media-src 'self' blob:`,
    `worker-src 'self' blob:`,
    `child-src 'self' blob:`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  const n = nonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", n);
  requestHeaders.set("x-request-id", crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  requestHeaders.set("Content-Security-Policy", csp(n, dev));

  const url = supabaseUrl();
  const key = supabasePublishableKey();
  let res = NextResponse.next({ request: { headers: requestHeaders } });

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }

  res.headers.set("Content-Security-Policy", csp(n, dev));
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (isVercelProduction()) {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|art/|icons/).*)"],
};
