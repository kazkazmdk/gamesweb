import type { Identity } from "@/lib/api/identity";

export function actorId(identity: Identity) {
  return identity.userId ?? `anon:${identity.anonymousId}`;
}
