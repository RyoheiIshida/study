import { TrophySummary } from '../types';

interface SecretTrophyUnlockProps {
  before: TrophySummary | null;
  after: TrophySummary | null;
}

/** リザルト画面で、今回のプレイで新しく見つけたシークレットトロフィーを知らせる。 */
function SecretTrophyUnlock({ before, after }: SecretTrophyUnlockProps) {
  // プレイ前の状態が取れていないと「新しく見つけた」か判断できないので、何も出さない。
  if (!before || !after) return null;
  const alreadyUnlocked = new Set(before.secrets.filter((secret) => secret.unlocked).map((secret) => secret.id));
  const discovered = after.secrets.filter((secret) => secret.unlocked && !alreadyUnlocked.has(secret.id));
  if (discovered.length === 0) return null;

  return (
    <div className="secret-unlock" role="status">
      <p className="eyebrow">シークレットトロフィー発見！</p>
      {discovered.map((secret) => (
        <div className="secret-unlock-item" key={secret.id}>
          <span className="secret-unlock-icon" aria-hidden="true">{secret.icon}</span>
          <div>
            <strong>{secret.name}</strong>
            <p>{secret.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SecretTrophyUnlock;
