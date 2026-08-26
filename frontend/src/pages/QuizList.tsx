import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuizStore } from '../hooks/useQuizStore';
import { Quiz, Subject } from '../types';
import { subjectLabel, gradeLabel } from '../utils/labels';
import { findGroupByQuizId } from '../utils/quizGroups';
import DailyQuestPanel from '../components/DailyQuestPanel';

const subjectOptions: Subject[] = ['Math'];

interface QuizListEntry {
  key: string;
  subject: Subject;
  grade: Quiz['grade'];
  title: string;
  description: string;
  questionCount: number;
  linkTo: string;
}

function buildQuizListEntries(quizzes: Quiz[]): QuizListEntry[] {
  const entries: QuizListEntry[] = [];
  const seenGroupIds = new Set<string>();

  for (const quiz of quizzes) {
    const group = findGroupByQuizId(quiz.id);
    if (!group) {
      entries.push({
        key: quiz.id,
        subject: quiz.subject,
        grade: quiz.grade,
        title: quiz.title,
        description: quiz.description,
        questionCount: quiz.questions.length,
        linkTo: `/challenge/${quiz.id}`,
      });
      continue;
    }

    if (seenGroupIds.has(group.id)) continue;
    seenGroupIds.add(group.id);

    const memberQuizzes = quizzes.filter((item) => group.members.some((member) => member.quizId === item.id));
    entries.push({
      key: group.id,
      subject: group.subject,
      grade: group.grade,
      title: group.title,
      description: group.description,
      questionCount: memberQuizzes.reduce((total, item) => total + item.questions.length, 0),
      linkTo: `/group/${group.id}`,
    });
  }

  return entries;
}

function QuizList() {
  const { quizzes, isLoading, refreshQuizzes } = useQuizStore();
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Math');
  const entries = useMemo(() => buildQuizListEntries(quizzes), [quizzes]);

  useEffect(() => {
    refreshQuizzes(selectedSubject);
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
            <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value as Subject)}>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subjectLabel(subject)}</option>
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
        ) : entries.length === 0 ? (
          <p>この条件に一致するクイズはまだありません。</p>
        ) : (
          <div className="grid-list">
            {entries.map((entry) => (
              <article key={entry.key} className="card quiz-card">
                <div className="card-header">
                  <span className="tag">{subjectLabel(entry.subject)}</span>
                  <span className="tag muted">{gradeLabel(entry.grade)}</span>
                </div>
                <h3>{entry.title}</h3>
                <p>{entry.description}</p>
                <p className="hint">問題数 {entry.questionCount}問</p>
                <div className="card-actions">
                  <Link to={entry.linkTo} className="button">開始</Link>
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
