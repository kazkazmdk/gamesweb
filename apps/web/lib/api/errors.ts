import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "NOT_CONFIGURED"
  | "INVALID_SCORE"
  | "SESSION_CLOSED"
  | "SESSION_MISSING"
  | "ORIGIN_DENIED"
  | "AUTH_FAILURE"
  | "MERGE_FAILURE"
  | "INTERNAL";

export function jsonError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function jsonOk<T>(body: T, init?: { status?: number; headers?: HeadersInit }) {
  return NextResponse.json(body, init);
}

export async function readJson(req: Request): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  const text = await req.text();
  if (!text) return { ok: true, data: {} };
  if (text.length > 120_000) return { ok: false, response: jsonError("INVALID_PAYLOAD", "Payload too large.", 413) };
  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: jsonError("INVALID_JSON", "Body must be JSON.", 400) };
  }
}
