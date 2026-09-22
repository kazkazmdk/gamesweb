import { actorId } from "@/lib/api/actor";
import type { Identity } from "@/lib/api/identity";
import { getBackend } from "@/lib/backend";
import { resetMemoryStore } from "@/lib/backend/memory";
import type { StoredInbox, StoredParty } from "@/lib/backend/types";

export type SocialParty = StoredParty;
export type SocialInbox = StoredInbox;

export { actorId };

export function resetSocialArcade() {
  return resetMemoryStore();
}

function requireBackend() {
  const backend = getBackend();
  if (!backend) throw new Error("backend_missing");
  return backend;
}

export async function createParty(identity: Identity, hostName: string) {
  return requireBackend().createParty(identity, hostName);
}

export async function getParty(code: string) {
  return requireBackend().getParty(code);
}

export async function joinParty(identity: Identity, code: string, name: string) {
  return requireBackend().joinParty(identity, code, name);
}

export async function setPartyReady(identity: Identity, code: string, ready: boolean) {
  return requireBackend().setPartyReady(identity, code, ready);
}

export async function startParty(identity: Identity, code: string) {
  return requireBackend().startParty(identity, code);
}

export async function advanceParty(identity: Identity, code: string) {
  return requireBackend().advanceParty(identity, code);
}

export async function submitPartyRound(identity: Identity, code: string, runId: string) {
  return requireBackend().submitPartyRound(identity, code, runId);
}

export async function createChallengeFromRun(identity: Identity, runId: string, type?: string) {
  return requireBackend().createChallengeFromRun(identity, runId, type);
}

export async function getChallenge(code: string) {
  return requireBackend().getChallenge(code);
}

export async function putChallenge(challenge: import("@gamesweb/game-sdk").ChallengeRecord) {
  return requireBackend().putChallenge(challenge);
}

export async function attemptChallengeFromRun(identity: Identity, code: string, runId: string) {
  return requireBackend().attemptChallengeFromRun(identity, code, runId);
}

export async function listInbox(identity: Identity) {
  return requireBackend().listInbox(identity);
}

export async function markInboxRead(identity: Identity, id: string) {
  return requireBackend().markInboxRead(identity, id);
}

export async function listRivals(identity: Identity) {
  return requireBackend().listRivals(identity);
}
