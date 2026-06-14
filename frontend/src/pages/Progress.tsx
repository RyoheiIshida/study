import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { ProgressRecord, Quiz } from '../types';
import { getAccuracy, getBestRecord, getTotals } from '../utils/chartHelpers';

function Progress() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProgressData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [quizData, progressData] = await Promise.all([fetchQuizzes(), fetchProgress()]);
      setQuizzes(quizData);
      setRecords(progressData);
    } catch {
      setErrorMessage('Progress could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const progressWithQuiz = useMemo(() => records.map((record) => ({
    record,
    quiz: quizzes.find((quiz) => quiz.id === record.quizId),
  })), [quizzes, records]);
  const totals = getTotals(records);
  const best = getBestRecord(records, quizzes);

  return (
    <section className="page-stack">
      <div className="panel">
        <div className="challenge-header">
          <div>
            <p className="eyebrow">Progress</p>
            <h2>Practice dashboard</h2>
            <p>Review your latest quiz results and streaks.</p>
          </div>
          <button className="button secondary" onClick={loadProgressData} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {errorMessage && <p className="feedback">{errorMessage}</p>}
        <div className="stat-grid">
          <div className="stat-card">
            <span>Completed</span>
            <strong>{records.length}</strong>
          </div>
          <div className="stat-card">
            <span>Accuracy</span>
            <strong>{getAccuracy(totals.correct, totals.total)}%</strong>
          </div>
          <div className="stat-card">
            <span>Best streak</span>
            <strong>{totals.bestStreak}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        {isLoading ? (
          <p>Loading progress...</p>
        ) : records.length === 0 ? (
          <p>No completed quizzes yet. Start from the quiz list.</p>
        ) : (
          <div className="progress-grid">
            {progressWithQuiz.map((item) => (
              <article key={item.record.quizId} className="card small-card">
                <div className="card-header">
                  <span className="tag">{getAccuracy(item.record.correct, item.record.total)}%</span>
                  <span className="tag muted">Streak {item.record.streak}</span>
                </div>
                <h3>{item.quiz?.title ?? 'Quiz'}</h3>
                <p>Correct: {item.record.correct} / {item.record.total}</p>
                <p>Last played: {new Date(item.record.lastPlayed).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel badge-panel">
        <p className="eyebrow">Best run</p>
        <h3>{best?.title ?? 'No badge yet'}</h3>
        <p>{best ? `${best.accuracy}% accuracy with a streak of ${best.record.streak}.` : 'Complete a quiz to earn your first badge.'}</p>
      </div>
    </section>
  );
}

export default Progress;
