import { getBackend } from "@/lib/backend";
import { jsonError, jsonOk } from "@/lib/api/errors";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/origin";

export async function GET(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  const limited = await rateLimit(`profile-public:${clientIp(req)}`, policies.search);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many profile lookups.", 429);
  const name = username.trim();
  if (name.length < 3 || name.length > 20) return jsonError("NOT_FOUND", "Player not found.", 404);
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  try {
    const profile = await backend.getPublicProfile(name);
    if (!profile) return jsonError("NOT_FOUND", "Player not found.", 404);
    return jsonOk(profile, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return jsonError("INTERNAL", "Profile unavailable.", 500);
  }
}
