import { jsonError, jsonOk } from "@/lib/api/errors";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  const limited = await rateLimit(`logout:${identityKey(identity)}:${clientIp(req)}`, policies.accountLogout);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many sign-out attempts.", 429);

  const supabase = await createSupabaseServer();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return jsonOk({ ok: true });
}
