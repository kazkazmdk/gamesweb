import { GAME_MANIFESTS } from "@gamesweb/game-sdk";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("game") ?? GAME_MANIFESTS[0].id;
  const showSeed = process.env.NEXT_PUBLIC_SHOW_SEED_DATA === "true";
  const rows = showSeed
    ? [
        { name: "RIVAL_01", score: 48000, seed: true },
        { name: "RIVAL_02", score: 41000, seed: true },
      ]
    : [];
  return NextResponse.json({ gameId, rows });
}
