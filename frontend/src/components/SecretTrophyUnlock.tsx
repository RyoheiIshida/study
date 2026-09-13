import { TrophySummary } from '../types';
import { rarityRank, sortByRarity } from '../utils/rarity';
import RarityBadge from './RarityBadge';

interface SecretTrophyUnlockProps {
  before: TrophySummary | null;
  after: TrophySummary | null;
}

/** リザルト画面で、今回のプレイで新しく見つけたシークレットトロフィーを知らせる。 */
function SecretTrophyUnlock({ before, after }: SecretTrophyUnlockProps) {
  // プレイ前の状態が取れていないと「新しく見つけた」か判断できないので、何も出さない。
  if (!before || !after) return null;
  const alreadyUnlocked = new Set(before.secrets.filter((secret) => secret.unlocked).map((secret) => secret.id));
  const discovered = sortByRarity(after.secrets.filter((secret) => secret.unlocked && !alreadyUnlocked.has(secret.id)));
  if (discovered.length === 0) return null;
  // いちばん希少なものに合わせて演出を強くする。
  const top = discovered[0].rarity;

  return (
    <div className={`secret-unlock rarity-${top}`} role="status">
      <p className="eyebrow">{rarityRank(top) >= rarityRank('epic') ? '✨ ' : ''}シークレットトロフィー発見！</p>
      {discovered.map((secret) => (
        <div className="secret-unlock-item" key={secret.id}>
          <span className="secret-unlock-icon" aria-hidden="true">{secret.icon}</span>
          <div>
            <RarityBadge rarity={secret.rarity} />
            <strong className="secret-unlock-name">{secret.name}</strong>
            <p>{secret.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SecretTrophyUnlock;
