import { analytics } from "@gamesweb/analytics";
import {
  applyChallengeAttempt,
  dailyArcadeEvents,
  decodeChallengePayload,
  encodeChallengePayload,
  getManifest,
  GRAND_PRIX_PLAYLIST,
  makePublicCode,
  nextBestAction,
  QUICK_PARTY_PLAYLIST,
  rankScores,
  roundPoints,
  type ChallengeAttempt,
  type ChallengeRecord,
  type ChallengeShare,
  type ChallengeType,
  type NextAction,
} from "@gamesweb/game-sdk";
import { lowerIsBetter } from "@gamesweb/database";

export type InboxItem = {
  id: string;
  type: "challenge" | "friend" | "rival" | "party" | "crew" | "leaderboard";
  title: string;
  body: string;
  href: string;
  at: number;
  read: boolean;
};

export type PartyState = {
  code: string;
  host: string;
  members: Array<{ id: string; name: string; ready: boolean; score: number }>;
  playlist: Array<{ gameId: string; mode: string }>;
  round: number;
  state: "lobby" | "playing" | "results" | "done";
  standings: Array<{ id: string; name: string; points: number }>;
  createdAt: number;
};

export type RivalRow = {
  otherId: string;
  otherName: string;
  winsA: number;
  winsB: number;
  draws: number;
  totalMatches: number;
  lastMatch: number;
  streak: number;
  rivalryScore: number;
};

export type CrewState = {
  id: string;
  name: string;
  tag: string;
  owner: string;
  members: string[];
  xp: number;
  level: number;
  feed: Array<{ id: string; text: string; at: number }>;
  weekly: { goal: string; progress: number; target: number };
};

type ArcadeSnap = {
  challenges: ChallengeRecord[];
  inbox: InboxItem[];
  parties: PartyState[];
  rivals: RivalRow[];
  recentPlayers: Array<{ id: string; name: string; at: number; gameId: string }>;
  daily: { day: string; completed: string[]; score: number };
  grandPrix: { id: string | null; scores: number[]; points: number };
  crew: CrewState | null;
};

const KEY = "gw:arcade-social";

function uid() {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function empty(): ArcadeSnap {
  return {
    challenges: [],
    inbox: [],
    parties: [],
    rivals: [],
    recentPlayers: [],
    daily: { day: "", completed: [], score: 0 },
    grandPrix: { id: null, scores: [], points: 0 },
    crew: null,
  };
}

class ArcadeStore {
  private snap: ArcadeSnap = empty();
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.snap = { ...empty(), ...(JSON.parse(raw) as ArcadeSnap) };
    } catch {
      this.snap = empty();
    }
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit() {
    this.persist();
    for (const fn of this.listeners) fn();
  }
  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.snap));
    } catch {
      /* quota */
    }
  }
  view() {
    return this.snap;
  }

  unread() {
    return this.snap.inbox.filter((i) => !i.read).length;
  }

  createChallenge(input: {
    gameId: string;
    mode: string;
    seed: string;
    type: ChallengeType;
    challengerId: string;
    challengerName: string;
    score: number;
    trust?: ChallengeRecord["trust"];
    gameVersion?: string;
  }): { challenge: ChallengeRecord; url: string } {
    const publicCode = makePublicCode();
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
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
      metadata: {},
      winnerId: null,
      targetScore: null,
      trust: input.trust ?? "unverified",
      gameVersion: input.gameVersion ?? getManifest(input.gameId)?.version ?? "1.0.0",
      attempts: [],
    };
    this.snap.challenges = [challenge, ...this.snap.challenges].slice(0, 80);
    const share: ChallengeShare = {
      publicCode,
      gameId: challenge.gameId,
      mode: challenge.mode,
      seed: challenge.seed,
      type: challenge.type,
      challengerName: challenge.challengerName,
      challengerScore: challenge.challengerScore,
      gameVersion: challenge.gameVersion,
      trust: challenge.trust,
      expiresAt: challenge.expiresAt,
      challengerId: challenge.challengerId,
    };
    const url = `/c/${publicCode}?p=${encodeChallengePayload(share)}`;
    analytics.track("challenge_created", { gameId: input.gameId, code: publicCode });
    this.emit();
    return { challenge, url };
  }

  fromShare(share: ChallengeShare): ChallengeRecord {
    return {
      id: uid(),
      publicCode: share.publicCode,
      gameId: share.gameId,
      mode: share.mode,
      seed: share.seed,
      type: share.type,
      challengerId: share.challengerId,
      challengerName: share.challengerName,
      targetId: null,
      targetName: null,
      challengerRunId: null,
      challengerScore: share.challengerScore,
      challengerGhostId: null,
      challengerMeta: {},
      status: "open",
      createdAt: Date.now(),
      expiresAt: share.expiresAt,
      metadata: {},
      winnerId: null,
      targetScore: null,
      trust: share.trust,
      gameVersion: share.gameVersion,
      attempts: [],
    };
  }

  hydrateFromShare(share: ChallengeShare) {
    if (this.snap.challenges.some((c) => c.publicCode === share.publicCode)) return;
    this.snap.challenges = [this.fromShare(share), ...this.snap.challenges].slice(0, 80);
    this.emit();
  }

  getChallenge(code: string, payload?: string | null): ChallengeRecord | ChallengeShare | null {
    const local = this.snap.challenges.find((c) => c.publicCode === code);
    if (local) return local;
    if (payload) {
      const share = decodeChallengePayload(payload);
      if (share) this.hydrateFromShare(share);
      return this.snap.challenges.find((c) => c.publicCode === code) ?? share;
    }
    return null;
  }

  completeChallenge(code: string, attempt: Omit<ChallengeAttempt, "challengeId">, payload?: string | null) {
    if (payload) {
      const share = decodeChallengePayload(payload);
      if (share) this.hydrateFromShare(share);
    }
    const idx = this.snap.challenges.findIndex((c) => c.publicCode === code);
    if (idx < 0) return { ok: false as const, duplicate: false, outcome: "pending" as const };
    const current = this.snap.challenges[idx];
    const applied = applyChallengeAttempt(current, { ...attempt, challengeId: current.id });
    this.snap.challenges[idx] = applied.challenge;
    if (!applied.duplicate && applied.outcome !== "pending") {
      this.pushInbox({
        type: "challenge",
        title: applied.outcome === "win" ? "You won the challenge" : applied.outcome === "draw" ? "Draw" : `${current.challengerName} still leads`,
        body: getManifest(current.gameId)?.title ?? current.gameId,
        href: `/c/${code}`,
      });
      this.touchRival(current.challengerId, current.challengerName, applied.outcome);
      analytics.track("challenge_finished", { gameId: current.gameId, outcome: applied.outcome });
    }
    this.emit();
    return { ok: true as const, ...applied };
  }

  private touchRival(otherId: string, otherName: string, outcome: "win" | "loss" | "draw") {
    if (!otherId || otherId === "guest") return;
    let row = this.snap.rivals.find((r) => r.otherId === otherId);
    if (!row) {
      row = { otherId, otherName, winsA: 0, winsB: 0, draws: 0, totalMatches: 0, lastMatch: Date.now(), streak: 0, rivalryScore: 0 };
      this.snap.rivals.push(row);
      analytics.track("rival_created", { otherId });
    }
    row.totalMatches += 1;
    row.lastMatch = Date.now();
    if (outcome === "win") {
      row.winsA += 1;
      row.streak = row.streak >= 0 ? row.streak + 1 : 1;
    } else if (outcome === "loss") {
      row.winsB += 1;
      row.streak = row.streak <= 0 ? row.streak - 1 : -1;
    } else row.draws += 1;
    row.rivalryScore = row.totalMatches * 10 + Math.abs(row.winsA - row.winsB);
    this.snap.recentPlayers = [{ id: otherId, name: otherName, at: Date.now(), gameId: "" }, ...this.snap.recentPlayers.filter((p) => p.id !== otherId)].slice(0, 20);
  }

  pushInbox(item: Omit<InboxItem, "id" | "at" | "read">) {
    this.snap.inbox = [{ id: uid(), at: Date.now(), read: false, ...item }, ...this.snap.inbox].slice(0, 60);
    this.emit();
  }

  markRead(id: string) {
    const hit = this.snap.inbox.find((i) => i.id === id);
    if (hit) hit.read = true;
    this.emit();
  }

  createParty(host: string): PartyState {
    const party: PartyState = {
      code: makePublicCode(),
      host,
      members: [{ id: host, name: host, ready: true, score: 0 }],
      playlist: QUICK_PARTY_PLAYLIST.map((r) => ({ ...r })),
      round: 0,
      state: "lobby",
      standings: [],
      createdAt: Date.now(),
    };
    this.snap.parties = [party, ...this.snap.parties];
    analytics.track("party_created", { code: party.code });
    this.emit();
    return party;
  }

  joinParty(code: string, id: string, name: string) {
    const party = this.snap.parties.find((p) => p.code === code);
    if (!party) return { ok: false as const, error: "not_found" };
    if (party.members.some((m) => m.id === id)) return { ok: true as const, duplicate: true, party };
    if (party.members.length >= 6) return { ok: false as const, error: "full" };
    party.members.push({ id, name, ready: false, score: 0 });
    analytics.track("party_joined", { code });
    this.emit();
    return { ok: true as const, duplicate: false, party };
  }

  scorePartyRound(code: string, rows: Array<{ id: string; name: string; score: number }>, gameId: string) {
    const party = this.snap.parties.find((p) => p.code === code);
    if (!party) return null;
    const ranked = rankScores(rows, lowerIsBetter(gameId));
    for (const r of ranked) {
      const m = party.standings.find((s) => s.id === r.id);
      if (m) m.points += r.points;
      else party.standings.push({ id: r.id, name: r.name, points: r.points });
    }
    party.round += 1;
    party.state = party.round >= party.playlist.length ? "done" : "results";
    analytics.track("party_round_finished", { code, round: party.round });
    this.emit();
    return party;
  }

  dailyProgress(day: string, eventKey: string, normalized: number) {
    if (this.snap.daily.day !== day) this.snap.daily = { day, completed: [], score: 0 };
    if (this.snap.daily.completed.includes(eventKey)) return { duplicate: true, ...this.snap.daily };
    this.snap.daily.completed.push(eventKey);
    this.snap.daily.score += normalized;
    analytics.track("daily_finished", { eventKey });
    this.emit();
    return { duplicate: false, ...this.snap.daily };
  }

  gpScore(round: number, placePoints: number) {
    if (!this.snap.grandPrix.id) this.snap.grandPrix = { id: `gp-${new Date().toISOString().slice(0, 10)}`, scores: [], points: 0 };
    if (this.snap.grandPrix.scores[round] != null) return { duplicate: true, ...this.snap.grandPrix };
    this.snap.grandPrix.scores[round] = placePoints;
    this.snap.grandPrix.points = this.snap.grandPrix.scores.reduce((a, b) => a + (b ?? 0), 0);
    this.emit();
    return { duplicate: false, ...this.snap.grandPrix };
  }

  ensureCrew(owner: string) {
    if (this.snap.crew) return this.snap.crew;
    this.snap.crew = {
      id: uid(),
      name: "Arcade Crew",
      tag: "ARC",
      owner,
      members: [owner],
      xp: 0,
      level: 1,
      feed: [],
      weekly: { goal: "Complete 50 runs", progress: 0, target: 50 },
    };
    analytics.track("crew_joined", { crew: this.snap.crew.id });
    this.emit();
    return this.snap.crew;
  }

  contributeCrew() {
    if (!this.snap.crew) return;
    if (this.snap.crew.weekly.progress >= this.snap.crew.weekly.target) return { duplicate: true };
    this.snap.crew.weekly.progress += 1;
    this.snap.crew.xp += 8;
    this.snap.crew.level = 1 + Math.floor(this.snap.crew.xp / 120);
    this.emit();
    return { duplicate: false };
  }

  nextAction(input: Parameters<typeof nextBestAction>[0]): NextAction {
    return nextBestAction(input);
  }
}

export const arcadeStore = new ArcadeStore();
export { dailyArcadeEvents, encodeChallengePayload, GRAND_PRIX_PLAYLIST, QUICK_PARTY_PLAYLIST, roundPoints };
