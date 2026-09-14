import { idempotencyScope, StartSessionSchema } from "@gamesweb/database";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";
import { APP_VERSION, commitSha } from "@/lib/version";

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  const limited = await rateLimit(`session:${identityKey(identity)}:${clientIp(req)}`, policies.session);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many sessions.", 429);

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = StartSessionSchema.safeParse(parsed.data);
  if (!body.success) {
    slog("invalid_payload", { endpoint: "session" });
    return jsonError("INVALID_PAYLOAD", "Invalid session payload.", 400);
  }

  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);

  const scope = idempotencyScope(identity);
  if (body.data.idempotencyKey) {
    const hit = await backend.getIdempotency(scope, `session:${body.data.idempotencyKey}`);
    if (hit) return jsonOk(hit.response, { status: hit.status });
  }

  const session = await backend.startSession({
    identity,
    gameId: body.data.gameId,
    gameVersion: body.data.gameVersion,
    device: body.data.device ?? "desktop",
    buildSha: commitSha(),
    appVersion: APP_VERSION,
  });

  const payload = {
    sessionId: session.id,
    startedAt: new Date(session.startedAt).toISOString(),
    gameVersion: session.gameVersion,
  };
  if (body.data.idempotencyKey) {
    await backend.putIdempotency(scope, `session:${body.data.idempotencyKey}`, "session", 200, payload, identity);
  }
  return jsonOk(payload);
}
