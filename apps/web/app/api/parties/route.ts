import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { getIdentity } from "@/lib/api/identity";
import { actorId, createParty, getParty, joinParty, scorePartyRound, setPartyReady } from "@/lib/backend/social-arcade";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").toUpperCase();
  if (!code) return jsonError("INVALID_PAYLOAD", "Missing code.", 400);
  const party = getParty(code);
  if (!party) return jsonError("NOT_FOUND", "Party not found on this instance.", 404);
  return jsonOk({ party, persistence: "server" });
}

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as {
    action?: "create" | "join" | "ready" | "score";
    hostName?: string;
    name?: string;
    code?: string;
    ready?: boolean;
    gameId?: string;
    rows?: Array<{ id: string; name: string; score: number }>;
  };
  const identity = await getIdentity();
  const id = actorId(identity);
  const action = body.action ?? "create";
  if (action === "create") {
    const party = createParty(id, body.hostName ?? "Host");
    return jsonOk({ party, persistence: "server" });
  }
  const code = (body.code ?? "").toUpperCase();
  if (!code) return jsonError("INVALID_PAYLOAD", "Missing code.", 400);
  if (action === "join") {
    const joined = joinParty(code, id, body.name ?? "Player");
    if (!joined.ok) return jsonError(joined.error === "full" ? "CONFLICT" : "NOT_FOUND", joined.error === "full" ? "Party is full." : "Party not found.", joined.error === "full" ? 409 : 404);
    return jsonOk({ party: joined.party, persistence: "server" });
  }
  if (action === "ready") {
    const party = setPartyReady(code, id, Boolean(body.ready));
    if (!party) return jsonError("NOT_FOUND", "Party not found.", 404);
    return jsonOk({ party, persistence: "server" });
  }
  if (action === "score") {
    if (!body.gameId || !Array.isArray(body.rows)) return jsonError("INVALID_PAYLOAD", "Need gameId and rows.", 400);
    const party = scorePartyRound(code, body.rows, body.gameId);
    if (!party) return jsonError("NOT_FOUND", "Party not found.", 404);
    return jsonOk({ party, persistence: "server" });
  }
  return jsonError("INVALID_PAYLOAD", "Unknown action.", 400);
}
