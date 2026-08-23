import { prisma } from '../db.js';
import { PurchaseRequestStatus } from '../generated/client.js';

export interface AttemptForPoints {
  correct: number;
}

const POINTS_PER_CORRECT_ANSWER = 10;

export function computeAttemptPoints(attempt: AttemptForPoints): number {
  return attempt.correct * POINTS_PER_CORRECT_ANSWER;
}

export async function computeTotalPoints(username: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({ where: { username } });
  return attempts.reduce((sum, attempt) => sum + computeAttemptPoints(attempt), 0);
}

const LOCKED_STATUSES: PurchaseRequestStatus[] = [
  PurchaseRequestStatus.REQUESTED,
  PurchaseRequestStatus.APPROVED,
  PurchaseRequestStatus.HANDED_OVER,
  PurchaseRequestStatus.RECEIVED,
];

export async function computeAvailablePoints(username: string): Promise<number> {
  const total = await computeTotalPoints(username);
  const spent = await prisma.purchaseRequest.aggregate({
    where: { child: { username }, status: { in: LOCKED_STATUSES } },
    _sum: { pointsCost: true },
  });
  return total - (spent._sum.pointsCost ?? 0);
}
