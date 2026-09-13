import { TrophySummary } from '../types';
import { subjectLabel } from '../utils/labels';
import { RARITY_LABELS, RARITY_ORDER, sortByRarity } from '../utils/rarity';
import RarityBadge from './RarityBadge';

interface TrophyCaseProps {
  summary: TrophySummary | null;
}

function TrophyCase({ summary }: TrophyCaseProps) {
  const trophies = sortByRarity(summary?.trophies ?? []);
  const secrets = sortByRarity(summary?.secrets ?? []);
  const unlockedSecrets = secrets.filter((secret) => secret.unlocked).length;
  const rarityCounts = RARITY_ORDER.map((rarity) => ({
    rarity,
    count: trophies.filter((trophy) => trophy.rarity === rarity).length,
  })).reverse();

  return (
    <div className="panel trophy-panel">
      <p className="eyebrow">トロフィー</p>
      <h3>全問正解トロフィー（{trophies.length}個）</h3>
      {trophies.length === 0 ? (
        <p>クイズに全問正解するとトロフィーがもらえます。</p>
      ) : (
        <>
          <p className="hint">ちがう日に全問正解するたびに、トロフィーのレア度が上がります。</p>
          <ul className="rarity-counts" aria-label="レア度ごとの数">
            {rarityCounts.map(({ rarity, count }) => (
              <li key={rarity} className={`rarity-count rarity-badge-${rarity}`}>
                {RARITY_LABELS[rarity]} <strong>{count}</strong>
              </li>
            ))}
          </ul>
          <div className="trophy-grid">
            {trophies.map((trophy) => (
              <article className={`trophy-card rarity-${trophy.rarity}`} key={trophy.quizId}>
                <RarityBadge rarity={trophy.rarity} />
                <span className="trophy-icon" aria-hidden="true">🏆</span>
                <strong>{trophy.quizTitle}</strong>
                <span className="tag muted">{subjectLabel(trophy.subject)}</span>
                <span className="trophy-progress">
                  {trophy.next
                    ? `あと${trophy.next.perfectDays - trophy.perfectDays}日で${RARITY_LABELS[trophy.next.rarity]}`
                    : `全問正解 ${trophy.perfectDays}日`}
                </span>
                <span className="trophy-date">{new Date(trophy.achievedAt).toLocaleDateString()}</span>
              </article>
            ))}
          </div>
        </>
      )}

      {secrets.length > 0 && (
        <div className="secret-section">
          <h3>シークレットトロフィー（{unlockedSecrets} / {secrets.length}）</h3>
          <p className="hint">手に入れる条件はひみつ。ヒントをたよりに探してみよう。</p>
          <div className="trophy-grid secret-grid">
            {secrets.map((secret) =>
              secret.unlocked ? (
                <article className={`trophy-card secret-card rarity-${secret.rarity}`} key={secret.id}>
                  <RarityBadge rarity={secret.rarity} />
                  <span className="trophy-icon" aria-hidden="true">{secret.icon}</span>
                  <strong>{secret.name}</strong>
                  <span className="secret-description">{secret.description}</span>
                  {secret.achievedAt && (
                    <span className="trophy-date">{new Date(secret.achievedAt).toLocaleDateString()}</span>
                  )}
                </article>
              ) : (
                <article className="trophy-card secret-card locked" key={secret.id}>
                  <RarityBadge rarity={secret.rarity} />
                  <span className="trophy-icon" aria-hidden="true">？</span>
                  <strong aria-label="未発見">？？？</strong>
                  <span className="secret-description">{secret.hint}</span>
                </article>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrophyCase;
