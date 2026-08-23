import { prisma } from '../db.js';

const RECENT_ATTEMPT_SAMPLE_SIZE = 30;

export async function computeRecentAccuracy(username: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username },
    orderBy: { playedAt: 'desc' },
    take: RECENT_ATTEMPT_SAMPLE_SIZE,
  });

  const totals = attempts.reduce(
    (acc, attempt) => ({ correct: acc.correct + attempt.correct, total: acc.total + attempt.total }),
    { correct: 0, total: 0 },
  );

  if (totals.total === 0) return 0;
  return totals.correct / totals.total;
}

export function computeExchangeRate(recentAccuracy: number): number {
  if (recentAccuracy >= 0.9) return 1.2;
  if (recentAccuracy >= 0.75) return 1.0;
  if (recentAccuracy >= 0.5) return 0.8;
  return 0.5;
}
