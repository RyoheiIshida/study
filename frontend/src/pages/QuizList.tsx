import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuizStore } from '../hooks/useQuizStore';
import { Subject } from '../types';
import { subjectLabel, gradeLabel } from '../utils/labels';
import DailyQuestPanel from '../components/DailyQuestPanel';

const subjectOptions: Array<Subject | 'All'> = ['All', 'Arithmetic', 'Math', 'English', 'Japanese'];

function QuizList() {
  const { quizzes, isLoading, refreshQuizzes } = useQuizStore();
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');

  useEffect(() => {
    refreshQuizzes(selectedSubject === 'All' ? undefined : selectedSubject);
  }, [refreshQuizzes, selectedSubject]);

  return (
    <section className="page-stack">
      <DailyQuestPanel />
      <div className="panel filter-panel">
        <div>
          <p className="eyebrow">クイズ一覧</p>
          <h2>取り組む問題セットを選ぶ</h2>
        </div>
        <div className="filters">
          <label>
            科目
            <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value as Subject | 'All')}>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject === 'All' ? 'すべて' : subjectLabel(subject)}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">受講可能</p>
            <h2>クイズ</h2>
          </div>
          <Link to="/progress" className="text-link">進捗ログ</Link>
        </div>
        {isLoading ? (
          <p>クイズを読み込み中...</p>
        ) : quizzes.length === 0 ? (
          <p>この条件に一致するクイズはまだありません。</p>
        ) : (
          <div className="grid-list">
            {quizzes.map((quiz) => (
              <article key={quiz.id} className="card quiz-card">
                <div className="card-header">
                  <span className="tag">{subjectLabel(quiz.subject)}</span>
                  <span className="tag muted">{gradeLabel(quiz.grade)}</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <p className="hint">問題数 {quiz.questions.length}問</p>
                <div className="card-actions">
                  <Link to={`/challenge/${quiz.id}`} className="button">開始</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default QuizList;
