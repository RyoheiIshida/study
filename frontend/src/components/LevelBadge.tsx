import { XpSummary } from '../types';

interface LevelBadgeProps {
  summary: XpSummary | null;
  variant?: 'compact' | 'full';
}

function LevelBadge({ summary, variant = 'compact' }: LevelBadgeProps) {
  if (!summary) return null;

  const xpToNext = Math.max(summary.xpForNextLevel - summary.xpIntoLevel, 0);

  if (variant === 'compact') {
    return (
      <div className="level-chip" title={`経験値 ${summary.totalXp}XP・次のレベルまで ${xpToNext}XP`}>
        <span className="level-chip-badge">Lv.{summary.level}</span>
        <span className="level-chip-bar">
          <span style={{ width: `${summary.progressPercent}%` }} />
        </span>
      </div>
    );
  }

  return (
    <div className="level-panel">
      <div className="level-panel-header">
        <span className="level-panel-badge">Lv.{summary.level}</span>
        <div>
          <p className="eyebrow">経験値</p>
          <strong>{summary.totalXp} XP</strong>
        </div>
      </div>
      <div className="meter level-meter">
        <span style={{ width: `${summary.progressPercent}%` }} />
      </div>
      <p className="hint">次のレベルまであと {xpToNext} XP</p>
    </div>
  );
}

export default LevelBadge;
