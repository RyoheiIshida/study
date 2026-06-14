import { useEffect, useMemo, useState } from 'react';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { useAuth } from '../context/AuthContext';
import { ProgressRecord, Quiz } from '../types';
import { buildSubjectSummary, getAccuracy, getBestRecord, getTotals } from '../utils/chartHelpers';

function UserProfile() {
  const { user, logout } = useAuth();
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    async function load() {
      const [quizData, progressData] = await Promise.all([fetchQuizzes(), fetchProgress()]);
      setQuizzes(quizData);
      setRecords(progressData);
    }

    load();
  }, []);

  const totals = getTotals(records);
  const best = getBestRecord(records, quizzes);
  const subjects = useMemo(() => buildSubjectSummary(records, quizzes), [records, quizzes]);
  const lastPlayed = records.length > 0
    ? new Date(Math.max(...records.map((record) => new Date(record.lastPlayed).getTime()))).toLocaleString()
    : 'Not started';

  return (
    <section className="page-stack">
      <div className="panel profile-hero">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{user?.username}</h2>
          <p>Last practice: {lastPlayed}</p>
        </div>
        <button className="button secondary" type="button" onClick={logout}>Log out</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span>Completed quizzes</span>
          <strong>{records.length}</strong>
        </div>
        <div className="stat-card">
          <span>Average accuracy</span>
          <strong>{getAccuracy(totals.correct, totals.total)}%</strong>
        </div>
        <div className="stat-card">
          <span>Best streak</span>
          <strong>{totals.bestStreak}</strong>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Top performance</p>
        <h2>{best?.title ?? 'No completed quiz yet'}</h2>
        <p>{best ? `${best.accuracy}% accuracy, ${best.record.correct}/${best.record.total} correct.` : 'Complete a quiz to build your profile.'}</p>
      </div>

      <div className="panel">
        <p className="eyebrow">Subject record</p>
        <div className="subject-list">
          {subjects.length === 0 ? (
            <p>No subject stats yet.</p>
          ) : subjects.map((subject) => (
            <article className="subject-row" key={subject.subject}>
              <div>
                <strong>{subject.subject}</strong>
                <span>{subject.correct} / {subject.total} correct</span>
              </div>
              <div className="meter">
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

export default UserProfile;
