import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { gameId?: string };
  return NextResponse.json({
    id: crypto.randomUUID(),
    gameId: body.gameId ?? null,
    startedAt: Date.now(),
  });
}
