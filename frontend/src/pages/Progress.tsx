import { useCallback, useEffect, useState } from 'react';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { ProgressRecord, Quiz } from '../types';

function Progress() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadProgressData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setQuizzes(await fetchQuizzes());
      setRecords(await fetchProgress());
    } catch (error) {
      setErrorMessage('進捗の取得中に問題が発生しました。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const progressWithQuiz = records.map((record) => ({
    record,
    quiz: quizzes.find((quiz) => quiz.id === record.quizId),
  }));

  const badge = progressWithQuiz.reduce((best, item) => {
    const score = item.record.correct / item.record.total;
    if (score > best.score) {
      return { score, title: item.quiz?.title ?? 'クイズ', record: item.record };
    }
    return best;
  }, { score: 0, title: '未達成', record: null as ProgressRecord | null });

  return (
    <section>
      <div className="panel">
        <div className="challenge-header">
          <div>
            <h2>進捗ダッシュボード</h2>
            <p>解いたクイズの結果と連続正解コンボを確認できます。</p>
          </div>
          <button className="button secondary" onClick={loadProgressData} disabled={isLoading}>
            {isLoading ? '読み込み中…' : '最新の進捗を取得'}
          </button>
        </div>
        {errorMessage && <p className="feedback">{errorMessage}</p>}
        {isLoading ? (
          <p>進捗を読み込み中です...</p>
        ) : records.length === 0 ? (
          <p>まだプレイした問題がありません。クイズ一覧から挑戦しましょう。</p>
        ) : (
          <div className="progress-grid">
            {progressWithQuiz.map((item) => (
              <article key={item.record.quizId} className="card small-card">
                <h3>{item.quiz?.title ?? 'クイズ'}</h3>
                <p>正解: {item.record.correct} / {item.record.total}</p>
                <p>連続正解: {item.record.streak}</p>
                <p>最終更新: {new Date(item.record.lastPlayed).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
        <div className="panel badge-panel">
          <h3>今日のバッジ</h3>
          <p>{badge.title} でベストスコアを獲得しました。</p>
        </div>
      </div>
    </section>
  );
}

export default Progress;
