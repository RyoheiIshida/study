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

export const dailyQuestDefinitions: DailyQuestDefinition[] = [
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
    description: 'クイズを1回終えるとクリアです。',
    target: 1,
    current: (stats) => Math.min(stats.attemptCount, 1),
    completed: (stats) => stats.attemptCount >= 1,
  },
  {
    id: 'daily-correct',
    title: '正解を重ねよう',
    description: '今日の正解数の合計が3問に達したらクリアです。',
    target: 3,
    current: (stats) => Math.min(stats.totalCorrect, 3),
    completed: (stats) => stats.totalCorrect >= 3,
  },
  {
    id: 'daily-streak',
    title: '連続正解',
    description: '1回のクイズで3問連続正解を目指しましょう。',
    target: 3,
    current: (stats) => Math.min(stats.bestStreak, 3),
    completed: (stats) => stats.bestStreak >= 3,
  },
];
