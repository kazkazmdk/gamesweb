import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { appUrl, supabasePublishableKey, supabaseUrl } from "@/lib/env";
import { slog } from "@/lib/api/log";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const origin = appUrl();
  const safeNext = next.startsWith("/") ? next : "/";

  if (!code) {
    slog("auth_failure", { reason: "missing_code" });
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  const url = supabaseUrl();
  const key = supabasePublishableKey();
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/auth?error=not_configured`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    slog("auth_failure", { reason: "exchange" });
    return NextResponse.redirect(`${origin}/auth?error=exchange`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    slog("auth_failure", { reason: "no_user" });
    return NextResponse.redirect(`${origin}/auth?error=session`);
  }

  return NextResponse.redirect(`${origin}/auth/complete?next=${encodeURIComponent(safeNext)}`);
}
