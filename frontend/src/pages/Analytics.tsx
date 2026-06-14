import { useEffect, useMemo, useState } from 'react';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { ProgressRecord, Quiz } from '../types';
import { buildSubjectSummary, buildTrend, getAccuracy, getTotals } from '../utils/chartHelpers';

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
        <p className="eyebrow">Analytics</p>
        <h2>Learning signal</h2>
        <p>Accuracy, streaks, and subject balance from your completed quizzes.</p>
        <div className="stat-grid">
          <div className="stat-card">
            <span>Overall accuracy</span>
            <strong>{getAccuracy(totals.correct, totals.total)}%</strong>
          </div>
          <div className="stat-card">
            <span>Questions answered</span>
            <strong>{totals.total}</strong>
          </div>
          <div className="stat-card">
            <span>Best streak</span>
            <strong>{totals.bestStreak}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Score trend</p>
            <h2>Recent quiz accuracy</h2>
          </div>
        </div>
        {loading ? (
          <p>Loading analytics...</p>
        ) : trend.length === 0 ? (
          <p>No analytics yet. Complete a quiz to draw your first trend.</p>
        ) : (
          <div className="bar-chart" role="img" aria-label="Quiz accuracy chart">
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
        <p className="eyebrow">Subjects</p>
        <h2>Accuracy by subject</h2>
        <div className="subject-list">
          {subjects.length === 0 ? (
            <p>No subject data yet.</p>
          ) : subjects.map((subject) => (
            <article className="subject-row" key={subject.subject}>
              <div>
                <strong>{subject.subject}</strong>
                <span>{subject.correct} / {subject.total} correct</span>
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
