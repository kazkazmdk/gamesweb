export type ServerProgression = {
  newXp: number;
  newLevel?: number;
  achievements: string[];
  questsCompleted: string[];
  xpEarned?: number;
};

export function applyServerProgression<
  T extends { xp: number; achievements: string[]; questCompleted: string[]; achievementUnlocks?: Record<string, number> },
>(snapshot: T, diff: ServerProgression): T {
  const unlocks = { ...(snapshot.achievementUnlocks ?? {}) };
  const now = Date.now();
  for (const id of diff.achievements) {
    if (!unlocks[id]) unlocks[id] = now;
  }
  return {
    ...snapshot,
    xp: diff.newXp,
    achievements: [...new Set([...snapshot.achievements, ...diff.achievements])],
    questCompleted: [...new Set([...snapshot.questCompleted, ...diff.questsCompleted])],
    achievementUnlocks: unlocks,
  };
}
