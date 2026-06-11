interface ScoreCardProps {
  score: number;
  streak: number;
  correctCount: number;
  total: number;
}

function ScoreCard({ score, streak, correctCount, total }: ScoreCardProps) {
  return (
    <div className="score-card">
      <div className="score-row">
        <span>スコア</span>
        <strong>{score}</strong>
      </div>
      <div className="score-row">
        <span>連続正解</span>
        <strong>{streak}</strong>
      </div>
      <div className="score-row">
        <span>正解</span>
        <strong>{correctCount}/{total}</strong>
      </div>
    </div>
  );
}

export default ScoreCard;
