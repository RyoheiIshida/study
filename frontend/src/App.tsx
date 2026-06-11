import { Navigate, Route, Routes } from 'react-router-dom';
import QuizList from './pages/QuizList';
import QuestionChallenge from './pages/QuestionChallenge';
import Progress from './pages/Progress';

function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Study Game</h1>
          <p>小学校算数のクイズに挑戦しよう！将来は中学校数学・英語にも対応予定です。</p>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<QuizList />} />
          <Route path="/challenge/:quizId" element={<QuestionChallenge />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
