import { ProgressRecord, Quiz, Trophy } from '../types';

export function computeTrophiesFromProgress(records: ProgressRecord[], quizzes: Quiz[]): Trophy[] {
  const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const trophies: Trophy[] = [];
  for (const record of records) {
    if (record.total <= 0 || record.correct !== record.total) continue;
    const quiz = quizMap.get(record.quizId);
    if (!quiz) continue;
    trophies.push({
      quizId: record.quizId,
      quizTitle: quiz.title,
      subject: quiz.subject,
      achievedAt: record.lastPlayed,
    });
  }
  return trophies;
}
