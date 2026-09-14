import { cookies } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/server";

export const GUEST_COOKIE = "gw_guest";

export type Identity = {
  userId: string | null;
  anonymousId: string;
  email: string | null;
};

export async function getIdentity(): Promise<Identity> {
  const jar = await cookies();
  let anonymousId = jar.get(GUEST_COOKIE)?.value;
  if (!anonymousId || anonymousId.length < 8) {
    anonymousId = crypto.randomUUID();
    try {
      jar.set(GUEST_COOKIE, anonymousId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.VERCEL_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
      });
    } catch {
      // Server Components cannot always set cookies.
    }
  }

  const supabase = await createSupabaseServer();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return { userId: data.user.id, anonymousId, email: data.user.email ?? null };
    }
  }
  return { userId: null, anonymousId, email: null };
}

export function identityKey(id: Identity): string {
  return id.userId ?? `anon:${id.anonymousId}`;
}
