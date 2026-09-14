export type ServerProgression = {
  newXp: number;
  newLevel?: number;
  achievements: string[];
  questsCompleted: string[];
  xpEarned?: number;
};

export function applyServerProgression<
  T extends { xp: number; achievements: string[]; questCompleted: string[] },
>(snapshot: T, diff: ServerProgression): T {
  return {
    ...snapshot,
    xp: diff.newXp,
    achievements: [...new Set([...snapshot.achievements, ...diff.achievements])],
    questCompleted: [...new Set([...snapshot.questCompleted, ...diff.questsCompleted])],
  };
}
