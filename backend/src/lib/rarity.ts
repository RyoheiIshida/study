/** トロフィーの希少度。低いものから並べる。 */
export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;

export type Rarity = (typeof RARITIES)[number];
