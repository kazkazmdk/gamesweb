import { AuthMagicLinkSchema } from "@gamesweb/database";
import { verifyTurnstile } from "@/lib/api/captcha";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp, hashKey } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { appUrl, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const ip = clientIp(req);
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = AuthMagicLinkSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "auth" });
    return jsonError("INVALID_PAYLOAD", "Valid email required.", 400);
  }

  const ipLimit = await rateLimit(`auth-ip:${ip}`, policies.authIp);
  const mailLimit = await rateLimit(`auth-email:${hashKey(body.data.email)}`, policies.authEmail);
  if (!ipLimit.ok || !mailLimit.ok) return jsonError("RATE_LIMITED", "Too many sign-in attempts.", 429);

  const captcha = await verifyTurnstile(body.data.captchaToken, ip);
  if (!captcha) {
    slog("auth_failure", { reason: "captcha" });
    return jsonError("AUTH_FAILURE", "Captcha failed.", 400);
  }

  if (!isSupabaseConfigured()) {
    return jsonOk({ ok: false, mode: "local", code: "NOT_CONFIGURED" as const });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return jsonOk({ ok: false, mode: "local", code: "NOT_CONFIGURED" as const });
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: body.data.email,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback`,
      shouldCreateUser: true,
      captchaToken: body.data.captchaToken,
    },
  });
  if (error) {
    slog("auth_failure", { reason: "supabase" });
    return jsonError("AUTH_FAILURE", "Could not send sign-in email.", 502);
  }
  return jsonOk({ ok: true, mode: "supabase" });
}
