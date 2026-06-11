import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuizStore } from '../hooks/useQuizStore';
import { Grade, Subject } from '../types';

const subjectOptions: Subject[] = ['算数', '数学', '英語'];
const gradeOptions: Grade[] = ['小学校', '中学校'];

function QuizList() {
  const { quizzes, isLoading, refreshQuizzes } = useQuizStore();
  const [selectedSubject, setSelectedSubject] = useState<Subject>('算数');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('小学校');

  useEffect(() => {
    refreshQuizzes(selectedSubject, selectedGrade);
  }, [refreshQuizzes, selectedSubject, selectedGrade]);

  return (
    <section>
      <div className="panel filter-panel">
        <h2>問題のテーマ</h2>
        <div className="filters">
          <label>
            科目
            <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value as Subject)}>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </label>
          <label>
            学年
            <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value as Grade)}>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </label>
          <Link to="/progress" className="button secondary">進捗を確認</Link>
        </div>
      </div>

      <div className="panel">
        <h2>クイズ一覧</h2>
        {isLoading ? (
          <p>ロード中...</p>
        ) : quizzes.length === 0 ? (
          <p>この条件のクイズはまだありません。</p>
        ) : (
          <div className="grid-list">
            {quizzes.map((quiz) => (
              <article key={quiz.id} className="card">
                <div className="card-header">
                  <span className="tag">{quiz.subject}</span>
                  <span className="tag">{quiz.grade}</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <div className="card-actions">
                  <Link to={`/challenge/${quiz.id}`} className="button">挑戦する</Link>
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
