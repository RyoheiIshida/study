import { Grade, PointsSummary } from '../types';

interface PointsResultProps {
  before: PointsSummary | null;
  after: PointsSummary;
  grade: Grade;
}

function PointsResult({ before, after, grade }: PointsResultProps) {
  const earned = Math.max(after.totalPoints - (before?.totalPoints ?? after.totalPoints), 0);

  return (
    <div className="points-result">
      <p className="eyebrow">ポイント</p>
      <p>
        獲得ポイント: +{earned}pt
        {' '}・ 累計{after.totalPoints}pt
      </p>
      {grade === 'Elementary' ? (
        <p className="hint">小学生向けのクイズはXPだけがもらえます。ポイントは中学生向けのクイズで集めよう。</p>
      ) : (
        <p className="hint">今月獲得したポイント {after.monthlyEarnedPoints}pt（おこづかいに交換できるのは今月獲得したぶんまで）</p>
      )}
    </div>
  );
}

export default PointsResult;
