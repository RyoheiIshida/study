import { DailyXpPoint, ProgressRecord, Quiz } from '../types';

export interface TrendPoint {
  label: string;
  accuracy: number;
  correct: number;
  total: number;
}

export interface SubjectSummary {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
}

export function getAccuracy(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getTotals(records: ProgressRecord[]) {
  return records.reduce(
    (total, record) => ({
      correct: total.correct + record.correct,
      total: total.total + record.total,
      bestStreak: Math.max(total.bestStreak, record.streak),
    }),
    { correct: 0, total: 0, bestStreak: 0 },
  );
}

export function buildTrend(records: ProgressRecord[], quizzes: Quiz[]): TrendPoint[] {
  return [...records]
    .sort((a, b) => new Date(a.lastPlayed).getTime() - new Date(b.lastPlayed).getTime())
    .map((record) => {
      const quiz = quizzes.find((item) => item.id === record.quizId);
      return {
        label: quiz?.title ?? record.quizId,
        accuracy: getAccuracy(record.correct, record.total),
        correct: record.correct,
        total: record.total,
      };
    });
}

export function buildSubjectSummary(records: ProgressRecord[], quizzes: Quiz[]): SubjectSummary[] {
  const summary = new Map<string, { correct: number; total: number }>();
  for (const record of records) {
    const quiz = quizzes.find((item) => item.id === record.quizId);
    const subject = quiz?.subject ?? '不明';
    const current = summary.get(subject) ?? { correct: 0, total: 0 };
    summary.set(subject, {
      correct: current.correct + record.correct,
      total: current.total + record.total,
    });
  }

  return Array.from(summary.entries()).map(([subject, value]) => ({
    subject,
    correct: value.correct,
    total: value.total,
    accuracy: getAccuracy(value.correct, value.total),
  }));
}

export function getBestRecord(records: ProgressRecord[], quizzes: Quiz[]) {
  if (records.length === 0) return null;
  const best = records.reduce((winner, record) => {
    const score = getAccuracy(record.correct, record.total);
    const winnerScore = getAccuracy(winner.correct, winner.total);
    if (score > winnerScore) return record;
    if (score === winnerScore && record.streak > winner.streak) return record;
    return winner;
  }, records[0]);
  const quiz = quizzes.find((item) => item.id === best.quizId);
  return {
    record: best,
    title: quiz?.title ?? 'Quiz',
    accuracy: getAccuracy(best.correct, best.total),
  };
}

export interface CalendarDay {
  date: string;
  questions: number;
  xp: number;
  level: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
  monthLabel: string | null;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildActivityCalendar(dailyXp: DailyXpPoint[], weeks = 18): CalendarWeek[] {
  const activityMap = new Map(dailyXp.map((point) => [point.date, point]));
  const maxQuestions = Math.max(1, ...dailyXp.map((point) => point.questions));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
  const start = new Date(weekEnd);
  start.setDate(start.getDate() - weeks * 7 + 1);

  const columns: CalendarWeek[] = [];
  let previousMonth = -1;
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const weekStartMonth = cursor.getMonth();
    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const key = toDateKey(cursor);
      const point = activityMap.get(key);
      const questions = point?.questions ?? 0;
      days.push({
        date: key,
        questions,
        xp: point?.xp ?? 0,
        level: questions === 0 ? 0 : Math.min(4, Math.ceil((questions / maxQuestions) * 4)),
        isToday: key === todayKey,
        isFuture: cursor > today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    let monthLabel: string | null = null;
    if (weekStartMonth !== previousMonth) {
      monthLabel = `${weekStartMonth + 1}月`;
      previousMonth = weekStartMonth;
    }
    columns.push({ days, monthLabel });
  }
  return columns;
}

export function countRecentStudyDays(dailyXp: DailyXpPoint[], days: number): number {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffKey = toDateKey(cutoff);
  return dailyXp.filter((point) => point.date >= cutoffKey).length;
}
