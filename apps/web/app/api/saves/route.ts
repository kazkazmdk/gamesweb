import { boundedJsonSize, GameSaveSchema } from "@gamesweb/database";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";

export async function GET(req: Request) {
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const identity = await getIdentity();
  const gameId = new URL(req.url).searchParams.get("game");
  if (!gameId) return jsonError("INVALID_PAYLOAD", "game query required.", 400);
  const save = await backend.getSave(identity, gameId);
  return jsonOk({ save }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  const limited = await rateLimit(`saves:${identityKey(identity)}:${clientIp(req)}`, policies.saves);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many saves.", 429);
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = GameSaveSchema.safeParse(parsed.data);
  if (!body.success || !boundedJsonSize(body.data.payload)) {
    slog("invalid_payload", { endpoint: "saves" });
    return jsonError("INVALID_PAYLOAD", "Invalid or oversized save.", 400);
  }
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const result = await backend.putSave(identity, {
    gameId: body.data.gameId,
    version: body.data.version,
    payload: body.data.payload,
    updatedAt: body.data.updatedAt ?? Date.now(),
  });
  if ("error" in result) {
    return jsonError(result.error === "auth_required" ? "UNAUTHORIZED" : "INTERNAL", "Could not store save.", result.error === "auth_required" ? 401 : 500);
  }
  return jsonOk({ save: result });
}
