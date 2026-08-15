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
      setErrorMessage('進捗を読み込めませんでした。');
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
            <p className="eyebrow">進捗</p>
            <h2>練習ダッシュボード</h2>
            <p>最近のクイズ結果と連続正解数を確認できます。</p>
          </div>
          <button className="button secondary" onClick={loadProgressData} disabled={isLoading}>
            {isLoading ? '読み込み中...' : '更新'}
          </button>
        </div>
        {errorMessage && <p className="feedback">{errorMessage}</p>}
        <div className="stat-grid">
          <div className="stat-card">
            <span>完了数</span>
            <strong>{records.length}</strong>
          </div>
          <div className="stat-card">
            <span>正答率</span>
            <strong>{getAccuracy(totals.correct, totals.total)}%</strong>
          </div>
          <div className="stat-card">
            <span>最高連続正解数</span>
            <strong>{totals.bestStreak}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        {isLoading ? (
          <p>進捗を読み込み中...</p>
        ) : records.length === 0 ? (
          <p>完了したクイズはまだありません。クイズ一覧から始めましょう。</p>
        ) : (
          <div className="progress-grid">
            {progressWithQuiz.map((item) => (
              <article key={item.record.quizId} className="card small-card">
                <div className="card-header">
                  <span className="tag">{getAccuracy(item.record.correct, item.record.total)}%</span>
                  <span className="tag muted">連続正解 {item.record.streak}</span>
                </div>
                <h3>{item.quiz?.title ?? 'クイズ'}</h3>
                <p>正解数: {item.record.correct} / {item.record.total}</p>
                <p>最終プレイ: {new Date(item.record.lastPlayed).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel badge-panel">
        <p className="eyebrow">自己ベスト</p>
        <h3>{best?.title ?? 'バッジはまだありません'}</h3>
        <p>{best ? `正答率${best.accuracy}%、連続正解${best.record.streak}回。` : 'クイズを完了して最初のバッジを獲得しましょう。'}</p>
      </div>
    </section>
  );
}

export default Progress;
