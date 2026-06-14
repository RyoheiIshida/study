import { ProgressRecord, Quiz } from '../types';

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
    const subject = quiz?.subject ?? 'Unknown';
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
