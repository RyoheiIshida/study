export interface QuestStats {
  attemptCount: number;
  totalCorrect: number;
  bestStreak: number;
}

export interface DailyQuestDefinition {
  id: string;
  title: string;
  description: string;
  target: number;
  current: (stats: QuestStats) => number;
  completed: (stats: QuestStats) => boolean;
}

interface DifficultyRange {
  attempt: [number, number];
  correct: [number, number];
  streak: [number, number];
}

// レベルが上がるほど範囲の下限・上限を引き上げ、要求される目標値を難しくする。
const DIFFICULTY_TIERS: DifficultyRange[] = [
  { attempt: [1, 2], correct: [3, 5], streak: [2, 3] }, // Lv.1-3: はじめて
  { attempt: [2, 3], correct: [6, 10], streak: [4, 6] }, // Lv.4-7: なれてきた
  { attempt: [3, 4], correct: [12, 18], streak: [7, 10] }, // Lv.8-13: 上級者
  { attempt: [4, 5], correct: [20, 30], streak: [11, 15] }, // Lv.14+: エキスパート
];

function tierForLevel(level: number): DifficultyRange {
  if (level >= 14) return DIFFICULTY_TIERS[3];
  if (level >= 8) return DIFFICULTY_TIERS[2];
  if (level >= 4) return DIFFICULTY_TIERS[1];
  return DIFFICULTY_TIERS[0];
}

// username と日付から決まる疑似乱数。同じ日は同じ結果になり、日が変わるとランダムに変化する。
function createSeededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  let state = hash >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

function randomInRange(random: () => number, [min, max]: [number, number]): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function generateDailyQuests(level: number, seed: string): DailyQuestDefinition[] {
  const random = createSeededRandom(seed);
  const tier = tierForLevel(level);

  const attemptTarget = randomInRange(random, tier.attempt);
  const correctTarget = randomInRange(random, tier.correct);
  const streakTarget = randomInRange(random, tier.streak);

  return [
    {
      id: 'daily-login',
      title: 'ログインボーナス',
      description: '今日もログインして学習をスタートしましょう。',
      target: 1,
      current: () => 1,
      completed: () => true,
    },
    {
      id: 'daily-attempt',
      title: 'クイズに挑戦',
      description: `クイズを${attemptTarget}回終えるとクリアです。`,
      target: attemptTarget,
      current: (stats) => Math.min(stats.attemptCount, attemptTarget),
      completed: (stats) => stats.attemptCount >= attemptTarget,
    },
    {
      id: 'daily-correct',
      title: '正解を重ねよう',
      description: `今日の正解数の合計が${correctTarget}問に達したらクリアです。`,
      target: correctTarget,
      current: (stats) => Math.min(stats.totalCorrect, correctTarget),
      completed: (stats) => stats.totalCorrect >= correctTarget,
    },
    {
      id: 'daily-streak',
      title: '連続正解',
      description: `1回のクイズで${streakTarget}問連続正解を目指しましょう。`,
      target: streakTarget,
      current: (stats) => Math.min(stats.bestStreak, streakTarget),
      completed: (stats) => stats.bestStreak >= streakTarget,
    },
  ];
}
