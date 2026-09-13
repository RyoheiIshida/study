export type LuckyTier = 'lucky' | 'super' | 'miracle';

export interface LuckyBonus {
  tier: LuckyTier | null;
  multiplier: number;
  bonusXp: number;
}

interface LuckyTierDefinition {
  tier: LuckyTier;
  multiplier: number;
  chance: number;
}

// 当たりやすいものから並べる。はずれは残りの 80%。
// 期待値は正解ぶんの XP の約 1.14 倍に抑え、レベル（＝月の換金上限）の上がり方が大きく変わらないようにする。
export const LUCKY_TIERS: LuckyTierDefinition[] = [
  { tier: 'lucky', multiplier: 1.5, chance: 0.15 },
  { tier: 'super', multiplier: 2, chance: 0.04 },
  { tier: 'miracle', multiplier: 3, chance: 0.01 },
];

const NO_BONUS: LuckyBonus = { tier: null, multiplier: 1, bonusXp: 0 };

/**
 * クイズ1回ごとに引くラッキーボーナスの抽選。
 *
 * 倍率がかかるのは正解数ぶんの XP だけなので、当たっても正解が多いほど得をする。
 * 1問も正解していないときは抽選しない（適当に押しても当たりが出ないように）。
 * ポイントはおこづかいに換わるため、ランダム要素はポイントには入れず XP だけにとどめる。
 */
export function rollLuckyBonus(correct: number, random: () => number = Math.random): LuckyBonus {
  if (correct <= 0) return NO_BONUS;
  const roll = random();
  let threshold = 0;
  for (const definition of LUCKY_TIERS) {
    threshold += definition.chance;
    if (roll < threshold) {
      const baseXp = correct * 10;
      return {
        tier: definition.tier,
        multiplier: definition.multiplier,
        bonusXp: Math.round(baseXp * (definition.multiplier - 1)),
      };
    }
  }
  return NO_BONUS;
}
