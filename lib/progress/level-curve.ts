// xpForLevel(L) = 100 · L^1.5 — level 2 ≈ 283 XP, level 5 ≈ 1,118 XP, level 10 ≈ 3,162 XP.

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level, 1.5));
}

export function levelFor(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

/** Progress inside the current level, 0–1, for the XP bar. */
export function levelProgress(xp: number) {
  const level = levelFor(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return { level, floor, ceil, into: xp - floor, needed: ceil - floor, ratio: (xp - floor) / (ceil - floor) };
}

export const XP_REWARDS = {
  lesson: 20,
  quizMin: 10,
  quizMax: 30,
  daily: 50,
  streakBonusPerDay: 5,
  streakBonusCap: 50,
  onboarding: 50,
} as const;
