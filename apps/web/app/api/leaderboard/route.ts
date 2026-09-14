import { LeaderboardQuerySchema, assertMode } from "@gamesweb/database";
import { jsonError, jsonOk } from "@/lib/api/errors";
import { getBackend } from "@/lib/backend";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = LeaderboardQuerySchema.safeParse({
    game: url.searchParams.get("game") ?? url.searchParams.get("gameId"),
    mode: url.searchParams.get("mode") ?? "circuit",
    limit: url.searchParams.get("limit") ?? "10",
  });
  if (!parsed.success) return jsonError("INVALID_PAYLOAD", "Invalid leaderboard query.", 400);
  if (!assertMode(parsed.data.game, parsed.data.mode)) {
    return jsonError("INVALID_PAYLOAD", "Unknown mode for this game.", 400);
  }

  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);

  const rows = await backend.leaderboard(parsed.data.game, parsed.data.mode, parsed.data.limit);
  return jsonOk(
    {
      gameId: parsed.data.game,
      mode: parsed.data.mode,
      rows,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    },
  );
}
