import { TrophySummary } from '../types';
import { subjectLabel } from '../utils/labels';

interface TrophyCaseProps {
  summary: TrophySummary | null;
}

function TrophyCase({ summary }: TrophyCaseProps) {
  const trophies = summary?.trophies ?? [];

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
    </div>
  );
}

export default TrophyCase;
