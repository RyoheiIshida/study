import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import QuizList from './pages/QuizList';
import QuestionChallenge from './pages/QuestionChallenge';
import Progress from './pages/Progress';
import Login from './pages/Login';
import Register from './pages/Register';
import Analytics from './pages/Analytics';
import UserProfile from './pages/UserProfile';
import { RequireAuth, useAuth } from './context/AuthContext';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <Link to="/" className="brand-mark">Study Game</Link>
          <p>Short quiz sessions with progress tracking and clean review loops.</p>
        </div>
        <nav className="nav-links" aria-label="Primary navigation">
          {user && (
            <>
              <NavLink to="/">Quizzes</NavLink>
              <NavLink to="/progress">Progress</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </>
          )}
        </nav>
        <div className="auth-actions">
          {user ? (
            <>
              <span className="user-chip">{user.username}</span>
              <button className="button secondary" type="button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="button secondary">Log in</Link>
              <Link to="/register" className="button">Register</Link>
            </>
          )}
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RequireAuth><QuizList /></RequireAuth>} />
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
