interface TimerDisplayProps {
  secondsLeft: number;
  totalSeconds: number;
}

function TimerDisplay({ secondsLeft, totalSeconds }: TimerDisplayProps) {
  const safeTotal = Math.max(totalSeconds, 1);
  const percent = Math.max(0, Math.min(100, (secondsLeft / safeTotal) * 100));
  const urgent = secondsLeft <= 10;

  return (
    <div className={`timer-display ${urgent ? 'urgent' : ''}`} aria-live="polite">
      <div className="timer-topline">
        <span>Time</span>
        <strong>{secondsLeft}s</strong>
      </div>
      <div className="timer-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default TimerDisplay;
