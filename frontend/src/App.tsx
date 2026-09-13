import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import QuizList from './pages/QuizList';
import DifficultySelect from './pages/DifficultySelect';
import QuestionChallenge from './pages/QuestionChallenge';
import RhythmChallenge from './pages/RhythmChallenge';
import Progress from './pages/Progress';
import Login from './pages/Login';
import Register from './pages/Register';
import Analytics from './pages/Analytics';
import UserProfile from './pages/UserProfile';
import FamilySettings from './pages/FamilySettings';
import PurchaseRequests from './pages/PurchaseRequests';
import { RequireAuth, useAuth } from './context/AuthContext';
import { fetchXpSummary } from './api/xp';
import { fetchPointsSummary } from './api/points';
import { PointsSummary, XpSummary } from './types';
import LevelBadge from './components/LevelBadge';
import PointsBadge from './components/PointsBadge';

const NAV_ITEMS = [
  { to: '/', icon: '📝', label: 'クイズ' },
  { to: '/progress', icon: '📈', label: '進捗' },
  { to: '/analytics', icon: '📊', label: '分析' },
  { to: '/profile', icon: '👤', label: 'プロフィール' },
  { to: '/purchase-requests', icon: '💰', label: 'おこづかい' },
];

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [xpSummary, setXpSummary] = useState<XpSummary | null>(null);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);

  // SPA ではページを移動してもスクロール位置が残り、一覧の下の方で「開始」を押すと
  // 次の画面も下までスクロールされた状態で開いてしまう。リンクで移動したときは先頭に戻す。
  // 「戻る」（POP）ではブラウザが元の位置を復元するので触らない。
  // クエリだけの変更（難易度選択のタブ切り替えなど）ではスクロールさせないよう pathname だけを見る。
  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setXpSummary(null);
      setPointsSummary(null);
      return;
    }
    let cancelled = false;
    fetchXpSummary()
      .then((summary) => {
        if (!cancelled) setXpSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setXpSummary(null);
      });
    fetchPointsSummary()
      .then((summary) => {
        if (!cancelled) setPointsSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setPointsSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  return (
    <div className={user ? 'app-shell has-bottom-nav' : 'app-shell'}>
      <header className="top-bar">
        <div className="brand-block">
          <Link to="/" className="brand-mark">クイズゲーム</Link>
          <p>進捗管理と復習をスムーズに行える、短時間クイズセッション。</p>
        </div>
        {/* スマホ幅では CSS で画面下部の固定タブバーに切り替わる。 */}
        {user && (
          <nav className="nav-links" aria-label="メインナビゲーション">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to}>
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
        <div className="auth-actions">
          {user ? (
            <>
              <div className="status-chips">
                <LevelBadge summary={xpSummary} />
                <PointsBadge summary={pointsSummary} />
              </div>
              <div className="account-actions">
                <span className="user-chip">{user.username}</span>
                <button className="button secondary" type="button" onClick={logout}>
                  ログアウト
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="account-actions">
                <Link to="/login" className="button secondary">ログイン</Link>
                <Link to="/register" className="button">新規登録</Link>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RequireAuth><QuizList /></RequireAuth>} />
          <Route path="/group/:groupId" element={<RequireAuth><DifficultySelect /></RequireAuth>} />
          <Route path="/challenge/:quizId" element={<RequireAuth><QuestionChallenge /></RequireAuth>} />
          <Route path="/rhythm/:quizId" element={<RequireAuth><RhythmChallenge /></RequireAuth>} />
          <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
          <Route path="/family" element={<RequireAuth><FamilySettings /></RequireAuth>} />
          <Route path="/purchase-requests" element={<RequireAuth><PurchaseRequests /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
