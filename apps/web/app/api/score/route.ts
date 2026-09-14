import { NextResponse } from "next/server";
import { validateScore } from "@gamesweb/database";

const hits = new Map<string, { n: number; t: number }>();

function limited(key: string, max = 12) {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now - cur.t > 60_000) {
    hits.set(key, { n: 1, t: now });
    return false;
  }
  cur.n += 1;
  return cur.n > max;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const body = (await req.json()) as {
    sessionId: string;
    gameId: string;
    gameVersion: string;
    mode: string;
    score: number;
    durationMs: number;
    startedAt: number;
    endedAt: number;
    metadata: Record<string, number | string | boolean>;
  };
  const check = validateScore(body);
  return NextResponse.json({ ok: true, verification: check });
}
