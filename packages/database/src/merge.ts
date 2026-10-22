import { allAchievements } from "@gamesweb/game-sdk";
import { xpRewards } from "@gamesweb/config";
import { reconstructAchievementsFromScores } from "./ownership";
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
  "platform:arcade-tourist": 70,
  "platform:world-tour": 120,
  "platform:rivalry": 50,
  "platform:untouchable": 60,
  "platform:social-butterfly": 55,
  "platform:daily-grinder": 80,
  "platform:all-rounder": 70,
  "platform:grand-prix-winner": 90,
  "platform:crew-player": 40,
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
  "sky-stack:first-place": 10,
  "sky-stack:perfect-5": 25,
  "sky-stack:streak-8": 25,
  "sky-stack:floor-30": 30,
  "sky-stack:fever": 20,
  "sky-stack:fever-2": 20,
  "sky-stack:floor-67": 50,
  "knockout-circuit:first-gate": 15,
  "knockout-circuit:all-maps": 40,
  "knockout-circuit:finish": 25,
  "knockout-circuit:no-hit": 30,
  "knockout-circuit:no-fall": 30,
  "knockout-circuit:shortcut": 20,
  "knockout-circuit:fast": 35,
  "pocket-striker:first-pocket": 10,
  "pocket-striker:perfect": 25,
  "pocket-striker:bank": 20,
  "pocket-striker:par-table": 25,
  "pocket-striker:under-par": 25,
  "territory-rush:first-claim": 10,
  "territory-rush:cut": 25,
  "territory-rush:half-map": 40,
  "territory-rush:half": 40,
  "territory-rush:dominate": 50,
  "crowd-control:pack-gate": 10,
  "crowd-control:x4": 25,
  "crowd-control:pack-60": 25,
  "crowd-control:cut-in": 20,
  "crowd-control:pack-120": 35,
  "crowd-control:finish-80": 35,
  "crowd-control:win-boss": 30,
  "prism-drop:first-merge": 10,
  "prism-drop:chain-4": 25,
  "prism-drop:tile-512": 35,
  "prism-drop:tile-2048": 60,
  "swing-vector:first-swing": 10,
  "swing-vector:sonic-snap": 20,
  "swing-vector:clean-canyon": 30,
  "swing-vector:sub-24": 45,
};

for (const ach of allAchievements()) {
  const id = `${ach.gameId ?? "platform"}:${ach.key}`;
  if (!(id in ACHIEVEMENT_XP)) {
    ACHIEVEMENT_XP[id] = ach.xp;
  }
}

export function achievementXp(id: string): number {
  return ACHIEVEMENT_XP[id] ?? xpRewards.achievement;
}

/**
 * Guest → account merge (server snapshots only).
 *
 * XP rule: guest_progress.xp is authoritative for the guest side. It already
 * includes run / achievement / quest XP awarded atomically per finalize.
 * newXp = account.xp + guest.xp. Reconstructed achievements are unioned as a
 * projection and must not add XP again.
 *
 * Callers must pass server guest_progress (or the memory guest profile), never
 * a client-claimed snapshot. The merge API rejects body.anonymousId / snapshot.
 */
export function mergeGuestIntoAccount(account: AccountProgress, guest: GuestSnapshot): AccountProgress {
  const seen = new Set(account.scores.map((s) => s.id));
  const scores = [...account.scores];
  for (const row of guest.scores) {
    if (row.verified === "flagged") continue;
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    scores.push({
      ...row,
      verified: row.verified === "verified" ? "verified" : "unverified",
    });
  }

  const reconstructed = reconstructAchievementsFromScores(scores);
  const achievements = [...new Set([...account.achievements, ...reconstructed, ...(guest.achievements ?? [])])];

  const xp = Math.min(account.xp + Math.max(0, guest.xp), 5_000_000);

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
