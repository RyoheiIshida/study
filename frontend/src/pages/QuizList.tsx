import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuizStore } from '../hooks/useQuizStore';
import { Grade, Subject } from '../types';

const subjectOptions: Subject[] = ['Arithmetic', 'Math', 'English'];
const gradeOptions: Grade[] = ['Elementary', 'Middle School'];

function QuizList() {
  const { quizzes, isLoading, refreshQuizzes } = useQuizStore();
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Arithmetic');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('Elementary');

  useEffect(() => {
    refreshQuizzes(selectedSubject, selectedGrade);
  }, [refreshQuizzes, selectedSubject, selectedGrade]);

  return (
    <section className="page-stack">
      <div className="panel filter-panel">
        <div>
          <p className="eyebrow">Quiz deck</p>
          <h2>Choose a focused practice set</h2>
        </div>
        <div className="filters">
          <label>
            Subject
            <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value as Subject)}>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </label>
          <label>
            Grade
            <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value as Grade)}>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </label>
          <Link to="/analytics" className="button secondary">View analytics</Link>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Available now</p>
            <h2>Quizzes</h2>
          </div>
          <Link to="/progress" className="text-link">Progress log</Link>
        </div>
        {isLoading ? (
          <p>Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <p>No quizzes match these filters yet.</p>
        ) : (
          <div className="grid-list">
            {quizzes.map((quiz) => (
              <article key={quiz.id} className="card quiz-card">
                <div className="card-header">
                  <span className="tag">{quiz.subject}</span>
                  <span className="tag muted">{quiz.grade}</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <p className="hint">{quiz.questions.length} questions</p>
                <div className="card-actions">
                  <Link to={`/challenge/${quiz.id}`} className="button">Start</Link>
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
