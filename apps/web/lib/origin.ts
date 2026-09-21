import { headers } from "next/headers";

function clean(url: string) {
  return url.replace(/\/$/, "");
}

export function publicOrigin() {
  const app = process.env.NEXT_PUBLIC_APP_URL;
  if (app) return clean(app);
  const vercel = process.env.VERCEL_URL;
  if (vercel) return clean(vercel.startsWith("http") ? vercel : `https://${vercel}`);
  return "http://127.0.0.1:3010";
}

export async function requestOrigin() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && !host.includes("localhost") && !host.startsWith("127.0.0.1")) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return clean(`${proto}://${host}`);
    }
  } catch {
    /* static generation */
  }
  return publicOrigin();
}
