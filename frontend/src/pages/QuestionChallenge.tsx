import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchQuizById, saveProgress } from '../api/quiz';
import { GameState, ProgressRecord, Quiz } from '../types';
import ScoreCard from '../components/ScoreCard';

const initialState: GameState = {
  currentQuestionIndex: 0,
  correctCount: 0,
  streak: 0,
  score: 0,
  finished: false,
  message: '準備ができたらスタート！',
};

function QuestionChallenge() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [state, setState] = useState<GameState>(initialState);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!quizId) return;
    fetchQuizById(quizId).then((result) => {
      if (!result) {
        navigate('/');
      } else {
        setQuiz(result);
      }
    });
  }, [quizId, navigate]);

  const currentQuestion = useMemo(() => quiz?.questions[state.currentQuestionIndex], [quiz, state.currentQuestionIndex]);

  const answerOptions = useMemo(() => {
    if (!currentQuestion) return [];
    if (currentQuestion.options && currentQuestion.options.length >= 4) {
      return currentQuestion.options;
    }
    const base = new Set<string>([currentQuestion.answer]);
    const candidates = currentQuestion.answer.match(/\d+/g)?.map(Number) ?? [];
    while (base.size < 4) {
      const value = candidates.length > 0 ? (candidates[0] + Math.floor(Math.random() * 5) - 2) : Math.floor(Math.random() * 12) + 1;
      base.add(String(value));
    }
    return Array.from(base).sort(() => Math.random() - 0.5);
  }, [currentQuestion]);

  const handleAnswer = (option: string) => {
    if (!quiz || !currentQuestion) return;
    const correct = option.trim() === currentQuestion.answer.trim();

    setState((prev) => {
      const streak = correct ? prev.streak + 1 : 0;
      const score = prev.score + (correct ? 100 + streak * 20 : 0);
      const nextIndex = prev.currentQuestionIndex + 1;
      const finished = nextIndex >= quiz.questions.length;
      const message = correct ? '正解！コンボ継続中！' : `ちょっとちがうね。答えは ${currentQuestion.answer}`;
      return {
        currentQuestionIndex: nextIndex,
        correctCount: prev.correctCount + (correct ? 1 : 0),
        streak,
        score,
        finished,
        message,
      };
    });
    setFeedback(correct ? '正解！' : `不正解。答えは ${currentQuestion.answer}`);
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    if (!quiz || !state.finished) return;

    const record: ProgressRecord = {
      quizId: quiz.id,
      completed: quiz.questions.length,
      total: quiz.questions.length,
      correct: state.correctCount,
      streak: state.streak,
      lastPlayed: new Date().toISOString(),
    };

    async function persistProgress() {
      setSaveStatus('saving');
      try {
        await saveProgress(record);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('failed');
      }
    }

    persistProgress();
  }, [quiz, state.finished, state.correctCount, state.streak]);

  if (!quiz) {
    return <p>問題を読み込み中です...</p>;
  }

  return (
    <section>
      <div className="panel challenge-panel">
        <div className="challenge-header">
          <div>
            <h2>{quiz.title}</h2>
            <p>{quiz.description}</p>
          </div>
          <ScoreCard score={state.score} streak={state.streak} correctCount={state.correctCount} total={quiz.questions.length} />
        </div>

        {state.finished ? (
          <div className="result-card">
            <h3>チャレンジ完了！</h3>
            <p>{state.message}</p>
            <p>正解数: {state.correctCount} / {quiz.questions.length}</p>
            <p>最終スコア: {state.score}</p>
            {saveStatus === 'saving' && <p>進捗を保存中です...</p>}
            {saveStatus === 'saved' && <p className="feedback">進捗を保存しました！</p>}
            {saveStatus === 'failed' && <p className="feedback">進捗の保存に失敗しました。ネットワークを確認してください。</p>}
            <button className="button" onClick={() => navigate('/progress')} disabled={saveStatus === 'saving'}>
              進捗を見る
            </button>
            <button className="button secondary" onClick={() => window.location.reload()}>
              再挑戦
            </button>
          </div>
        ) : currentQuestion ? (
          <div className="challenge-form">
            <div className="question-card">
              <h3>問題 {state.currentQuestionIndex + 1}</h3>
              <p>{currentQuestion.text}</p>
            </div>
            <div className="answer-buttons">
              {answerOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="button option-button"
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="challenge-actions">
              <button type="button" className="button secondary" onClick={() => navigate('/')}>一覧へ戻る</button>
            </div>
            {feedback && <p className="feedback">{feedback}</p>}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default QuestionChallenge;
