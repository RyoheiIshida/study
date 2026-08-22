import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { fetchQuizzes } from '../api/quiz';
import { Quiz } from '../types';
import { findGroupById } from '../utils/quizGroups';

function DifficultySelect() {
  const { groupId } = useParams();
  const group = groupId ? findGroupById(groupId) : undefined;
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes().then((result) => {
      setQuizzes(result);
      setIsLoading(false);
    });
  }, []);

  if (!group) {
    return <Navigate to="/" replace />;
  }

  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const options = group.members
    .map((member) => ({ member, quiz: quizById.get(member.quizId) }))
    .filter((entry): entry is { member: typeof group.members[number]; quiz: Quiz } => Boolean(entry.quiz))
    .sort((a, b) => a.member.order - b.member.order);

  return (
    <section className="page-stack">
      <div className="panel filter-panel">
        <div>
          <p className="eyebrow">難易度を選択</p>
          <h2>{group.title}</h2>
          <p>{group.description}</p>
        </div>
        <Link to="/" className="text-link">クイズ一覧に戻る</Link>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">難易度</p>
            <h2>挑戦するレベルを選ぶ</h2>
          </div>
        </div>
        {isLoading ? (
          <p>読み込み中...</p>
        ) : options.length === 0 ? (
          <p>この問題セットはまだありません。</p>
        ) : (
          <div className="grid-list">
            {options.map(({ member, quiz }) => (
              <article key={quiz.id} className="card quiz-card">
                <div className="card-header">
                  <span className="tag">{member.difficultyLabel}</span>
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

export default DifficultySelect;
