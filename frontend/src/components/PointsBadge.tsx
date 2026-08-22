import { PointsSummary } from '../types';

interface PointsBadgeProps {
  summary: PointsSummary | null;
  variant?: 'compact' | 'full';
}

function PointsBadge({ summary, variant = 'compact' }: PointsBadgeProps) {
  if (!summary) return null;

  if (variant === 'compact') {
    return (
      <div className="points-chip" title={`累計ポイント ${summary.totalPoints}pt`}>
        <span className="points-chip-icon" aria-hidden="true">🪙</span>
        <span>{summary.totalPoints}pt</span>
      </div>
    );
  }

  return (
    <div className="points-panel">
      <div className="points-panel-header">
        <span className="points-panel-badge" aria-hidden="true">🪙</span>
        <div>
          <p className="eyebrow">累計ポイント</p>
          <strong>{summary.totalPoints} pt</strong>
        </div>
      </div>
      <p className="hint">これまでに正解した問題数: {summary.totalCorrect}問</p>
    </div>
  );
}

export default PointsBadge;
