import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import QuizList from './pages/QuizList';
import DifficultySelect from './pages/DifficultySelect';
import QuestionChallenge from './pages/QuestionChallenge';
import Progress from './pages/Progress';
import Login from './pages/Login';
import Register from './pages/Register';
import Analytics from './pages/Analytics';
import UserProfile from './pages/UserProfile';
import { RequireAuth, useAuth } from './context/AuthContext';
import { fetchXpSummary } from './api/xp';
import { fetchPointsSummary } from './api/points';
import { PointsSummary, XpSummary } from './types';
import LevelBadge from './components/LevelBadge';
import PointsBadge from './components/PointsBadge';

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [xpSummary, setXpSummary] = useState<XpSummary | null>(null);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);

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
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <Link to="/" className="brand-mark">スタディゲーム</Link>
          <p>進捗管理と復習をスムーズに行える、短時間クイズセッション。</p>
        </div>
        <nav className="nav-links" aria-label="メインナビゲーション">
          {user && (
            <>
              <NavLink to="/">クイズ</NavLink>
              <NavLink to="/progress">進捗</NavLink>
              <NavLink to="/analytics">分析</NavLink>
              <NavLink to="/profile">プロフィール</NavLink>
            </>
          )}
        </nav>
        <div className="auth-actions">
          {user ? (
            <>
              <LevelBadge summary={xpSummary} />
              <PointsBadge summary={pointsSummary} />
              <span className="user-chip">{user.username}</span>
              <button className="button secondary" type="button" onClick={logout}>
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="button secondary">ログイン</Link>
              <Link to="/register" className="button">新規登録</Link>
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
          <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
