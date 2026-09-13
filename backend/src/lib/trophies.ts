import { jstDateKey } from './loginDays.js';
import { Rarity } from './rarity.js';

export interface Trophy {
  quizId: string;
  quizTitle: string;
  subject: string;
  /** When the quiz was first cleared perfectly. */
  achievedAt: string;
  /** Distinct JST days with a perfect run of this quiz. */
  perfectDays: number;
  rarity: Rarity;
  /** The next rarity and how many perfect days it needs, or null once legendary. */
  next: { rarity: Rarity; perfectDays: number } | null;
}

interface AttemptWithQuiz {
  quizId: string;
  total: number;
  correct: number;
  playedAt: Date | string;
  quizTitle: string;
  subject: string;
}

// 同じ日に何回くり返しても1日と数える。一気にやりこむより、日をあけて復習したほうが
// トロフィーが育つようにして、記憶に残る学び方をごほうびにする。
export const PERFECT_DAY_RARITIES: { rarity: Rarity; perfectDays: number }[] = [
  { rarity: 'common', perfectDays: 1 },
  { rarity: 'rare', perfectDays: 3 },
  { rarity: 'epic', perfectDays: 5 },
  { rarity: 'legendary', perfectDays: 7 },
];

function rarityForPerfectDays(perfectDays: number) {
  let index = 0;
  while (index + 1 < PERFECT_DAY_RARITIES.length && perfectDays >= PERFECT_DAY_RARITIES[index + 1].perfectDays) {
    index += 1;
  }
  return { rarity: PERFECT_DAY_RARITIES[index].rarity, next: PERFECT_DAY_RARITIES[index + 1] ?? null };
}

/** Expects attempts ordered oldest-first so the earliest perfect run wins. */
export function computeTrophies(attempts: AttemptWithQuiz[]): Trophy[] {
  const earned = new Map<string, { quizTitle: string; subject: string; achievedAt: Date; days: Set<string> }>();
  for (const attempt of attempts) {
    if (attempt.total <= 0 || attempt.correct !== attempt.total) continue;
    const playedAt = typeof attempt.playedAt === 'string' ? new Date(attempt.playedAt) : attempt.playedAt;
    const entry = earned.get(attempt.quizId) ?? {
      quizTitle: attempt.quizTitle,
      subject: attempt.subject,
      achievedAt: playedAt,
      days: new Set<string>(),
    };
    entry.days.add(jstDateKey(playedAt));
    earned.set(attempt.quizId, entry);
  }
  return Array.from(earned, ([quizId, entry]) => {
    const perfectDays = entry.days.size;
    return {
      quizId,
      quizTitle: entry.quizTitle,
      subject: entry.subject,
      achievedAt: entry.achievedAt.toISOString(),
      perfectDays,
      ...rarityForPerfectDays(perfectDays),
    };
  });
}
