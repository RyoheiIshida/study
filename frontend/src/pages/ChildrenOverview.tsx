import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { fetchFamilyInfo } from '../api/family';
import { fetchLoginSummary } from '../api/loginDays';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { fetchXpSummary } from '../api/xp';
import { useAuth } from '../context/AuthContext';
import { FamilyMember, LoginSummary, ProgressRecord, Quiz, XpSummary } from '../types';
import { formatDuration, getAccuracy, getTotals } from '../utils/chartHelpers';
import Analytics from './Analytics';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const RECENT_QUIZ_COUNT = 3;

interface ChildSnapshot {
  username: string;
  xp: XpSummary | null;
  login: LoginSummary | null;
  records: ProgressRecord[];
  failed: boolean;
}

/** バックエンドの日付キー（JST の YYYY-MM-DD）を days 日ずらす。 */
function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function loadSnapshot(username: string): Promise<ChildSnapshot> {
  const [xp, login, records] = await Promise.allSettled([
    fetchXpSummary(username),
    fetchLoginSummary(username),
    fetchProgress(username),
  ]);
  return {
    username,
    xp: xp.status === 'fulfilled' ? xp.value : null,
    login: login.status === 'fulfilled' ? login.value : null,
    records: records.status === 'fulfilled' ? records.value : [],
    failed: [xp, login, records].some((result) => result.status === 'rejected'),
  };
}

function ChildCard({ snapshot, quizzes }: { snapshot: ChildSnapshot; quizzes: Quiz[] }) {
  const { username, xp, login, records, failed } = snapshot;
  // 「今日」は端末の時計ではなくバックエンドが JST で決めた日付に合わせる。
  const today = login?.today ?? new Date().toISOString().slice(0, 10);
  const dailyByDate = new Map((xp?.dailyXp ?? []).map((point) => [point.date, point]));
  const todayPoint = dailyByDate.get(today);

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDateKey(today, index - 6);
    const point = dailyByDate.get(date);
    return {
      date,
      weekday: WEEKDAY_LABELS[new Date(`${date}T00:00:00.000Z`).getUTCDay()],
      questions: point?.questions ?? 0,
      durationMs: point?.durationMs ?? 0,
    };
  });
  const studyDaysThisWeek = week.filter((day) => day.questions > 0).length;
  const weekDurationMs = week.reduce((sum, day) => sum + day.durationMs, 0);

  const totals = getTotals(records);
  const recent = [...records]
    .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
    .slice(0, RECENT_QUIZ_COUNT);
  const lastPlayed = recent[0] ? new Date(recent[0].lastPlayed).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : null;

  return (
    <article className="panel child-card">
      <div className="child-card-header">
        <div>
          <h3>
            {username}
            {xp && <span className="child-level">Lv.{xp.level}</span>}
          </h3>
          <p className="hint">{lastPlayed ? `最後に学習: ${lastPlayed}` : 'まだクイズに取り組んでいません'}</p>
        </div>
        <span className={`tag${todayPoint ? ' success' : ' muted'}`}>
          {todayPoint ? '今日は学習済み' : '今日はまだ'}
        </span>
      </div>

      {failed && (
        <p className="feedback-error" role="alert">一部の記録を取得できませんでした。時間をおいて更新してください。</p>
      )}

      <div className="stat-grid child-stat-grid">
        <div className="stat-card">
          <span>今日の問題数</span>
          <strong>{todayPoint?.questions ?? 0}問</strong>
          {Boolean(todayPoint?.durationMs) && <small>{formatDuration(todayPoint!.durationMs)}</small>}
        </div>
        <div className="stat-card">
          <span>直近7日の学習</span>
          <strong>{studyDaysThisWeek}日</strong>
          {weekDurationMs > 0 && <small>合計 {formatDuration(weekDurationMs)}</small>}
        </div>
        <div className="stat-card">
          <span>連続ログイン</span>
          <strong>{login ? `${login.currentStreak}日` : '-'}</strong>
        </div>
        <div className="stat-card">
          <span>正答率</span>
          <strong>{totals.total > 0 ? `${getAccuracy(totals.correct, totals.total)}%` : '-'}</strong>
        </div>
      </div>

      <div className="week-strip" role="img" aria-label={`直近7日で${studyDaysThisWeek}日学習`}>
        {week.map((day) => (
          <div
            key={day.date}
            className={`week-day${day.questions > 0 ? ' week-day-on' : ''}${day.date === today ? ' week-day-today' : ''}`}
            title={`${day.date}：${day.questions}問`}
          >
            <span className="week-day-label">{day.weekday}</span>
            <span className="week-day-count">{day.questions > 0 ? <>{day.questions}<small>問</small></> : '・'}</span>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="child-recent">
          <p className="eyebrow">最近のクイズ</p>
          <ul>
            {recent.map((record) => (
              <li key={record.quizId}>
                <span>{quizzes.find((quiz) => quiz.id === record.quizId)?.title ?? 'クイズ'}</span>
                <span className="tag">{getAccuracy(record.correct, record.total)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link to={`/children/${encodeURIComponent(username)}`} className="button secondary">
        くわしい分析を見る
      </Link>
    </article>
  );
}

function ChildrenOverview() {
  const { user } = useAuth();
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [snapshots, setSnapshots] = useState<ChildSnapshot[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const info = await fetchFamilyInfo();
      const linked = info.role === 'PARENT' ? info.children : [];
      const [quizData, childData] = await Promise.all([
        fetchQuizzes(),
        Promise.all(linked.map((child) => loadSnapshot(child.username))),
      ]);
      setChildren(linked);
      setQuizzes(quizData);
      setSnapshots(childData);
    } catch {
      setErrorMessage('子供の学習記録を読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (user?.role !== 'PARENT') {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="page-stack">
      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">見守り</p>
            <h2>子供の学習の様子</h2>
            <p>連携している子供が、今日やこの1週間でどれくらい学習したかを確認できます。</p>
          </div>
          <button className="button secondary" type="button" onClick={load} disabled={isLoading}>
            {isLoading ? '読み込み中...' : '更新'}
          </button>
        </div>
        {errorMessage && <p className="feedback-error" role="alert">{errorMessage}</p>}
      </div>

      {isLoading && snapshots.length === 0 ? (
        <div className="panel"><p>読み込み中...</p></div>
      ) : children.length === 0 && !errorMessage ? (
        <div className="panel">
          <h3>まだ子供と連携していません</h3>
          <p>家族設定で招待コードを発行し、子供のアカウントで入力してもらうと、ここに学習の様子が表示されます。</p>
          <Link to="/family" className="button">家族設定を開く</Link>
        </div>
      ) : (
        snapshots.map((snapshot) => (
          <ChildCard key={snapshot.username} snapshot={snapshot} quizzes={quizzes} />
        ))
      )}
    </section>
  );
}

/** `/children/:username` — 1人の子供のくわしい分析。分析ページをその子のデータで表示する。 */
export function ChildAnalytics() {
  const { user } = useAuth();
  const { username } = useParams();
  if (user?.role !== 'PARENT' || !username) {
    return <Navigate to="/" replace />;
  }
  return <Analytics child={username} />;
}

export default ChildrenOverview;
