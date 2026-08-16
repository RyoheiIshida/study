export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const MAX_SESSION_QUESTIONS = 15;

export function pickSessionQuestions<T>(items: T[], max: number = MAX_SESSION_QUESTIONS): T[] {
  return shuffle(items).slice(0, Math.min(max, items.length));
}
