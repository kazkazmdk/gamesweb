import { ProfileUpdateSchema } from "@gamesweb/database";
import { levelFromXp } from "@gamesweb/config";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";

export async function GET() {
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const identity = await getIdentity();
  const profile = await backend.getOrCreateProfile(identity);
  return jsonOk(
    {
      id: profile.userId,
      isGuest: profile.isGuest,
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.avatar,
      xp: profile.xp,
      level: levelFromXp(profile.xp).level,
      streak: profile.streak,
      shareActivity: profile.shareActivity,
      sharePresence: profile.sharePresence,
      sharePublicActivity: profile.sharePublicActivity,
      achievements: profile.achievements,
      achievementUnlocks: profile.achievementUnlocks,
      questCompleted: profile.questCompleted,
      questProgress: profile.questProgress,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PATCH(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  const limited = await rateLimit(`profile:${identityKey(identity)}:${clientIp(req)}`, policies.profile);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many profile updates.", 429);
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = ProfileUpdateSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "profile" });
    return jsonError("INVALID_PAYLOAD", "Invalid profile payload.", 400);
  }
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const result = await backend.updateProfile(identity, body.data);
  if ("error" in result) return jsonError("CONFLICT", result.error === "username_taken" ? "Username taken." : "Update failed.", 409);
  return jsonOk({
    username: result.username,
    displayName: result.displayName,
    avatar: result.avatar,
    shareActivity: result.shareActivity,
    sharePresence: result.sharePresence,
    sharePublicActivity: result.sharePublicActivity,
  });
}
