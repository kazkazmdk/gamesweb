import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { appUrl, supabasePublishableKey, supabaseUrl } from "@/lib/env";
import { slog } from "@/lib/api/log";
import { safePath } from "@/lib/auth/safe-path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safePath(searchParams.get("next"));
  const origin = appUrl();

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

  let errorName: string | null = null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) errorName = "exchange";
  } else if (tokenHash && type) {
    const otpType = type as "email" | "magiclink" | "recovery" | "invite" | "email_change" | "signup";
    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
    if (error) errorName = "verify";
  } else {
    slog("auth_failure", { reason: "missing_code" });
    return NextResponse.redirect(`${origin}/auth?error=missing_link`);
  }

  if (errorName) {
    slog("auth_failure", { reason: errorName });
    return NextResponse.redirect(`${origin}/auth?error=${errorName}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    slog("auth_failure", { reason: "no_user" });
    return NextResponse.redirect(`${origin}/auth?error=session`);
  }

  return NextResponse.redirect(`${origin}/auth/complete?next=${encodeURIComponent(next)}`);
}
