import { Rarity } from '../types';
import { RARITY_LABELS, rarityStars } from '../utils/rarity';

interface RarityBadgeProps {
  rarity: Rarity;
}

function RarityBadge({ rarity }: RarityBadgeProps) {
  return (
    <span className={`rarity-badge rarity-badge-${rarity}`}>
      <span className="rarity-stars" aria-hidden="true">{rarityStars(rarity)} </span>
      {RARITY_LABELS[rarity]}
    </span>
  );
}

export default RarityBadge;
