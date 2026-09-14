import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };
  if (!email) return NextResponse.json({ error: "email" }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: true, mode: "local" });
  }
  const res = await fetch(`${url}/auth/v1/magiclink`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return NextResponse.json({ error: "supabase" }, { status: 502 });
  return NextResponse.json({ ok: true, mode: "supabase" });
}
