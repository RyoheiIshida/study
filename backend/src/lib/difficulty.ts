export type DifficultyTier = 'basic' | 'star1' | 'star2' | 'star3';

export interface RewardRule {
  tier: DifficultyTier;
  /** 画面に出す星の数。basic は 0。 */
  stars: number;
  label: string;
  xpPerCorrect: number;
  pointsPerCorrect: number;
  /**
   * 換金レートを決める正答率に足すぶん。難しいクイズほど正答率が下がりやすいので、
   * 難しい問題に挑戦したせいでレートが下がり、かえって損をすることがないようにする。
   */
  accuracyBonus: number;
}

// 難しいほど1問あたりの XP とポイントが増える。
// ポイントは1日の上限（DAILY_POINT_LIMIT）があるので、難しいクイズを選ぶと少ない問題数で上限に届くが、
// 1日・1か月にもらえる金額そのものは増えない。
// basic の XP を star1 と同じにしているのは、難易度を入れる前に貯めた XP（＝レベル）が減らないようにするため。
export const REWARD_RULES: Record<DifficultyTier, RewardRule> = {
  basic: { tier: 'basic', stars: 0, label: 'きそ', xpPerCorrect: 10, pointsPerCorrect: 0, accuracyBonus: 0 },
  star1: { tier: 'star1', stars: 1, label: 'やさしい', xpPerCorrect: 10, pointsPerCorrect: 1, accuracyBonus: 0 },
  star2: { tier: 'star2', stars: 2, label: 'ふつう', xpPerCorrect: 15, pointsPerCorrect: 2, accuracyBonus: 0.05 },
  star3: { tier: 'star3', stars: 3, label: 'むずかしい', xpPerCorrect: 20, pointsPerCorrect: 3, accuracyBonus: 0.1 },
};

/**
 * 中学生向けクイズの難易度。ここにないクイズは学年から決める（小学生向けは basic、それ以外は star1）。
 * frontend/src/utils/quizGroups.ts の段階の並びと合わせてある。クイズを追加・変更したら両方見直すこと。
 */
const QUIZ_TIERS: Record<string, DifficultyTier> = {
  // 一次関数: 2本だけを見比べる2択と、＋か－かの2択
  'linear-graph-pair-slope-1-half': 'star1',
  'linear-graph-pair-slope-1-2': 'star1',
  'linear-graph-pair-slope-1-m1': 'star1',
  'linear-graph-pair-slope-2-m2': 'star1',
  'linear-graph-pair-intercept-1-2': 'star1',
  'linear-graph-pair-intercept-1-3': 'star1',
  'linear-graph-pair-intercept-2-3': 'star1',
  'linear-graph-pair-intercept-1-m1': 'star1',
  'linear-graph-pair-intercept-2-m2': 'star1',
  'linear-graph-pair-intercept-3-m3': 'star1',
  'linear-graph-supereasy-slope': 'star1',
  'linear-graph-supereasy-intercept': 'star1',
  // 一次関数: 2択をぜんぶ混ぜたロングと、傾き／切片だけの4択
  'linear-graph-pair-long-slope': 'star2',
  'linear-graph-pair-long-intercept': 'star2',
  'linear-graph-easy-intercept0': 'star2',
  'linear-graph-easy-slope1': 'star2',
  // 一次関数: 傾きも切片も読み取る4択
  'linear-graph-1': 'star3',
  // 漢字（読み・書き取りとも入力式）
  'kanji-middle1': 'star2',
  'kanji-writing-middle1': 'star2',
  'kanji-middle2': 'star3',
  'kanji-writing-middle2': 'star3',
  'kanji-middle3': 'star3',
  'kanji-writing-middle3': 'star3',
};

export function difficultyTierFor(quizId: string, grade: string): DifficultyTier {
  return QUIZ_TIERS[quizId] ?? (grade === 'Elementary' ? 'basic' : 'star1');
}

export function rewardRuleFor(quizId: string, grade: string): RewardRule {
  return REWARD_RULES[difficultyTierFor(quizId, grade)];
}
