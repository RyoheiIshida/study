import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchQuizById, saveProgress } from '../api/quiz';
import { GameState, ProgressRecord, Quiz } from '../types';
import ScoreCard from '../components/ScoreCard';
import TimerDisplay from '../components/TimerDisplay';

const QUESTION_SECONDS = 30;

const initialState: GameState = {
  currentQuestionIndex: 0,
  correctCount: 0,
  streak: 0,
  score: 0,
  finished: false,
  message: 'Ready when you are.',
};

function QuestionChallenge() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [state, setState] = useState<GameState>(initialState);
  const [feedback, setFeedback] = useState('');
  const [lastExplanation, setLastExplanation] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

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

    const answerNumber = Number(currentQuestion.answer);
    const base = new Set<string>([currentQuestion.answer]);
    while (base.size < 4) {
      if (Number.isFinite(answerNumber)) {
        base.add(String(Math.max(0, answerNumber + base.size - 2)));
      } else {
        base.add(`Option ${base.size + 1}`);
      }
    }
    return Array.from(base).sort((a, b) => a.localeCompare(b));
  }, [currentQuestion]);

  function submitAnswer(option: string, timedOut = false) {
    if (!quiz || !currentQuestion || state.finished) return;
    const correct = !timedOut && option.trim() === currentQuestion.answer.trim();

    setState((prev) => {
      const streak = correct ? prev.streak + 1 : 0;
      const score = prev.score + (correct ? 100 + streak * 20 + secondsLeft : 0);
      const nextIndex = prev.currentQuestionIndex + 1;
      const finished = nextIndex >= quiz.questions.length;
      const message = correct ? 'Correct. Keep the rhythm going.' : `Answer: ${currentQuestion.answer}`;
      return {
        currentQuestionIndex: nextIndex,
        correctCount: prev.correctCount + (correct ? 1 : 0),
        streak,
        score,
        finished,
        message,
      };
    });

    setFeedback(correct ? 'Correct' : timedOut ? `Time is up. Answer: ${currentQuestion.answer}` : `Not quite. Answer: ${currentQuestion.answer}`);
    setLastExplanation(currentQuestion.explanation ?? '');
    setSecondsLeft(QUESTION_SECONDS);
  }

  useEffect(() => {
    if (state.finished || !currentQuestion) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          submitAnswer('', true);
          return QUESTION_SECONDS;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentQuestion, state.finished]);

  useEffect(() => {
    if (!quiz || !state.finished || saveStatus !== 'idle') return;

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
  }, [quiz, saveStatus, state.correctCount, state.finished, state.streak]);

  if (!quiz) {
    return <p>Loading quiz...</p>;
  }

  return (
    <section>
      <div className="panel challenge-panel">
        <div className="challenge-header">
          <div>
            <p className="eyebrow">Challenge</p>
            <h2>{quiz.title}</h2>
            <p>{quiz.description}</p>
          </div>
          <div className="challenge-aside">
            <ScoreCard score={state.score} streak={state.streak} correctCount={state.correctCount} total={quiz.questions.length} />
            {!state.finished && <TimerDisplay secondsLeft={secondsLeft} totalSeconds={QUESTION_SECONDS} />}
          </div>
        </div>

        {state.finished ? (
          <div className="result-card">
            <p className="eyebrow">Complete</p>
            <h3>{state.correctCount} of {quiz.questions.length} correct</h3>
            <p>{state.message}</p>
            <p>Final score: {state.score}</p>
            {saveStatus === 'saving' && <p>Saving progress...</p>}
            {saveStatus === 'saved' && <p className="feedback">Progress saved.</p>}
            {saveStatus === 'failed' && <p className="feedback">Progress could not be saved. Check the API connection.</p>}
            <div className="challenge-actions centered">
              <button className="button" onClick={() => navigate('/progress')} disabled={saveStatus === 'saving'}>
                View progress
              </button>
              <button className="button secondary" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="challenge-form">
            <div className="question-card">
              <p className="eyebrow">Question {state.currentQuestionIndex + 1} of {quiz.questions.length}</p>
              <h3>{currentQuestion.text}</h3>
            </div>
            <div className="answer-buttons">
              {answerOptions.map((option) => (
                <button key={option} type="button" className="option-button" onClick={() => submitAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
            <div className="challenge-actions">
              <button type="button" className="button secondary" onClick={() => navigate('/')}>Back to quizzes</button>
            </div>
            {feedback && (
              <div className="feedback-panel">
                <p className="feedback">{feedback}</p>
                {lastExplanation && <p>{lastExplanation}</p>}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default QuestionChallenge;
