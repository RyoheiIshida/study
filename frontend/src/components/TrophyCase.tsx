import { TrophySummary } from '../types';
import { subjectLabel } from '../utils/labels';

interface TrophyCaseProps {
  summary: TrophySummary | null;
}

function TrophyCase({ summary }: TrophyCaseProps) {
  const trophies = summary?.trophies ?? [];
  const secrets = summary?.secrets ?? [];
  const unlockedSecrets = secrets.filter((secret) => secret.unlocked).length;

  return (
    <div className="panel trophy-panel">
      <p className="eyebrow">トロフィー</p>
      <h3>全問正解トロフィー（{trophies.length}個）</h3>
      {trophies.length === 0 ? (
        <p>クイズに全問正解するとトロフィーがもらえます。</p>
      ) : (
        <div className="trophy-grid">
          {trophies.map((trophy) => (
            <article className="trophy-card" key={trophy.quizId}>
              <span className="trophy-icon" aria-hidden="true">🏆</span>
              <strong>{trophy.quizTitle}</strong>
              <span className="tag muted">{subjectLabel(trophy.subject)}</span>
              <span className="trophy-date">{new Date(trophy.achievedAt).toLocaleDateString()}</span>
            </article>
          ))}
        </div>
      )}

      {secrets.length > 0 && (
        <div className="secret-section">
          <h3>シークレットトロフィー（{unlockedSecrets} / {secrets.length}）</h3>
          <p className="hint">手に入れる条件はひみつ。ヒントをたよりに探してみよう。</p>
          <div className="trophy-grid secret-grid">
            {secrets.map((secret) =>
              secret.unlocked ? (
                <article className="trophy-card secret-card" key={secret.id}>
                  <span className="trophy-icon" aria-hidden="true">{secret.icon}</span>
                  <strong>{secret.name}</strong>
                  <span className="secret-description">{secret.description}</span>
                  {secret.achievedAt && (
                    <span className="trophy-date">{new Date(secret.achievedAt).toLocaleDateString()}</span>
                  )}
                </article>
              ) : (
                <article className="trophy-card secret-card locked" key={secret.id}>
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
