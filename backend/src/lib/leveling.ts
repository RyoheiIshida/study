import { rewardRuleFor } from './difficulty.js';

export interface AttemptForXp {
  quizId: string;
  quiz: { grade: string };
  correct: number;
  total: number;
  streak: number;
  /** クイズ終了時の抽選で当たったぶんの XP。抽選を入れる前の記録は 0。 */
  luckyBonusXp?: number;
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

export function computeAttemptXp(attempt: AttemptForXp): number {
  // 難しいクイズほど1問あたりの XP が多い。全問正解と連続正解のボーナスは難易度によらず同じ。
  const base = attempt.correct * rewardRuleFor(attempt.quizId, attempt.quiz.grade).xpPerCorrect;
  const completionBonus = attempt.total > 0 && attempt.correct === attempt.total ? 20 : 0;
  const streakBonus = attempt.streak * 2;
  return base + completionBonus + streakBonus + (attempt.luckyBonusXp ?? 0);
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
