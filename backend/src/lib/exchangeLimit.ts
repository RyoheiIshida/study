import { prisma } from '../db.js';
import { computeAttemptXp, getLevelProgress } from './leveling.js';
import { LOCKED_STATUSES } from './points.js';

export interface ExchangeTier {
  level: number;
  monthlyLimit: number;
}

/**
 * Monthly exchange allowance per level. A child cannot exchange at all below
 * the first tier, and each tier raises the cash they may request in a month.
 * The top tier is kept at 1,000 yen so the app stays a small bonus on top of
 * a middle schooler's regular allowance rather than replacing it.
 */
export const MONTHLY_LIMIT_TIERS: ExchangeTier[] = [
  { level: 5, monthlyLimit: 300 },
  { level: 10, monthlyLimit: 500 },
  { level: 15, monthlyLimit: 700 },
  { level: 20, monthlyLimit: 1000 },
];

/** Points can only be exchanged in multiples of this, so rounding a tiny request up never pays extra. */
export const EXCHANGE_POINT_UNIT = 100;

export const EXCHANGE_UNLOCK_LEVEL = MONTHLY_LIMIT_TIERS[0].level;

export function monthlyLimitForLevel(level: number): number {
  let limit = 0;
  for (const tier of MONTHLY_LIMIT_TIERS) {
    if (level >= tier.level) limit = tier.monthlyLimit;
  }
  return limit;
}

export function nextTierForLevel(level: number): ExchangeTier | null {
  return MONTHLY_LIMIT_TIERS.find((tier) => tier.level > level) ?? null;
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function jstMonthRange(now: Date) {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  return {
    month: `${year}-${String(month + 1).padStart(2, '0')}`,
    start: new Date(Date.UTC(year, month, 1) - JST_OFFSET_MS),
    end: new Date(Date.UTC(year, month + 1, 1) - JST_OFFSET_MS),
  };
}

export async function computeTotalXp(username: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({ where: { username } });
  return attempts.reduce((sum, attempt) => sum + computeAttemptXp(attempt), 0);
}

export async function computeMonthlyExchangedCash(username: string, now: Date): Promise<number> {
  const { start, end } = jstMonthRange(now);
  const exchanged = await prisma.purchaseRequest.aggregate({
    where: {
      child: { username },
      status: { in: LOCKED_STATUSES },
      requestedAt: { gte: start, lt: end },
    },
    _sum: { cashAmount: true },
  });
  return exchanged._sum.cashAmount ?? 0;
}

export interface ExchangeLimitInfo {
  level: number;
  unlockLevel: number;
  unlocked: boolean;
  month: string;
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  nextTier: ExchangeTier | null;
  tiers: ExchangeTier[];
}

export async function computeExchangeLimit(username: string, now = new Date()): Promise<ExchangeLimitInfo> {
  const totalXp = await computeTotalXp(username);
  const { level } = getLevelProgress(totalXp);
  const monthlyLimit = monthlyLimitForLevel(level);
  const { month } = jstMonthRange(now);
  const monthlyUsed = await computeMonthlyExchangedCash(username, now);

  return {
    level,
    unlockLevel: EXCHANGE_UNLOCK_LEVEL,
    unlocked: level >= EXCHANGE_UNLOCK_LEVEL,
    month,
    monthlyLimit,
    monthlyUsed,
    monthlyRemaining: Math.max(monthlyLimit - monthlyUsed, 0),
    nextTier: nextTierForLevel(level),
    tiers: MONTHLY_LIMIT_TIERS,
  };
}
