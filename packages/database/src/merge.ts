import { xpRewards } from "@gamesweb/config";
import type { AccountProgress, GuestSnapshot } from "./types";

const ACHIEVEMENT_XP: Record<string, number> = {
  "platform:first-run": 20,
  "platform:three-worlds": 80,
  "platform:on-fire": 60,
  "platform:night-shift": 25,
  "platform:explorer": 40,
  "platform:return-tomorrow": 35,
  "platform:weekender": 90,
  "platform:social-spark": 15,
  "neon-drift:first-slide": 15,
  "neon-drift:combo-5": 25,
  "neon-drift:score-25k": 30,
  "neon-drift:score-60k": 50,
  "neon-drift:two-laps": 25,
  "neon-drift:near-miss": 20,
  "neon-drift:grass-survive": 15,
  "neon-drift:boost-gate": 15,
  "neon-drift:no-crash-lap": 35,
  "neon-drift:daily-drift": 30,
  "velocity-run:first-finish": 15,
  "velocity-run:bronze": 15,
  "velocity-run:gold": 35,
  "velocity-run:platinum": 70,
  "velocity-run:all-courses": 40,
  "velocity-run:no-death": 30,
  "velocity-run:sub-40": 25,
  "velocity-run:fast-fall": 10,
  "velocity-run:retry-10": 20,
  "velocity-run:pb-twice": 30,
  "swarm-protocol:first-blood": 10,
  "swarm-protocol:survive-2": 20,
  "swarm-protocol:survive-5": 40,
  "swarm-protocol:level-8": 35,
  "swarm-protocol:elite": 25,
  "swarm-protocol:splitter": 15,
  "swarm-protocol:dash-kill": 20,
  "swarm-protocol:kills-200": 40,
  "swarm-protocol:shield": 15,
  "swarm-protocol:chain": 15,
};

export function achievementXp(id: string): number {
  return ACHIEVEMENT_XP[id] ?? xpRewards.achievement;
}

/**
 * Guest → account merge.
 * XP is NOT guest.xp + account.xp (that farms). Account keeps its XP and
 * receives XP only for achievements the account did not already hold.
 * Each anonymous_id may merge at most once (enforced by guest_migrations).
 */
export function mergeGuestIntoAccount(account: AccountProgress, guest: GuestSnapshot): AccountProgress {
  const accountSet = new Set(account.achievements);
  const guestSet = new Set(guest.achievements);
  const added: string[] = [];
  for (const id of guestSet) {
    if (!accountSet.has(id)) added.push(id);
  }
  const achievements = [...accountSet, ...added];

  let xp = account.xp;
  for (const id of added) xp += achievementXp(id);
  xp = Math.min(xp, 5_000_000);

  const seen = new Set(account.scores.map((s) => s.id));
  const scores = [...account.scores];
  for (const row of guest.scores) {
    if (row.verified === "flagged") continue;
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    scores.push(row);
  }

  const saves = { ...account.saves };
  for (const [gameId, save] of Object.entries(guest.saves ?? {})) {
    const current = saves[gameId];
    const guestTs = save.updatedAt ?? 0;
    const accountTs = current?.updatedAt ?? 0;
    if (!current || guestTs >= accountTs) saves[gameId] = save;
  }

  const questProgress = { ...account.questProgress };
  for (const [id, value] of Object.entries(guest.questProgress ?? {})) {
    questProgress[id] = Math.max(questProgress[id] ?? 0, value);
  }
  const questCompleted = [...new Set([...account.questCompleted, ...(guest.questCompleted ?? [])])];

  const stats = { ...account.stats };
  for (const [key, value] of Object.entries(guest.stats ?? {})) {
    stats[key] = Math.max(stats[key] ?? 0, value);
  }

  return {
    xp,
    achievements,
    scores: scores.slice(0, 400),
    saves,
    questProgress,
    questCompleted,
    stats,
    streak: Math.max(account.streak, guest.streak ?? 0),
  };
}
