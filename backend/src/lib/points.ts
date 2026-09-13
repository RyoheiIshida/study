import { prisma } from '../db.js';
import { PurchaseRequestStatus } from '../generated/client.js';
import { jstDateKey } from './loginDays.js';

export interface AttemptForPoints {
  correct: number;
  playedAt: Date;
  quiz: { grade: string };
}

// ポイントはおこづかい（現金）に換わるので、1問1pt・1pt≒1円を目安にする。
const POINTS_PER_CORRECT_ANSWER = 1;

// 1日にもらえるポイントの上限。まとめて長時間解くほど得をする形にしないため。
// 毎日上限まで解いて約20日で、月の最大交換額（1,000円）に届く。
export const DAILY_POINT_LIMIT = 50;

// 中学生が小学生向けの簡単な問題だけでポイントを稼げないよう、ここに入る学年は XP だけにする。
const XP_ONLY_GRADES = new Set(['Elementary']);

export function earnsPoints(grade: string): boolean {
  return !XP_ONLY_GRADES.has(grade);
}

function uncappedAttemptPoints(attempt: AttemptForPoints): number {
  return earnsPoints(attempt.quiz.grade) ? attempt.correct * POINTS_PER_CORRECT_ANSWER : 0;
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
