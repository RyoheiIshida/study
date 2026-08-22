export interface AttemptForPoints {
  correct: number;
}

const POINTS_PER_CORRECT_ANSWER = 10;

export function computeAttemptPoints(attempt: AttemptForPoints): number {
  return attempt.correct * POINTS_PER_CORRECT_ANSWER;
}
