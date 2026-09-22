import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { getIdentity, identityKey } from "@/lib/api/identity";
import { assertSameOrigin, clientIp } from "@/lib/api/origin";
import { policies, rateLimit } from "@/lib/api/rate-limit";
import { getBackend } from "@/lib/backend";
import { actorId, advanceParty, createParty, getParty, joinParty, setPartyReady, startParty, submitPartyRound } from "@/lib/backend/social-arcade";

export async function GET(req: Request) {
  const identity = await getIdentity();
  const limited = await rateLimit(`party-get:${identityKey(identity)}:${clientIp(req)}`, policies.partyGet);
  if (!limited.ok) return jsonError("RATE_LIMITED", "Too many party lookups.", 429);
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").toUpperCase();
  if (!code) return jsonError("INVALID_PAYLOAD", "Missing code.", 400);
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const party = await getParty(code);
  if (!party) return jsonError("NOT_FOUND", "Party not found.", 404);
  return jsonOk({ party, persistence: "server", you: actorId(identity) });
}

export async function POST(req: Request) {
  const denied = assertSameOrigin(req);
  if (denied) return denied;
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as {
    action?: "create" | "join" | "ready" | "start" | "advance" | "submit-round" | "score";
    hostName?: string;
    name?: string;
    code?: string;
    ready?: boolean;
    runId?: string;
  };
  const identity = await getIdentity();
  const backend = getBackend();
  if (!backend) return jsonError("NOT_CONFIGURED", "Backend is not configured.", 503);
  const action = body.action ?? "create";
  if (action === "score") {
    return jsonError("FORBIDDEN", "Client standings are not accepted. Submit your own runId.", 403);
  }
  if (action === "create") {
    const limited = await rateLimit(`party-create:${identityKey(identity)}:${clientIp(req)}`, policies.partyCreate);
    if (!limited.ok) return jsonError("RATE_LIMITED", "Too many parties.", 429);
    const party = await createParty(identity, body.hostName ?? "Host");
    return jsonOk({ party, persistence: "server", you: actorId(identity) });
  }
  const code = (body.code ?? "").toUpperCase();
  if (!code) return jsonError("INVALID_PAYLOAD", "Missing code.", 400);
  if (action === "join") {
    const limited = await rateLimit(`party-join:${identityKey(identity)}:${clientIp(req)}`, policies.partyJoin);
    if (!limited.ok) return jsonError("RATE_LIMITED", "Too many join attempts.", 429);
    const joined = await joinParty(identity, code, body.name ?? "Player");
    if (!joined.ok) {
      const status = joined.error === "full" ? 409 : joined.error === "closed" ? 409 : 404;
      return jsonError(joined.error === "full" || joined.error === "closed" ? "CONFLICT" : "NOT_FOUND", joined.error === "full" ? "Party is full." : joined.error === "closed" ? "Party is not joinable." : "Party not found.", status);
    }
    return jsonOk({ party: joined.party, persistence: "server", you: actorId(identity) });
  }
  if (action === "ready") {
    const party = await setPartyReady(identity, code, Boolean(body.ready));
    if (!party) return jsonError("NOT_FOUND", "Party not found.", 404);
    return jsonOk({ party, persistence: "server", you: actorId(identity) });
  }
  if (action === "start") {
    const party = await startParty(identity, code);
    if ("error" in party) return jsonError(party.error === "host_only" ? "FORBIDDEN" : "CONFLICT", party.error, party.error === "host_only" ? 403 : 409);
    return jsonOk({ party, persistence: "server", you: actorId(identity) });
  }
  if (action === "advance") {
    const party = await advanceParty(identity, code);
    if ("error" in party) return jsonError(party.error === "host_only" ? "FORBIDDEN" : "CONFLICT", party.error, party.error === "host_only" ? 403 : 409);
    return jsonOk({ party, persistence: "server", you: actorId(identity) });
  }
  if (action === "submit-round") {
    if (!body.runId) return jsonError("INVALID_PAYLOAD", "Need runId.", 400);
    const party = await submitPartyRound(identity, code, body.runId);
    if ("error" in party) {
      const forbidden = party.error === "not_member" || party.error === "run_forbidden" || party.error === "not_in_round";
      return jsonError(forbidden ? "FORBIDDEN" : party.error === "not_found" ? "NOT_FOUND" : "CONFLICT", party.error, forbidden ? 403 : party.error === "not_found" ? 404 : 409);
    }
    return jsonOk({ party, persistence: "server", you: actorId(identity) });
  }
  return jsonError("INVALID_PAYLOAD", "Unknown action.", 400);
}
