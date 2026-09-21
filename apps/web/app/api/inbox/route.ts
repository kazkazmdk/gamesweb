import { jsonError, jsonOk, readJson } from "@/lib/api/errors";
import { getIdentity } from "@/lib/api/identity";
import { actorId, listInbox, markInboxRead } from "@/lib/backend/social-arcade";

export async function GET() {
  const identity = await getIdentity();
  return jsonOk({ items: listInbox(actorId(identity)), persistence: "server" });
}

export async function POST(req: Request) {
  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as { id?: string };
  if (!body.id) return jsonError("INVALID_PAYLOAD", "Missing id.", 400);
  const identity = await getIdentity();
  const item = markInboxRead(actorId(identity), body.id);
  if (!item) return jsonError("NOT_FOUND", "Inbox item not found.", 404);
  return jsonOk({ item });
}
