import { getIdentity, identityKey } from "@/lib/api/identity";
import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { slog } from "@/lib/api/log";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";

type SyncOp = {
  opId: string;
  type: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
};

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const identity = await getIdentity();
  const limited = await rateLimit(`sync:${identityKey(identity)}:${clientIp(req)}`, policies.sync);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many sync attempts.", 429);
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const ops = Array.isArray((parsed.data as { ops?: unknown }).ops)
    ? ((parsed.data as { ops: SyncOp[] }).ops.slice(0, 50) as SyncOp[])
    : [];
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);

  const applied: string[] = [];
  for (const op of ops) {
    if (!op?.opId || typeof op.opId !== "string") continue;
    const key = op.idempotencyKey ?? `sync:${op.opId}`;
    const cached = await backend.getIdempotency(key);
    if (cached) {
      applied.push(op.opId);
      continue;
    }
    try {
      if (op.type === "presence") {
        const status = op.payload?.status;
        if (status === "online" || status === "away" || status === "playing" || status === "offline") {
          await backend.upsertPresence(identity, status, typeof op.payload?.gameId === "string" ? op.payload.gameId : null);
        }
      }
      await backend.putIdempotency(key, 200, { ok: true });
      applied.push(op.opId);
    } catch {
      slog("api_error", { endpoint: "sync", type: op.type });
    }
  }

  const profile = await backend.getOrCreateProfile(identity);
  return jsonOk({ applied, profile: { xp: profile.xp, achievements: profile.achievements } });
}
