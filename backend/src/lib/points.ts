import { prisma } from '../db.js';
import { PurchaseRequestStatus } from '../generated/client.js';
import { rewardRuleFor } from './difficulty.js';

export interface AttemptForPoints {
  quizId: string;
  correct: number;
  quiz: { grade: string };
}

// 1問あたりのポイントは難易度で決まり（difficulty.ts）、小学生向けのクイズは 0pt。
// ポイントそのものには上限を設けない。お金に換える量は交換の側（exchangeLimit.ts）で制限する。
export function computeAttemptPoints(attempt: AttemptForPoints): number {
  return attempt.correct * rewardRuleFor(attempt.quizId, attempt.quiz.grade).pointsPerCorrect;
}

/** 期間を渡すと、その間にプレイしたクイズで獲得したポイントだけを数える。 */
export async function computeEarnedPoints(username: string, range?: { start: Date; end: Date }): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username, ...(range && { playedAt: { gte: range.start, lt: range.end } }) },
    include: { quiz: { select: { grade: true } } },
  });
  return attempts.reduce((sum, attempt) => sum + computeAttemptPoints(attempt), 0);
}

export const LOCKED_STATUSES: PurchaseRequestStatus[] = [
  PurchaseRequestStatus.REQUESTED,
  PurchaseRequestStatus.APPROVED,
  PurchaseRequestStatus.HANDED_OVER,
  PurchaseRequestStatus.RECEIVED,
];

export async function computeAvailablePoints(username: string): Promise<number> {
  const total = await computeEarnedPoints(username);
  const spent = await prisma.purchaseRequest.aggregate({
    where: { child: { username }, status: { in: LOCKED_STATUSES } },
    _sum: { pointsCost: true },
  });
  return total - (spent._sum.pointsCost ?? 0);
}
