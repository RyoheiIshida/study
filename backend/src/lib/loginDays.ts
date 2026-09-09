import { prisma } from '../db.js';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 30;

export function jstDateKey(date: Date) {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: string, days: number) {
  const shifted = new Date(`${dateKey}T00:00:00.000Z`).getTime() + days * DAY_MS;
  return new Date(shifted).toISOString().slice(0, 10);
}

function daysBetween(fromKey: string, toKey: string) {
  const from = new Date(`${fromKey}T00:00:00.000Z`).getTime();
  const to = new Date(`${toKey}T00:00:00.000Z`).getTime();
  return Math.round((to - from) / DAY_MS);
}

function rate(loginDays: number, totalDays: number) {
  if (totalDays <= 0) return 0;
  return Math.round((loginDays / totalDays) * 1000) / 10;
}

/**
 * Marks today (JST) as a day the user showed up. Signing in is enough, so this
 * is called on login, on registration, and whenever the frontend restores a
 * session. Repeat visits on the same day bump `visitCount` instead of adding a
 * new row, which keeps the day count honest.
 */
export async function recordLoginDay(username: string, now = new Date()) {
  const date = jstDateKey(now);
  return prisma.loginRecord.upsert({
    where: { username_date: { username, date } },
    update: { lastSeenAt: now, visitCount: { increment: 1 } },
    create: { username, date, firstSeenAt: now, lastSeenAt: now, visitCount: 1 },
  });
}

export interface LoginRateWindow {
  days: number;
  loginDays: number;
  rate: number;
}

export interface LoginDayDot {
  date: string;
  loggedIn: boolean;
  visitCount: number;
}

export interface LoginSummary {
  today: string;
  loggedInToday: boolean;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  firstLoginDate: string | null;
  lastLoginDate: string | null;
  totalVisits: number;
  sinceRegistration: LoginRateWindow;
  recentWindow: LoginRateWindow;
  recentDays: LoginDayDot[];
}

export async function buildLoginSummary(username: string, now = new Date()): Promise<LoginSummary> {
  const today = jstDateKey(now);

  const [user, records] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { createdAt: true } }),
    prisma.loginRecord.findMany({
      where: { username },
      orderBy: { date: 'asc' },
      select: { date: true, visitCount: true },
    }),
  ]);

  const visitsByDate = new Map(records.map((record) => [record.date, record.visitCount]));
  const dates = records.map((record) => record.date);

  let longestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    run = previous !== null && shiftDateKey(previous, 1) === date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }

  // A streak stays alive while today is still open, so yesterday counts as the
  // current streak's end until midnight JST passes without a login.
  let currentStreak = 0;
  let cursor = visitsByDate.has(today) ? today : shiftDateKey(today, -1);
  while (visitsByDate.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const firstLoginDate = dates[0] ?? null;
  const lastLoginDate = dates[dates.length - 1] ?? null;
  const registrationDate = user ? jstDateKey(user.createdAt) : firstLoginDate;

  const sinceRegistrationDays = registrationDate
    ? Math.max(1, daysBetween(registrationDate, today) + 1)
    : 0;

  const recentCutoff = shiftDateKey(today, -(RECENT_WINDOW_DAYS - 1));
  const recentLoginDays = dates.filter((date) => date >= recentCutoff && date <= today).length;

  const recentDays: LoginDayDot[] = [];
  for (let offset = RECENT_WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    const date = shiftDateKey(today, -offset);
    const visitCount = visitsByDate.get(date) ?? 0;
    recentDays.push({ date, loggedIn: visitCount > 0, visitCount });
  }

  return {
    today,
    loggedInToday: visitsByDate.has(today),
    totalDays: dates.length,
    currentStreak,
    longestStreak,
    firstLoginDate,
    lastLoginDate,
    totalVisits: records.reduce((sum, record) => sum + record.visitCount, 0),
    sinceRegistration: {
      days: sinceRegistrationDays,
      loginDays: dates.length,
      rate: rate(dates.length, sinceRegistrationDays),
    },
    recentWindow: {
      days: RECENT_WINDOW_DAYS,
      loginDays: recentLoginDays,
      rate: rate(recentLoginDays, RECENT_WINDOW_DAYS),
    },
    recentDays,
  };
}
