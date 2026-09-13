import { prisma } from '../db.js';
import { earnsPoints } from './points.js';

const RECENT_ATTEMPT_SAMPLE_SIZE = 30;

// ポイントの出ないクイズ（小学生向け）で正答率だけ上げてレートを良くすることがないよう、
// ポイントが出るクイズの記録だけで正答率を出す。
export async function computeRecentAccuracy(username: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username },
    orderBy: { playedAt: 'desc' },
    include: { quiz: { select: { grade: true } } },
  });

  const totals = attempts
    .filter((attempt) => earnsPoints(attempt.quiz.grade))
    .slice(0, RECENT_ATTEMPT_SAMPLE_SIZE)
    .reduce(
      (acc, attempt) => ({ correct: acc.correct + attempt.correct, total: acc.total + attempt.total }),
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
