export interface Trophy {
  quizId: string;
  quizTitle: string;
  subject: string;
  achievedAt: string;
}

interface AttemptWithQuiz {
  quizId: string;
  total: number;
  correct: number;
  playedAt: Date | string;
  quizTitle: string;
  subject: string;
}

/** Expects attempts ordered oldest-first so the earliest perfect run wins. */
export function computeTrophies(attempts: AttemptWithQuiz[]): Trophy[] {
  const earned = new Map<string, Trophy>();
  for (const attempt of attempts) {
    if (attempt.total <= 0 || attempt.correct !== attempt.total) continue;
    if (earned.has(attempt.quizId)) continue;
    earned.set(attempt.quizId, {
      quizId: attempt.quizId,
      quizTitle: attempt.quizTitle,
      subject: attempt.subject,
      achievedAt: typeof attempt.playedAt === 'string' ? attempt.playedAt : attempt.playedAt.toISOString(),
    });
  }
  return Array.from(earned.values());
}
