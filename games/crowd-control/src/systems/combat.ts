export function resolveCrowdClash(left: number, right: number) {
  const loss = Math.min(left, right);
  const leftover = Math.abs(left - right);
  if (left === right) return { left: 0, right: 0, loss, leftover: 0 };
  if (left > right) return { left: leftover, right: 0, loss, leftover };
  return { left: 0, right: leftover, loss, leftover };
}

export function stepBossFight(boss: { hp: number; max: number }, pack: number, dt: number) {
  const dps = 8 + pack * 1.15;
  const crush = pack < 16 ? 18 : pack < 28 ? 10 : 4;
  const hp = boss.hp - dps * dt;
  const nextPack = Math.max(0, pack - crush * dt);
  return { hp, pack: nextPack, dead: hp <= 0, crush };
}

export function finishMultiplier(pack: number) {
  if (pack >= 96) return 4;
  if (pack >= 48) return 3;
  if (pack >= 24) return 2;
  if (pack >= 12) return 1.5;
  return 1;
}
