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
        <span>Score</span>
        <strong>{score}</strong>
      </div>
      <div className="score-row">
        <span>Streak</span>
        <strong>{streak}</strong>
      </div>
      <div className="score-row">
        <span>Correct</span>
        <strong>{correctCount}/{total}</strong>
      </div>
    </div>
  );
}

export default ScoreCard;
