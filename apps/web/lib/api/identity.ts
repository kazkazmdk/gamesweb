import { cookies } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/server";

export const GUEST_COOKIE = "gw_guest";

export function guestCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.VERCEL_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  };
}

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
      jar.set(GUEST_COOKIE, anonymousId, guestCookieOptions());
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

export async function rotateGuestIdentity(): Promise<string> {
  const jar = await cookies();
  const anonymousId = crypto.randomUUID();
  jar.set(GUEST_COOKIE, anonymousId, guestCookieOptions());
  return anonymousId;
}

export function identityKey(id: Identity): string {
  return id.userId ?? `anon:${id.anonymousId}`;
}

export { actorId } from "@/lib/api/actor";
