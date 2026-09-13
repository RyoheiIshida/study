import { Rarity } from '../types';

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'ノーマル',
  rare: 'レア',
  epic: 'スーパーレア',
  legendary: 'レジェンド',
};

export function rarityRank(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity);
}

export function rarityStars(rarity: Rarity): string {
  return '★'.repeat(rarityRank(rarity) + 1);
}

/** 希少度の高い順。同じ希少度なら先に並んでいた順を保つ。 */
export function sortByRarity<T extends { rarity: Rarity }>(items: T[]): T[] {
  return [...items].sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity));
}
