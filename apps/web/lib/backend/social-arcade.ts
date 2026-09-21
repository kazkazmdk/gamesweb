import { applyChallengeAttempt, getManifest, makePublicCode, QUICK_PARTY_PLAYLIST, rankScores, type ChallengeAttempt, type ChallengeRecord, type ChallengeType } from "@gamesweb/game-sdk";
import { lowerIsBetter } from "@gamesweb/database";
import type { Identity } from "@/lib/api/identity";

export type SocialParty = {
  id: string;
  code: string;
  host: string;
  members: Array<{ id: string; name: string; ready: boolean; score: number }>;
  playlist: Array<{ gameId: string; mode: string }>;
  round: number;
  state: "lobby" | "playing" | "results" | "done";
  standings: Array<{ id: string; name: string; points: number }>;
  createdAt: number;
  persistence: "server";
};

export type SocialInbox = {
  id: string;
  userId: string;
  type: "challenge" | "friend" | "rival" | "party" | "crew" | "leaderboard";
  title: string;
  body: string;
  href: string;
  at: number;
  read: boolean;
};

type Bag = {
  parties: Map<string, SocialParty>;
  challenges: Map<string, ChallengeRecord>;
  inbox: SocialInbox[];
};

type G = typeof globalThis & { __gw_social_arcade?: Bag };

function bag(): Bag {
  const g = globalThis as G;
  if (!g.__gw_social_arcade) {
    g.__gw_social_arcade = { parties: new Map(), challenges: new Map(), inbox: [] };
  }
  return g.__gw_social_arcade;
}

export function resetSocialArcade() {
  const g = globalThis as G;
  g.__gw_social_arcade = { parties: new Map(), challenges: new Map(), inbox: [] };
  return g.__gw_social_arcade;
}

export function actorId(identity: Identity) {
  return identity.userId ?? `anon:${identity.anonymousId}`;
}

function uid() {
  return crypto.randomUUID();
}

export function createParty(hostId: string, hostName: string): SocialParty {
  const party: SocialParty = {
    id: uid(),
    code: makePublicCode(),
    host: hostId,
    members: [{ id: hostId, name: hostName, ready: true, score: 0 }],
    playlist: QUICK_PARTY_PLAYLIST.map((r) => ({ ...r })),
    round: 0,
    state: "lobby",
    standings: [],
    createdAt: Date.now(),
    persistence: "server",
  };
  bag().parties.set(party.code, party);
  return structuredClone(party);
}

export function getParty(code: string): SocialParty | null {
  const hit = bag().parties.get(code.toUpperCase());
  return hit ? structuredClone(hit) : null;
}

export function joinParty(code: string, id: string, name: string) {
  const party = bag().parties.get(code.toUpperCase());
  if (!party) return { ok: false as const, error: "not_found" };
  if (party.members.some((m) => m.id === id)) return { ok: true as const, duplicate: true, party: structuredClone(party) };
  if (party.members.length >= 6) return { ok: false as const, error: "full" };
  party.members.push({ id, name, ready: false, score: 0 });
  return { ok: true as const, duplicate: false, party: structuredClone(party) };
}

export function setPartyReady(code: string, id: string, ready: boolean) {
  const party = bag().parties.get(code.toUpperCase());
  if (!party) return null;
  const m = party.members.find((row) => row.id === id);
  if (m) m.ready = ready;
  return structuredClone(party);
}

export function scorePartyRound(code: string, rows: Array<{ id: string; name: string; score: number }>, gameId: string) {
  const party = bag().parties.get(code.toUpperCase());
  if (!party) return null;
  const ranked = rankScores(rows, lowerIsBetter(gameId));
  for (const r of ranked) {
    const m = party.standings.find((s) => s.id === r.id);
    if (m) m.points += r.points;
    else party.standings.push({ id: r.id, name: r.name, points: r.points });
    const slot = party.members.find((row) => row.id === r.id);
    if (slot) slot.score = r.score;
  }
  party.round += 1;
  party.state = party.round >= party.playlist.length ? "done" : "results";
  return structuredClone(party);
}

export function createChallenge(input: {
  gameId: string;
  mode: string;
  seed: string;
  type: ChallengeType;
  challengerId: string;
  challengerName: string;
  score: number;
  trust?: ChallengeRecord["trust"];
  gameVersion?: string;
  publicCode?: string;
  expiresAt?: number;
}): ChallengeRecord {
  const publicCode = input.publicCode ?? makePublicCode();
  const challenge: ChallengeRecord = {
    id: uid(),
    publicCode,
    gameId: input.gameId,
    mode: input.mode,
    seed: input.seed,
    type: input.type,
    challengerId: input.challengerId,
    challengerName: input.challengerName,
    targetId: null,
    targetName: null,
    challengerRunId: null,
    challengerScore: input.score,
    challengerGhostId: null,
    challengerMeta: {},
    status: "open",
    createdAt: Date.now(),
    expiresAt: input.expiresAt ?? Date.now() + 7 * 24 * 3600 * 1000,
    metadata: {},
    winnerId: null,
    targetScore: null,
    trust: input.trust ?? "unverified",
    gameVersion: input.gameVersion ?? getManifest(input.gameId)?.version ?? "1.0.0",
    attempts: [],
  };
  bag().challenges.set(publicCode, challenge);
  return structuredClone(challenge);
}

export function getChallenge(code: string): ChallengeRecord | null {
  const hit = bag().challenges.get(code.toUpperCase());
  return hit ? structuredClone(hit) : null;
}

export function putChallenge(challenge: ChallengeRecord) {
  bag().challenges.set(challenge.publicCode.toUpperCase(), challenge);
}

export function attemptChallenge(code: string, attempt: Omit<ChallengeAttempt, "challengeId">) {
  const current = bag().challenges.get(code.toUpperCase());
  if (!current) return { ok: false as const, duplicate: false, outcome: "pending" as const };
  const applied = applyChallengeAttempt(current, { ...attempt, challengeId: current.id });
  bag().challenges.set(code.toUpperCase(), applied.challenge);
  if (!applied.duplicate && applied.outcome !== "pending") {
    pushInbox(current.challengerId, {
      type: "challenge",
      title: applied.outcome === "win" ? `${attempt.playerName} beat your score` : applied.outcome === "draw" ? "Challenge draw" : `${attempt.playerName} tried your challenge`,
      body: getManifest(current.gameId)?.title ?? current.gameId,
      href: `/c/${code.toUpperCase()}`,
    });
    pushInbox(attempt.playerId, {
      type: "challenge",
      title: applied.outcome === "win" ? "You won the challenge" : applied.outcome === "draw" ? "Draw" : `${current.challengerName} still leads`,
      body: getManifest(current.gameId)?.title ?? current.gameId,
      href: `/c/${code.toUpperCase()}`,
    });
  }
  return { ok: true as const, ...applied };
}

export function pushInbox(userId: string, item: Omit<SocialInbox, "id" | "at" | "read" | "userId">) {
  const row: SocialInbox = { id: uid(), userId, at: Date.now(), read: false, ...item };
  bag().inbox.unshift(row);
  bag().inbox = bag().inbox.slice(0, 200);
  return structuredClone(row);
}

export function listInbox(userId: string) {
  return bag().inbox.filter((i) => i.userId === userId).map((i) => ({ ...i }));
}

export function markInboxRead(userId: string, id: string) {
  const hit = bag().inbox.find((i) => i.id === id && i.userId === userId);
  if (hit) hit.read = true;
  return hit ? { ...hit } : null;
}
