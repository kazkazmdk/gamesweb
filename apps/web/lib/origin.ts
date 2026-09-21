import { headers } from "next/headers";
import { publicOrigin } from "@/lib/env";

export async function requestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? undefined;
    const proto = h.get("x-forwarded-proto") ?? undefined;
    return publicOrigin(host, proto);
  } catch {
    return publicOrigin();
  }
}
