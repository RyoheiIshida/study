import { useEffect, useMemo, useState } from 'react';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { ProgressRecord, Quiz } from '../types';
import { buildSubjectSummary, buildTrend, getAccuracy, getTotals } from '../utils/chartHelpers';
import { subjectLabel } from '../utils/labels';

function Analytics() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [quizData, progressData] = await Promise.all([fetchQuizzes(), fetchProgress()]);
      setQuizzes(quizData);
      setRecords(progressData);
      setLoading(false);
    }

    load();
  }, []);

  const trend = useMemo(() => buildTrend(records, quizzes), [records, quizzes]);
  const subjects = useMemo(() => buildSubjectSummary(records, quizzes), [records, quizzes]);
  const totals = getTotals(records);

  return (
    <section className="page-stack">
      <div className="panel">
        <p className="eyebrow">分析</p>
        <h2>学習の傾向</h2>
        <p>これまでに完了したクイズの正答率、連続正解数、科目バランスを表示します。</p>
        <div className="stat-grid">
          <div className="stat-card">
            <span>総合正答率</span>
            <strong>{getAccuracy(totals.correct, totals.total)}%</strong>
          </div>
          <div className="stat-card">
            <span>回答した問題数</span>
            <strong>{totals.total}</strong>
          </div>
          <div className="stat-card">
            <span>最高連続正解数</span>
            <strong>{totals.bestStreak}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">スコアの推移</p>
            <h2>直近のクイズ正答率</h2>
          </div>
        </div>
        {loading ? (
          <p>分析を読み込み中...</p>
        ) : trend.length === 0 ? (
          <p>分析データはまだありません。クイズを完了すると推移が表示されます。</p>
        ) : (
          <div className="bar-chart" role="img" aria-label="クイズ正答率のグラフ">
            {trend.map((point) => (
              <div className="bar-column" key={point.label}>
                <div className="bar-shell">
                  <span style={{ height: `${point.accuracy}%` }} />
                </div>
                <strong>{point.accuracy}%</strong>
                <small title={point.label}>{point.label}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <p className="eyebrow">科目</p>
        <h2>科目別正答率</h2>
        <div className="subject-list">
          {subjects.length === 0 ? (
            <p>科目データはまだありません。</p>
          ) : subjects.map((subject) => (
            <article className="subject-row" key={subject.subject}>
              <div>
                <strong>{subjectLabel(subject.subject)}</strong>
                <span>{subject.correct} / {subject.total} 問正解</span>
              </div>
              <div className="meter" aria-label={`${subject.accuracy}%`}>
                <span style={{ width: `${subject.accuracy}%` }} />
              </div>
              <strong>{subject.accuracy}%</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Analytics;
