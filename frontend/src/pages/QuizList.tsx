import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuizStore } from '../hooks/useQuizStore';
import { Quiz, Subject } from '../types';
import { subjectLabel, gradeLabel } from '../utils/labels';
import { findGroupByQuizId } from '../utils/quizGroups';
import { isRhythmEligible } from '../music/chart';
import { playPath } from '../utils/playMode';
import { usePlayMode } from '../hooks/usePlayMode';
import PlayModeToggle from '../components/PlayModeToggle';
import RewardBadge from '../components/RewardBadge';
import DailyQuestPanel from '../components/DailyQuestPanel';

interface QuizListEntry {
  key: string;
  subject: Subject;
  grade: Quiz['grade'];
  title: string;
  description: string;
  questionCount: number;
  /** 難易度グループなら、その id。段階の選択は個別ページに任せる。 */
  groupId: string | null;
  /** 単体クイズなら、ここから直接始められるクイズ本体。 */
  quiz: Quiz | null;
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
        groupId: null,
        quiz,
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
      groupId: group.id,
      quiz: null,
    });
  }

  return entries;
}

function QuizList() {
  const selectedSubject: Subject = 'Math';
  const { quizzes, isLoading } = useQuizStore(selectedSubject);
  const entries = useMemo(() => buildQuizListEntries(quizzes), [quizzes]);
  const [playMode, setPlayMode] = usePlayMode();

  return (
    <section className="page-stack">
      <DailyQuestPanel />
      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">受講可能</p>
            <h2>クイズ</h2>
          </div>
          <Link to="/progress" className="text-link">進捗ログ</Link>
        </div>
        <PlayModeToggle mode={playMode} onChange={setPlayMode} />
        {isLoading ? (
          <p>クイズを読み込み中...</p>
        ) : entries.length === 0 ? (
          <p>この条件に一致するクイズはまだありません。</p>
        ) : (
          <div className="grid-list">
            {entries.map((entry) => {
              const onlyNormal = playMode === 'rhythm' && entry.quiz !== null && !isRhythmEligible(entry.quiz);
              return (
                <article key={entry.key} className="card quiz-card">
                  <div className="card-header">
                    <span className="tag">{subjectLabel(entry.subject)}</span>
                    <span className="tag muted">{gradeLabel(entry.grade)}</span>
                  </div>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <p className="hint">問題数 {entry.questionCount}問</p>
                  {entry.quiz?.reward && <p><RewardBadge reward={entry.quiz.reward} /></p>}
                  {entry.groupId && <p className="hint">難しい段階ほど、1問あたりのXPとポイントが増えます。</p>}
                  {onlyNormal && <p className="hint">このクイズは音ゲーモードに対応していないため、通常モードで始まります。</p>}
                  <div className="card-actions">
                    <Link
                      to={entry.groupId ? `/group/${entry.groupId}` : playPath(entry.quiz!, playMode)}
                      className="button"
                    >
                      開始
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default QuizList;
