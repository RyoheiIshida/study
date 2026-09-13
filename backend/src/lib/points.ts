import { prisma } from '../db.js';
import { PurchaseRequestStatus } from '../generated/client.js';
import { jstDateKey } from './loginDays.js';
import { rewardRuleFor } from './difficulty.js';

export interface AttemptForPoints {
  quizId: string;
  correct: number;
  playedAt: Date;
  quiz: { grade: string };
}

// 1日にもらえるポイントの上限（1pt≒1円）。まとめて長時間解くほど得をする形にしないため。
// 毎日上限まで解いて約20日で、月の最大交換額（1,000円）に届く。
// 1問あたりのポイントは難易度で決まり（difficulty.ts）、小学生向けのクイズは 0pt。
export const DAILY_POINT_LIMIT = 50;

function uncappedAttemptPoints(attempt: AttemptForPoints): number {
  return attempt.correct * rewardRuleFor(attempt.quizId, attempt.quiz.grade).pointsPerCorrect;
}

export interface PointsLedger {
  totalPoints: number;
  /** JST の日付ごとに実際に付与したポイント。 */
  pointsByDay: Map<string, number>;
}

/** Expects attempts ordered oldest-first so each day's limit is used up in play order. */
export function computePointsLedger(attempts: AttemptForPoints[]): PointsLedger {
  const pointsByDay = new Map<string, number>();
  let totalPoints = 0;
  for (const attempt of attempts) {
    const day = jstDateKey(attempt.playedAt);
    const earnedToday = pointsByDay.get(day) ?? 0;
    const awarded = Math.min(uncappedAttemptPoints(attempt), DAILY_POINT_LIMIT - earnedToday);
    pointsByDay.set(day, earnedToday + awarded);
    totalPoints += awarded;
  }
  return { totalPoints, pointsByDay };
}

export async function loadPointsLedger(username: string): Promise<PointsLedger> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { username },
    orderBy: { playedAt: 'asc' },
    include: { quiz: { select: { grade: true } } },
  });
  return computePointsLedger(attempts);
}

export async function computeTotalPoints(username: string): Promise<number> {
  return (await loadPointsLedger(username)).totalPoints;
}

export const LOCKED_STATUSES: PurchaseRequestStatus[] = [
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
