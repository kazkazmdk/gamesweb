import { AccountDeleteSchema, ProfileUpdateSchema } from "@gamesweb/database";
import { levelFromXp } from "@gamesweb/config";
import { getIdentity, identityKey, rotateGuestIdentity } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

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

export async function DELETE(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  if (!identity.userId) return jsonError("UNAUTHORIZED", "Sign in before deleting an account.", 401);
  const limited = await rateLimit(`account-delete:${identityKey(identity)}:${clientIp(req)}`, policies.accountDelete);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many account deletions.", 429);
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = AccountDeleteSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "account_delete" });
    return jsonError("INVALID_PAYLOAD", "Confirmation required.", 400);
  }
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const removed = await backend.deleteAccount(identity);
  if ("error" in removed) {
    slog("auth_failure", { reason: "account_delete" });
    return jsonError("INTERNAL", "Could not delete account.", 500);
  }
  const admin = createSupabaseAdmin();
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(identity.userId);
    if (error && !/user not found|already/i.test(error.message)) {
      slog("auth_failure", { reason: "auth_user_delete" });
    }
  }
  const supabase = await createSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  await rotateGuestIdentity();
  return jsonOk({ ok: true });
}
