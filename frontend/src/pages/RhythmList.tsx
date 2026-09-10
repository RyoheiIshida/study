import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizzes } from '../api/quiz';
import { Quiz } from '../types';
import { gradeLabel, subjectLabel } from '../utils/labels';
import { TIER_LABEL, defaultTierForQuiz, isGraphQuiz, isRhythmEligible, songForQuiz } from '../music/chart';

/**
 * 音ゲーモードで遊べるクイズの一覧。
 *
 * クイズ一覧ページは科目フィルタで絞り込まれているため、音ゲー対応のクイズがそこに
 * 出てこないことがある。モード専用の入口をひとつ用意して、対応クイズを必ず辿れるようにする。
 */
function RhythmList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchQuizzes().then((result) => {
      if (cancelled) return;
      setQuizzes(result.filter(isRhythmEligible));
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="page-stack">
      <div className="panel filter-panel">
        <div>
          <p className="eyebrow">音ゲーモード</p>
          <h2>リズムに合わせて解く</h2>
          <p>
            落ちてくるノーツが判定ラインに重なる瞬間に、正解の選択肢のレーンを叩きます。
            正解・不正解は通常モードと同じように記録され、XPやポイントも同じように貯まります。
          </p>
        </div>
        <Link to="/" className="text-link">クイズ一覧に戻る</Link>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">対応クイズ</p>
            <h2>曲を選んで挑戦</h2>
          </div>
        </div>
        {isLoading ? (
          <p>読み込み中...</p>
        ) : quizzes.length === 0 ? (
          <p>音ゲーモードに対応したクイズがまだありません。</p>
        ) : (
          <div className="grid-list">
            {quizzes.map((quiz) => {
              const tier = defaultTierForQuiz(quiz);
              const song = songForQuiz(quiz, tier);
              return (
                <article key={quiz.id} className="card quiz-card">
                  <div className="card-header">
                    <span className="tag">{subjectLabel(quiz.subject)}</span>
                    <span className="tag muted">{gradeLabel(quiz.grade)}</span>
                  </div>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.description}</p>
                  <p className="hint">
                    ♪ {song.title}（BPM {song.bpm}・{TIER_LABEL[tier]}）・問題数 {quiz.questions.length}問
                    {isGraphQuiz(quiz) && ' ・レーンにグラフが並びます'}
                  </p>
                  <div className="card-actions">
                    <Link to={`/rhythm/${quiz.id}`} className="button">音ゲーで開始</Link>
                    <Link to={`/challenge/${quiz.id}`} className="button secondary">通常モード</Link>
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

export default RhythmList;
