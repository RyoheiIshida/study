import { prisma } from '../db.js';
import { rewardRuleFor } from './difficulty.js';

const RECENT_ATTEMPT_SAMPLE_SIZE = 30;

// ポイントの出ないクイズ（小学生向け）で正答率だけ上げてレートを良くすることがないよう、
// ポイントが出るクイズの記録だけで正答率を出す。
// 難しいクイズは1回ごとの正答率に accuracyBonus を足し（100% まで）、挑戦してレートが下がる損を減らす。
export async function computeRecentAccuracy(username: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username },
    orderBy: { playedAt: 'desc' },
    include: { quiz: { select: { grade: true } } },
  });

  const totals = attempts
    .map((attempt) => ({ attempt, rule: rewardRuleFor(attempt.quizId, attempt.quiz.grade) }))
    .filter(({ attempt, rule }) => rule.pointsPerCorrect > 0 && attempt.total > 0)
    .slice(0, RECENT_ATTEMPT_SAMPLE_SIZE)
    .reduce(
      (acc, { attempt, rule }) => {
        const adjustedCorrect = Math.min(attempt.correct + attempt.total * rule.accuracyBonus, attempt.total);
        return { correct: acc.correct + adjustedCorrect, total: acc.total + attempt.total };
      },
      { correct: 0, total: 0 },
    );

  if (totals.total === 0) return 0;
  return totals.correct / totals.total;
}

// 1pt を 1円より高くはしない。正答率が低いほど下がるが、難しい問題に挑戦したときに下がりすぎないようにする。
export function computeExchangeRate(recentAccuracy: number): number {
  if (recentAccuracy >= 0.9) return 1.0;
  if (recentAccuracy >= 0.75) return 0.9;
  if (recentAccuracy >= 0.5) return 0.7;
  return 0.5;
}
