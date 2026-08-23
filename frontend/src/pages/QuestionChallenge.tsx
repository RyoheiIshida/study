import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchQuizById, saveProgress } from '../api/quiz';
import { fetchXpSummary } from '../api/xp';
import { fetchPointsSummary } from '../api/points';
import { fetchTrophySummary } from '../api/trophies';
import { AnswerLogEntry, GameState, PointsSummary, ProgressRecord, Quiz, TrophySummary, XpSummary } from '../types';
import ScoreCard from '../components/ScoreCard';
import TimerDisplay from '../components/TimerDisplay';
import LinearGraph from '../components/LinearGraph';
import { normalizeReading } from '../utils/reading';
import { pickSessionQuestions } from '../utils/shuffle';

const QUESTION_SECONDS = 30;

function getAnswerValue(option: string): string {
  const label = option.match(/^([A-D]):\s*/)?.[1];
  return label ?? option;
}

const initialState: GameState = {
  currentQuestionIndex: 0,
  correctCount: 0,
  streak: 0,
  score: 0,
  finished: false,
  message: '準備ができたら始めましょう。',
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
  const [textAnswer, setTextAnswer] = useState('');
  const [xpBefore, setXpBefore] = useState<XpSummary | null>(null);
  const [xpAfter, setXpAfter] = useState<XpSummary | null>(null);
  const [pointsBefore, setPointsBefore] = useState<PointsSummary | null>(null);
  const [pointsAfter, setPointsAfter] = useState<PointsSummary | null>(null);
  const [trophiesBefore, setTrophiesBefore] = useState<TrophySummary | null>(null);
  const [trophiesAfter, setTrophiesAfter] = useState<TrophySummary | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [answerLog, setAnswerLog] = useState<AnswerLogEntry[]>([]);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  const isTextInput = quiz?.subject === 'Japanese';
  const isKanjiWriting = Boolean(quiz?.id.startsWith('kanji-writing'));

  useEffect(() => {
    if (!quizId) return;
    fetchQuizById(quizId).then((result) => {
      if (!result) {
        navigate('/');
      } else {
        setQuiz({ ...result, questions: pickSessionQuestions(result.questions) });
      }
    });
    fetchXpSummary().then(setXpBefore).catch(() => setXpBefore(null));
    fetchPointsSummary().then(setPointsBefore).catch(() => setPointsBefore(null));
    fetchTrophySummary().then(setTrophiesBefore).catch(() => setTrophiesBefore(null));
  }, [quizId, navigate, retryKey]);

  function retryChallenge() {
    setState(initialState);
    setFeedback('');
    setLastExplanation('');
    setSecondsLeft(QUESTION_SECONDS);
    setSaveStatus('idle');
    setTextAnswer('');
    setXpAfter(null);
    setPointsAfter(null);
    setTrophiesAfter(null);
    setQuiz(null);
    setRetryKey((key) => key + 1);
    setAnswerLog([]);
    setAwaitingNext(false);
    setLastAnswerCorrect(false);
  }

  const currentQuestion = useMemo(() => quiz?.questions[state.currentQuestionIndex], [quiz, state.currentQuestionIndex]);
  const isGraphQuestion = quiz?.subject === 'Math' && Boolean(currentQuestion?.graphOptions?.length);
  const isSolving = Boolean(currentQuestion && !state.finished);

  useEffect(() => {
    document.body.classList.toggle('solving-mode', isSolving);
    return () => document.body.classList.remove('solving-mode');
  }, [isSolving]);

  const answerOptions = useMemo(() => {
    if (!currentQuestion || isTextInput) return [];
    if (currentQuestion.options && currentQuestion.options.length >= 4) {
      return currentQuestion.options;
    }

    const answerNumber = Number(currentQuestion.answer);
    const base = new Set<string>([currentQuestion.answer]);
    if (Number.isFinite(answerNumber)) {
      let offset = 1;
      while (base.size < 4) {
        for (const candidate of [answerNumber - offset, answerNumber + offset]) {
          if (base.size >= 4) break;
          if (candidate >= 0) {
            base.add(String(candidate));
          }
        }
        offset += 1;
      }
    } else {
      let counter = 1;
      while (base.size < 4) {
        base.add(`選択肢${counter}`);
        counter += 1;
      }
    }
    return Array.from(base).sort((a, b) => a.localeCompare(b));
  }, [currentQuestion, isTextInput]);

  function submitAnswer(option: string, timedOut = false) {
    if (!quiz || !currentQuestion || state.finished || awaitingNext) return;
    const correct = !timedOut && normalizeReading(getAnswerValue(option)) === normalizeReading(currentQuestion.answer);

    setState((prev) => {
      const streak = correct ? prev.streak + 1 : 0;
      const score = prev.score + (correct ? 100 + streak * 20 + secondsLeft : 0);
      const message = correct ? '正解です。この調子で続けましょう。' : `正解: ${currentQuestion.answer}`;
      return {
        currentQuestionIndex: prev.currentQuestionIndex,
        correctCount: prev.correctCount + (correct ? 1 : 0),
        streak,
        score,
        finished: false,
        message,
      };
    });

    setLastAnswerCorrect(correct);
    setAwaitingNext(true);
    setFeedback(correct ? '正解' : timedOut ? `時間切れです。正解: ${currentQuestion.answer}` : `不正解です。正解: ${currentQuestion.answer}`);
    setLastExplanation(currentQuestion.explanation ?? '');
    setSecondsLeft(QUESTION_SECONDS);
    setTextAnswer('');
    setAnswerLog((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        userAnswer: timedOut ? '(未回答)' : option,
        correctAnswer: currentQuestion.answer,
        isCorrect: correct,
        timedOut,
        explanation: currentQuestion.explanation,
      },
    ]);
  }

  function advanceAfterAnswer() {
    if (!quiz || !awaitingNext) return;
    const isLastQuestion = state.currentQuestionIndex + 1 >= quiz.questions.length;
    setAwaitingNext(false);
    setFeedback('');
    setLastExplanation('');
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      finished: isLastQuestion,
    }));
  }

  useEffect(() => {
    if (state.finished || awaitingNext || !currentQuestion) return;
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
  }, [awaitingNext, currentQuestion, state.finished]);

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
        const summary = await fetchXpSummary();
        setXpAfter(summary);
        const pointsSummary = await fetchPointsSummary();
        setPointsAfter(pointsSummary);
        if (record.correct === record.total) {
          const trophySummary = await fetchTrophySummary();
          setTrophiesAfter(trophySummary);
        }
        setSaveStatus('saved');
      } catch {
        setSaveStatus('failed');
      }
    }

    persistProgress();
  }, [quiz, saveStatus, state.correctCount, state.finished, state.streak]);

  if (!quiz) {
    return <p>クイズを読み込み中...</p>;
  }

  return (
    <section className="challenge-page">
      <div className="panel challenge-panel">
        {awaitingNext && (
          <button type="button" className="answer-result-overlay" onClick={advanceAfterAnswer} aria-label="次の問題へ進む">
            <span className={lastAnswerCorrect ? 'answer-result-mark correct' : 'answer-result-mark incorrect'}>
              {lastAnswerCorrect ? '○' : '×'}
            </span>
            <span className="answer-result-hint">もう一度クリックまたはタップすると次の問題へ</span>
          </button>
        )}
        {!isSolving && (
          <div className="challenge-header">
            <div>
              <p className="eyebrow">チャレンジ</p>
              <h2>{quiz.title}</h2>
              <p>{quiz.description}</p>
            </div>
            <div className="challenge-aside">
              <ScoreCard score={state.score} streak={state.streak} correctCount={state.correctCount} total={quiz.questions.length} />
              {!state.finished && <TimerDisplay secondsLeft={secondsLeft} totalSeconds={QUESTION_SECONDS} />}
            </div>
          </div>
        )}

        {state.finished ? (
          <div className="result-card">
            <p className="eyebrow">完了</p>
            <h3>{quiz.questions.length}問中{state.correctCount}問正解</h3>
            <p>{state.message}</p>
            <p>最終スコア: {state.score}</p>
            {saveStatus === 'saving' && <p>進捗を保存中...</p>}
            {saveStatus === 'saved' && (
              <>
                <p className="feedback">進捗を保存しました。</p>
                {xpAfter && (
                  <div className="level-result">
                    <p className="eyebrow">経験値</p>
                    <p>
                      獲得XP: +{Math.max(xpAfter.totalXp - (xpBefore?.totalXp ?? xpAfter.totalXp), 0)}
                      {' '}・ 現在 Lv.{xpAfter.level}（累計{xpAfter.totalXp}XP）
                    </p>
                    {xpBefore && xpAfter.level > xpBefore.level && (
                      <p className="feedback">🎉 レベルアップ！ Lv.{xpAfter.level} になりました。</p>
                    )}
                  </div>
                )}
                {pointsAfter && (
                  <div className="points-result">
                    <p className="eyebrow">ポイント</p>
                    <p>
                      獲得ポイント: +{Math.max(pointsAfter.totalPoints - (pointsBefore?.totalPoints ?? pointsAfter.totalPoints), 0)}pt
                      {' '}・ 累計{pointsAfter.totalPoints}pt
                    </p>
                  </div>
                )}
                {state.correctCount === quiz.questions.length && (
                  <div className="trophy-result">
                    {(() => {
                      const isNewTrophy = trophiesAfter && !trophiesBefore?.trophies.some((t) => t.quizId === quiz.id);
                      return (
                        <p className="feedback">
                          🏆 {isNewTrophy ? '新しいトロフィーを獲得しました！' : '全問正解トロフィー獲得！'}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
            {saveStatus === 'failed' && <p className="feedback">進捗を保存できませんでした。API接続を確認してください。</p>}
            <div className="answer-review">
              <p className="eyebrow">復習</p>
              <ul className="answer-review-list">
                {answerLog.map((entry, index) => (
                  <li key={entry.questionId + index} className={entry.isCorrect ? 'answer-review-item correct' : 'answer-review-item incorrect'}>
                    <p className="answer-review-question">問題 {index + 1}: {entry.questionText}</p>
                    <p>あなたの回答: {entry.userAnswer || '(未回答)'} {entry.isCorrect ? '◯' : '✕'}</p>
                    {!entry.isCorrect && <p>正しい回答: {entry.correctAnswer}</p>}
                    {entry.explanation && <p className="answer-review-explanation">{entry.explanation}</p>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="challenge-actions centered">
              <button className="button" onClick={() => navigate('/progress')} disabled={saveStatus === 'saving'}>
                進捗を見る
              </button>
              <button className="button secondary" onClick={retryChallenge}>
                もう一度挑戦
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="challenge-form solving">
            <div className="question-card">
              <p className="eyebrow">問題 {state.currentQuestionIndex + 1} / {quiz.questions.length}</p>
              <h3>{currentQuestion.text}</h3>
            </div>
            <div className="answer-scroll-area">
              {isTextInput ? (
                <form
                  className="answer-text-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitAnswer(textAnswer);
                  }}
                >
                  <input
                    type="text"
                    className="answer-text-input"
                    value={textAnswer}
                    onChange={(event) => setTextAnswer(event.target.value)}
                    placeholder={isKanjiWriting ? '漢字で入力' : 'ひらがなで入力'}
                    autoFocus
                  />
                  <button type="submit" className="button">回答する</button>
                </form>
              ) : isGraphQuestion && currentQuestion?.graphOptions ? (
                <div className="graph-answer-buttons" role="group" aria-label="グラフの選択肢">
                  {currentQuestion.graphOptions.map((option) => (
                    <button key={option.id} type="button" className="graph-option-button" onClick={() => submitAnswer(option.id)}>
                      <span className="graph-option-label">{option.id}</span>
                      <LinearGraph option={option} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="answer-buttons">
                  {answerOptions.map((option) => (
                    <button key={option} type="button" className="option-button" onClick={() => submitAnswer(option)}>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default QuestionChallenge;
