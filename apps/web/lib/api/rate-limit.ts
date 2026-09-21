import { slog } from "@/lib/api/log";
import { hasUpstash, isVercelProduction } from "@/lib/env";

type Policy = { limit: number; windowMs: number };

const memory = new Map<string, { n: number; t: number }>();

async function memoryLimit(key: string, policy: Policy): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();
  const cur = memory.get(key);
  if (!cur || now - cur.t > policy.windowMs) {
    memory.set(key, { n: 1, t: now });
    return { ok: true, remaining: policy.limit - 1 };
  }
  cur.n += 1;
  return { ok: cur.n <= policy.limit, remaining: Math.max(0, policy.limit - cur.n) };
}

async function upstashLimit(key: string, policy: Policy): Promise<{ ok: boolean; remaining: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", `gw:${key}`],
        ["EXPIRE", `gw:${key}`, Math.ceil(policy.windowMs / 1000), "NX"],
      ]),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number }>;
    const n = Number(data[0]?.result ?? 0);
    return { ok: n <= policy.limit, remaining: Math.max(0, policy.limit - n) };
  } catch {
    return null;
  }
}

export async function rateLimit(key: string, policy: Policy): Promise<{ ok: boolean; remaining: number }> {
  const remote = await upstashLimit(key, policy);
  if (remote) {
    if (!remote.ok) slog("rate_limit_triggered", { key: key.split(":")[0] ?? "unknown", limit: policy.limit });
    return remote;
  }
  if (isVercelProduction()) {
    slog("not_configured", { reason: "rate_limit_redis" });
    return { ok: false, remaining: 0 };
  }
  const result = await memoryLimit(key, policy);
  if (!result.ok) slog("rate_limit_triggered", { key: key.split(":")[0] ?? "unknown", limit: policy.limit });
  return result;
}

export function rateLimitBackend(): "upstash" | "memory" | "unconfigured" {
  if (hasUpstash()) return "upstash";
  if (isVercelProduction()) return "unconfigured";
  return "memory";
}

export const policies = {
  authIp: { limit: 5, windowMs: 15 * 60_000 },
  authEmail: { limit: 3, windowMs: 60 * 60_000 },
  score: { limit: 30, windowMs: 60_000 },
  session: { limit: 60, windowMs: 60_000 },
  friends: { limit: 20, windowMs: 60_000 },
  search: { limit: 30, windowMs: 60_000 },
  profile: { limit: 20, windowMs: 60_000 },
  merge: { limit: 5, windowMs: 60_000 },
  presence: { limit: 40, windowMs: 60_000 },
  saves: { limit: 20, windowMs: 60_000 },
  sync: { limit: 20, windowMs: 60_000 },
  partyCreate: { limit: 8, windowMs: 60_000 },
  partyJoin: { limit: 20, windowMs: 60_000 },
  partyGet: { limit: 60, windowMs: 60_000 },
  challengeCreate: { limit: 8, windowMs: 60_000 },
  challengeAttempt: { limit: 20, windowMs: 60_000 },
  inbox: { limit: 40, windowMs: 60_000 },
} as const;
