export interface AttemptForXp {
  correct: number;
  total: number;
  streak: number;
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

export function computeAttemptXp(attempt: AttemptForXp): number {
  const base = attempt.correct * 10;
  const completionBonus = attempt.total > 0 && attempt.correct === attempt.total ? 20 : 0;
  const streakBonus = attempt.streak * 2;
  return base + completionBonus + streakBonus;
}

export function xpToReachLevel(level: number): number {
  return 100 + (level - 1) * 40;
}

export function getLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpToReachLevel(level)) {
    remaining -= xpToReachLevel(level);
    level += 1;
  }
  const xpForNextLevel = xpToReachLevel(level);
  const progressPercent = xpForNextLevel > 0 ? Math.round((remaining / xpForNextLevel) * 100) : 0;
  return { level, totalXp, xpIntoLevel: remaining, xpForNextLevel, progressPercent };
}
