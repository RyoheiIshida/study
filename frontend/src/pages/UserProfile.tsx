import { useEffect, useMemo, useState } from 'react';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { fetchXpSummary } from '../api/xp';
import { fetchTrophySummary } from '../api/trophies';
import { useAuth } from '../context/AuthContext';
import { ProgressRecord, Quiz, TrophySummary, XpSummary } from '../types';
import { buildSubjectSummary, getAccuracy, getBestRecord, getTotals } from '../utils/chartHelpers';
import { subjectLabel } from '../utils/labels';
import LevelBadge from '../components/LevelBadge';
import TrophyCase from '../components/TrophyCase';

function UserProfile() {
  const { user, logout } = useAuth();
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [xpSummary, setXpSummary] = useState<XpSummary | null>(null);
  const [trophySummary, setTrophySummary] = useState<TrophySummary | null>(null);

  useEffect(() => {
    async function load() {
      const [quizData, progressData, xpData, trophyData] = await Promise.all([
        fetchQuizzes(),
        fetchProgress(),
        fetchXpSummary(),
        fetchTrophySummary(),
      ]);
      setQuizzes(quizData);
      setRecords(progressData);
      setXpSummary(xpData);
      setTrophySummary(trophyData);
    }

    load();
  }, []);

  const totals = getTotals(records);
  const best = getBestRecord(records, quizzes);
  const subjects = useMemo(() => buildSubjectSummary(records, quizzes), [records, quizzes]);
  const lastPlayed = records.length > 0
    ? new Date(Math.max(...records.map((record) => new Date(record.lastPlayed).getTime()))).toLocaleString()
    : '未開始';

  return (
    <section className="page-stack">
      <div className="panel profile-hero">
        <div>
          <p className="eyebrow">プロフィール</p>
          <h2>{user?.username}</h2>
          <p>最終練習日: {lastPlayed}</p>
        </div>
        <button className="button secondary" type="button" onClick={logout}>ログアウト</button>
      </div>

      <div className="panel">
        <LevelBadge summary={xpSummary} variant="full" />
      </div>

      <TrophyCase summary={trophySummary} />

      <div className="stat-grid">
        <div className="stat-card">
          <span>完了したクイズ数</span>
          <strong>{records.length}</strong>
        </div>
        <div className="stat-card">
          <span>平均正答率</span>
          <strong>{getAccuracy(totals.correct, totals.total)}%</strong>
        </div>
        <div className="stat-card">
          <span>最高連続正解数</span>
          <strong>{totals.bestStreak}</strong>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">最高記録</p>
        <h2>{best?.title ?? '完了したクイズはまだありません'}</h2>
        <p>{best ? `正答率${best.accuracy}%、${best.record.correct}/${best.record.total}問正解。` : 'クイズを完了してプロフィールを充実させましょう。'}</p>
      </div>

      <div className="panel">
        <p className="eyebrow">科目別記録</p>
        <div className="subject-list">
          {subjects.length === 0 ? (
            <p>科目別のデータはまだありません。</p>
          ) : subjects.map((subject) => (
            <article className="subject-row" key={subject.subject}>
              <div>
                <strong>{subjectLabel(subject.subject)}</strong>
                <span>{subject.correct} / {subject.total} 問正解</span>
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
