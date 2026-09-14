import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, local: !process.env.NEXT_PUBLIC_SUPABASE_URL, received: Boolean(body) });
}
