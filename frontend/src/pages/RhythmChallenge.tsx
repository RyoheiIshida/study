import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchQuizById, saveProgress } from '../api/quiz';
import { fetchXpSummary } from '../api/xp';
import { fetchPointsSummary } from '../api/points';
import { fetchTrophySummary } from '../api/trophies';
import { saveAnswerSpeedRecords } from '../api/answerSpeed';
import { AnswerSpeedRecord, PointsSummary, ProgressRecord, Quiz, TrophySummary, XpSummary } from '../types';
import { pickSessionQuestions } from '../utils/shuffle';
import { getDifficultyLabel, getSessionQuestionLimit } from '../utils/quizGroups';
import { LaneChoice, buildLaneChoices } from '../utils/answerOptions';
import { normalizeReading } from '../utils/reading';
import NoteHighway, { LANE_COLORS } from '../components/NoteHighway';
import LinearGraph from '../components/LinearGraph';
import { AudioEngine } from '../music/engine';
import {
  DIFFICULTY_TIERS,
  DifficultyTier,
  TIER_LABEL,
  buildChart,
  defaultTierForQuiz,
  isGraphQuiz,
  isRhythmEligible,
  questionIndexAtBeat,
  songForQuiz,
} from '../music/chart';
import { songs } from '../music/songs';
import {
  JUDGE_LABEL,
  JUDGE_WINDOWS_MS,
  JudgeCounts,
  JudgeKind,
  emptyJudgeCounts,
  judgeTiming,
  noteScore,
} from '../music/judge';
import { LANE_KEYS, LANES, Lane } from '../music/types';
import { RhythmSettings, loadSettings, medianOffsetMs, saveSettings } from '../music/settings';

type Phase = 'loading' | 'ready' | 'playing' | 'finished';

/** レーンボタン1つぶん。2択の問題では2レーンをまとめて1つの広いボタンにする。 */
interface LaneGroup {
  /** このボタンが受け持つレーン。叩かれたときは先頭のレーンとして判定する。 */
  lanes: Lane[];
  choice: LaneChoice | undefined;
}

/**
 * 同じ選択肢が続くレーンをひとまとめにする。
 * 2択の問題は [A, A, B, B] の形で渡ってくるので、A と B の2つの広いボタンになる。
 */
function groupLanes(choices: LaneChoice[]): LaneGroup[] {
  const groups: LaneGroup[] = [];
  for (const lane of LANES) {
    const choice = choices[lane];
    const last = groups[groups.length - 1];
    if (last && choice && last.choice && last.choice.value === choice.value) {
      last.lanes.push(lane);
    } else {
      groups.push({ lanes: [lane], choice });
    }
  }
  return groups;
}

interface QuestionResult {
  index: number;
  lane: Lane | null;
  kind: JudgeKind;
  correct: boolean;
  /** 問題が出てから叩くまで。通常モードの回答時間と同じ意味で記録する。 */
  elapsedMs: number;
}

const CALIBRATION_BPM = 100;
const CALIBRATION_BEATS = 17;
const MIN_CALIBRATION_SAMPLES = 4;

function RhythmChallenge() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const engineRef = useRef<AudioEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new AudioEngine();
  }
  const engine = engineRef.current;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [tier, setTier] = useState<DifficultyTier>('normal');
  /** プレイヤーが選んだ曲の id。null なら難易度から決まる既定の曲を鳴らす。 */
  const [songId, setSongId] = useState<string | null>(null);
  const [settings, setSettings] = useState<RhythmSettings>(() => loadSettings());

  const [activeIndex, setActiveIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [judgeCounts, setJudgeCounts] = useState<JudgeCounts>(emptyJudgeCounts);
  const [lastJudge, setLastJudge] = useState<{ kind: JudgeKind; correct: boolean; at: number } | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [xpBefore, setXpBefore] = useState<XpSummary | null>(null);
  const [xpAfter, setXpAfter] = useState<XpSummary | null>(null);
  const [pointsBefore, setPointsBefore] = useState<PointsSummary | null>(null);
  const [pointsAfter, setPointsAfter] = useState<PointsSummary | null>(null);
  const [trophiesBefore, setTrophiesBefore] = useState<TrophySummary | null>(null);

  const [calibrating, setCalibrating] = useState(false);
  const [calibrationTaps, setCalibrationTaps] = useState(0);
  const [calibrationMessage, setCalibrationMessage] = useState('');

  const judgedRef = useRef<Set<number>>(new Set());
  const laneFlashRef = useRef<number[]>([-1, -1, -1, -1]);
  const resultsRef = useRef<QuestionResult[]>([]);
  const comboRef = useRef(0);
  const sessionStartRef = useRef<number | null>(null);
  const calibrationSamplesRef = useRef<number[]>([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;
    fetchQuizById(quizId).then((result) => {
      if (cancelled) return;
      if (!result) {
        navigate('/');
        return;
      }
      setQuiz({ ...result, questions: pickSessionQuestions(result.questions, getSessionQuestionLimit(result.id)) });
      setTier(defaultTierForQuiz(result));
      // クイズが変われば既定の曲も変わる。前のクイズで選んだ曲は持ち越さない。
      setSongId(null);
      setPhase('ready');
    });
    fetchXpSummary().then(setXpBefore).catch(() => setXpBefore(null));
    fetchPointsSummary().then(setPointsBefore).catch(() => setPointsBefore(null));
    fetchTrophySummary().then(setTrophiesBefore).catch(() => setTrophiesBefore(null));
    return () => {
      cancelled = true;
    };
  }, [quizId, navigate]);

  // ページを離れるときは AudioContext ごと破棄する。放置すると音が鳴り続ける。
  useEffect(() => () => engine.dispose(), [engine]);

  useEffect(() => {
    document.body.classList.toggle('solving-mode', phase === 'playing');
    return () => document.body.classList.remove('solving-mode');
  }, [phase]);

  const song = useMemo(() => songForQuiz(songId), [songId]);
  const eligible = quiz ? isRhythmEligible(quiz) : true;
  const chart = useMemo(
    () => (quiz && eligible ? buildChart(quiz.questions.length, song, tier) : null),
    [quiz, eligible, song, tier],
  );

  /** レーンに並べる選択肢。1プレイのあいだ固定にしたいので問題ごとに一度だけ作る。 */
  // isRhythmEligible がすべての問題で4つに落とせることを確認済みなので、ここで null にはならない。
  const laneChoices = useMemo<LaneChoice[][]>(
    () => (quiz ? quiz.questions.map((question) => buildLaneChoices(question) ?? []) : []),
    [quiz],
  );

  const registerAnswer = useCallback(
    (index: number, lane: Lane | null, kind: JudgeKind, correct: boolean, elapsedMs: number) => {
      if (judgedRef.current.has(index)) return;
      judgedRef.current.add(index);

      const nextCombo = correct ? comboRef.current + 1 : 0;
      comboRef.current = nextCombo;
      resultsRef.current.push({ index, lane, kind, correct, elapsedMs });

      setCombo(nextCombo);
      setBestCombo((prev) => Math.max(prev, nextCombo));
      setScore((prev) => prev + noteScore(kind, correct, nextCombo));
      setCorrectCount((prev) => prev + (correct ? 1 : 0));
      setJudgeCounts((prev) => ({ ...prev, [kind]: prev[kind] + 1 }));
      setLastJudge({ kind, correct, at: performance.now() });
      engine.playSe(kind, nextCombo);
    },
    [engine],
  );

  const handleLaneHit = useCallback(
    (lane: Lane) => {
      if (phase !== 'playing' || !chart || !quiz) return;
      const time = engine.currentTime();
      const beat = engine.beatAt(time);
      laneFlashRef.current[lane] = time;

      const index = questionIndexAtBeat(chart, beat);
      if (index < 0 || judgedRef.current.has(index)) return;
      const choice = laneChoices[index]?.[lane];
      if (choice === undefined) return;

      const deltaMs = (beat - chart.answerBeats[index]) * engine.msPerBeat;
      const elapsedMs = Math.max((beat - chart.questionStartBeats[index]) * engine.msPerBeat, 0);
      // 叩いたレーンだけが正誤を決める。タイミングはスコアと演出にしか効かない。
      const correct = normalizeReading(choice.value) === normalizeReading(quiz.questions[index].answer);
      registerAnswer(index, lane, judgeTiming(deltaMs), correct, elapsedMs);
    },
    [phase, chart, quiz, laneChoices, engine, registerAnswer],
  );

  // 進行の監視。表示中の問題の切り替えと、叩けなかった問題の取りこぼし判定を行う。
  useEffect(() => {
    if (phase !== 'playing' || !chart) return;
    let frame = 0;
    const graceBeats = JUDGE_WINDOWS_MS.good / engine.msPerBeat;

    const loop = () => {
      frame = window.requestAnimationFrame(loop);
      // 演奏が止まっている間の拍位置には意味がない。読んでしまうと見逃し判定が暴発する。
      if (!engine.isRunning) return;
      const beat = engine.currentBeat();
      const index = questionIndexAtBeat(chart, beat);
      if (index >= 0 && sessionStartRef.current === null) {
        // カウントインは学習時間に含めない。最初の問題が出た瞬間から計る。
        sessionStartRef.current = Date.now();
      }
      setActiveIndex((prev) => (prev === index ? prev : index));

      for (let i = 0; i < chart.answerBeats.length; i++) {
        if (judgedRef.current.has(i)) continue;
        if (beat > chart.answerBeats[i] + graceBeats) {
          registerAnswer(i, null, 'miss', false, chart.beatsPerQuestion * engine.msPerBeat);
        }
      }
    };

    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [phase, chart, engine, registerAnswer]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const lane = LANE_KEYS.indexOf(event.key.toLowerCase());
      if (lane < 0) return;
      event.preventDefault();
      handleLaneHit(lane as Lane);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handleLaneHit]);

  async function startPlay() {
    if (!chart || !quiz) return;
    judgedRef.current = new Set();
    resultsRef.current = [];
    comboRef.current = 0;
    laneFlashRef.current = [-1, -1, -1, -1];
    sessionStartRef.current = null;
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setCorrectCount(0);
    setJudgeCounts(emptyJudgeCounts());
    setLastJudge(null);
    setActiveIndex(-1);
    setSaveStatus('idle');
    setXpAfter(null);
    setPointsAfter(null);

    engine.setVolume(settings.volume);
    engine.setOffsetMs(settings.offsetMs);
    // autoplay policy のため、この呼び出しは必ずクリック／タップのハンドラから始まること。
    // また、演奏が始まる前に 'playing' にすると、進行監視のループが前回のプレイの
    // startTime を基準に拍を読んでしまい、全問いきなり見逃し扱いになる。必ず開始後に切り替える。
    await engine.start(song, chart.totalBeats, () => setPhase('finished'));
    setPhase('playing');
  }

  function quitPlay() {
    if (!window.confirm('音ゲーモードを中止しますか？途中経過は保存されません。')) return;
    engine.stop();
    navigate('/');
  }

  function backToReady() {
    engine.stop();
    setPhase('ready');
    setSaveStatus('idle');
  }

  // 更新関数を受け取る形にしているのは、キャリブレーション完了のコールバックが
  // 10秒ほど前の settings を掴んだままになり、その間の音量変更を巻き戻してしまうため。
  const updateSettings = useCallback(
    (update: (previous: RhythmSettings) => RhythmSettings) => {
      const next = update(settingsRef.current);
      settingsRef.current = next;
      setSettings(next);
      saveSettings(next);
      engine.setVolume(next.volume);
      engine.setOffsetMs(next.offsetMs);
    },
    [engine],
  );

  const handleCalibrationTap = useCallback(() => {
    const beat = engine.rawBeatAt(engine.currentTime());
    // 最初の1拍は「これから始まる」の合図なので数えない。
    if (beat < 0.5) return;
    const deltaMs = (beat - Math.round(beat)) * engine.msPerBeat;
    if (Math.abs(deltaMs) > 250) return;
    calibrationSamplesRef.current.push(deltaMs);
    setCalibrationTaps(calibrationSamplesRef.current.length);
  }, [engine]);

  useEffect(() => {
    if (!calibrating) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key !== ' ' && LANE_KEYS.indexOf(event.key.toLowerCase()) < 0) return;
      event.preventDefault();
      handleCalibrationTap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [calibrating, handleCalibrationTap]);

  async function startCalibration() {
    calibrationSamplesRef.current = [];
    setCalibrationTaps(0);
    setCalibrationMessage('');
    setCalibrating(true);
    engine.setVolume(settings.volume);
    await engine.startMetronome(CALIBRATION_BPM, CALIBRATION_BEATS, () => {
      const samples = calibrationSamplesRef.current;
      setCalibrating(false);
      if (samples.length < MIN_CALIBRATION_SAMPLES) {
        setCalibrationMessage('うまく測れませんでした。クリック音に合わせて、もう一度試してください。');
        return;
      }
      const offsetMs = medianOffsetMs(samples);
      updateSettings((previous) => ({ ...previous, offsetMs }));
      setCalibrationMessage(`判定オフセットを ${offsetMs}ms に設定しました（${samples.length}回の平均的なズレ）。`);
    });
  }

  useEffect(() => {
    if (!quiz || phase !== 'finished' || saveStatus !== 'idle') return;

    const record: ProgressRecord = {
      quizId: quiz.id,
      completed: quiz.questions.length,
      total: quiz.questions.length,
      correct: correctCount,
      streak: bestCombo,
      durationMs: sessionStartRef.current === null ? undefined : Date.now() - sessionStartRef.current,
      lastPlayed: new Date().toISOString(),
    };

    async function persistProgress() {
      if (!quiz) return;
      setSaveStatus('saving');
      try {
        await saveProgress(record);
        setXpAfter(await fetchXpSummary());
        setPointsAfter(await fetchPointsSummary());
        setSaveStatus('saved');
      } catch {
        setSaveStatus('failed');
      }

      const speedRecords: AnswerSpeedRecord[] = resultsRef.current
        .filter((result) => result.lane !== null)
        .map((result) => ({
          quizId: record.quizId,
          questionId: quiz.questions[result.index].id,
          // 持ち時間の意味が通常モードと違うので、分析のトレンドが混ざらないよう別ラベルにする。
          difficulty: `${getDifficultyLabel(quiz.id)}（音ゲー）`,
          isCorrect: result.correct,
          elapsedMs: result.elapsedMs,
          answeredAt: record.lastPlayed,
        }));
      saveAnswerSpeedRecords(speedRecords).catch(() => {
        // 速度の履歴は補助的な分析データなので、失敗してもリザルト画面は止めない。
      });
    }

    persistProgress();
  }, [quiz, phase, saveStatus, correctCount, bestCombo]);

  if (phase === 'loading' || !quiz) {
    return <p>クイズを読み込み中...</p>;
  }

  if (!eligible || !chart) {
    return (
      <section className="panel">
        <p className="eyebrow">音ゲーモード</p>
        <h2>{quiz.title}</h2>
        <p>
          このクイズは記述式のため、4つのレーンに割り当てられません。通常モードで挑戦してください。
        </p>
        <div className="card-actions">
          <Link to={`/challenge/${quiz.id}`} className="button">通常モードで開始</Link>
          <Link to="/" className="button secondary">クイズ一覧に戻る</Link>
        </div>
      </section>
    );
  }

  const activeQuestion = activeIndex >= 0 ? quiz.questions[activeIndex] : null;
  const activeChoices: LaneChoice[] = activeIndex >= 0 ? laneChoices[activeIndex] : [];
  // グラフ問題ではレーンにグラフを描く。ボタンの高さも中身も変わるので、
  // 曲の途中で切り替わらないようクイズ単位で決める。
  const graphMode = isGraphQuiz(quiz);
  const laneGroups = groupLanes(activeChoices);
  // 1問の持ち時間は「拍数 ÷ BPM」で決まる。拍だけ出しても速さが伝わらないので秒も添える。
  const secondsPerQuestion = ((chart.beatsPerQuestion * 60) / song.bpm).toFixed(1);
  // 見比べるグラフの枚数。2択のクイズでは1つの選択肢が2レーンに広がるので、レーン数とは違う。
  const choiceCount = new Set((laneChoices[0] ?? []).map((choice) => choice.value)).size;
  const totalJudged = judgeCounts.perfect + judgeCounts.great + judgeCounts.good + judgeCounts.miss;

  if (phase === 'playing') {
    return (
      <section className="challenge-page rhythm-page">
        <div className="panel challenge-panel rhythm-panel">
          <div className="rhythm-hud">
            <span className="rhythm-hud-item">
              {activeIndex >= 0 ? `問題 ${activeIndex + 1} / ${quiz.questions.length}` : 'まもなくスタート'}
            </span>
            <span className="rhythm-hud-item">SCORE {score}</span>
            <span className="rhythm-hud-item">{combo >= 2 ? `${combo} COMBO` : ''}</span>
            <button type="button" className="button secondary rhythm-quit" onClick={quitPlay}>
              中止
            </button>
          </div>

          <div className="rhythm-question">
            {activeQuestion ? (
              <h3>{activeQuestion.text}</h3>
            ) : (
              <h3 className="rhythm-countin">♪ {song.title}</h3>
            )}
            {lastJudge && (
              <p
                key={lastJudge.at}
                className={`rhythm-judge ${lastJudge.kind} ${lastJudge.correct ? 'correct' : 'incorrect'}`}
              >
                {JUDGE_LABEL[lastJudge.kind]}
                <span className="rhythm-judge-mark">{lastJudge.correct ? '○' : '×'}</span>
              </p>
            )}
          </div>

          <NoteHighway
            chart={chart}
            engine={engine}
            active
            judgedRef={judgedRef}
            laneFlashRef={laneFlashRef}
          />

          <div
            className={graphMode ? 'rhythm-lanes graph' : 'rhythm-lanes'}
            role="group"
            aria-label="選択肢のレーン"
          >
            {laneGroups.map(({ lanes, choice }) => {
              const lane = lanes[0];
              return (
                <button
                  key={lane}
                  type="button"
                  className="rhythm-lane-button"
                  style={{ borderColor: LANE_COLORS[lane], gridColumn: `span ${lanes.length}` }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    handleLaneHit(lane);
                  }}
                >
                  <span className="rhythm-lane-key">
                    {lanes.map((item) => LANE_KEYS[item].toUpperCase()).join(' / ')}
                  </span>
                  {choice?.graph ? (
                    <span className="rhythm-lane-graph">
                      <LinearGraph option={choice.graph} size="lane" />
                      <span className="rhythm-lane-graph-label">{choice.label}</span>
                    </span>
                  ) : (
                    <span className="rhythm-lane-option">{choice?.label ?? '—'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'finished') {
    const newTrophy = correctCount === quiz.questions.length && !trophiesBefore?.trophies.some((t) => t.quizId === quiz.id);
    return (
      <section className="page-stack">
        <div className="panel result-card">
          <p className="eyebrow">音ゲーモード完了</p>
          <h3>{quiz.questions.length}問中{correctCount}問正解</h3>
          <p>最終スコア: {score} ・ 最大コンボ: {bestCombo}</p>

          <div className="rhythm-judge-summary">
            {(['perfect', 'great', 'good', 'miss'] as JudgeKind[]).map((kind) => (
              <div key={kind} className={`rhythm-judge-tally ${kind}`}>
                <span className="rhythm-judge-tally-label">{JUDGE_LABEL[kind]}</span>
                <span className="rhythm-judge-tally-count">{judgeCounts[kind]}</span>
              </div>
            ))}
          </div>
          {totalJudged > 0 && (
            <p className="hint">
              ジャスト率 {Math.round(((judgeCounts.perfect + judgeCounts.great) / totalJudged) * 100)}%
            </p>
          )}

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
              {correctCount === quiz.questions.length && (
                <p className="feedback">🏆 {newTrophy ? '新しいトロフィーを獲得しました！' : '全問正解トロフィー獲得！'}</p>
              )}
            </>
          )}
          {saveStatus === 'failed' && <p className="feedback">進捗を保存できませんでした。API接続を確認してください。</p>}

          <div className="answer-review">
            <p className="eyebrow">復習</p>
            <ul className="answer-review-list">
              {[...resultsRef.current].sort((a, b) => a.index - b.index).map((result) => {
                const question = quiz.questions[result.index];
                const choices = laneChoices[result.index];
                const chosen = result.lane === null ? null : choices[result.lane];
                const answer = choices.find((choice) => choice.value === question.answer);
                return (
                  <li
                    key={question.id + result.index}
                    className={result.correct ? 'answer-review-item correct' : 'answer-review-item incorrect'}
                  >
                    <p className="answer-review-question">問題 {result.index + 1}: {question.text}</p>
                    <p>
                      あなたの回答: {chosen?.label ?? '(未回答)'} {result.correct ? '◯' : '✕'}
                      <span className="answer-review-time">（{JUDGE_LABEL[result.kind]}）</span>
                    </p>
                    {!result.correct && <p>正しい回答: {question.answer}</p>}
                    {/* グラフ問題は記号（A・B）だけ見ても何を選んだのか分からないので、
                        選んだグラフと正解のグラフを並べて描く。 */}
                    {graphMode && !result.correct && (
                      <div className="answer-review-graphs">
                        {chosen?.graph && (
                          <figure className="answer-review-graph">
                            <LinearGraph option={chosen.graph} size="small" />
                            <figcaption>あなたの回答 {chosen.label}</figcaption>
                          </figure>
                        )}
                        {answer?.graph && (
                          <figure className="answer-review-graph">
                            <LinearGraph option={answer.graph} size="small" />
                            <figcaption>正しい回答 {answer.label}</figcaption>
                          </figure>
                        )}
                      </div>
                    )}
                    {question.explanation && <p className="answer-review-explanation">{question.explanation}</p>}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="challenge-actions centered">
            <button className="button" onClick={() => navigate('/progress')} disabled={saveStatus === 'saving'}>
              進捗を見る
            </button>
            <button className="button secondary" onClick={backToReady}>
              もう一度挑戦
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="panel rhythm-start">
        <p className="eyebrow">音ゲーモード</p>
        <h2>{quiz.title}</h2>
        <p>{quiz.description}</p>

        <div className="rhythm-song-card">
          <p className="eyebrow">曲</p>
          <h3>♪ {song.title}</h3>
          <p className="hint">{song.mood} ・ BPM {song.bpm} ・ 全{quiz.questions.length}問 ・ 1問 約{secondsPerQuestion}秒</p>
        </div>

        {/* 選べる曲が1つしかないときは、ボタンが1つだけ並んでも意味がないので行ごと出さない。 */}
        {songs.length > 1 && (
          <div className="rhythm-setting-row">
            <p className="eyebrow">曲をえらぶ</p>
            <div className="rhythm-song-buttons" role="group" aria-label="曲">
              {songs.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={option.id === song.id ? 'button' : 'button secondary'}
                  onClick={() => setSongId(option.id)}
                >
                  {option.title}
                </button>
              ))}
            </div>
            <p className="hint">
              速い曲を選んでも、1問あたりの時間は大きく変わりません（今: 約{secondsPerQuestion}秒）。
            </p>
          </div>
        )}

        <div className="rhythm-howto">
          <p className="eyebrow">あそびかた</p>
          <ol>
            <li>
              問題が出ると、4つのレーンに選択肢が並びます。
              {graphMode && '一次関数ではレーンにグラフが並ぶので、式に合う1枚を探します。'}
            </li>
            <li>ノーツが判定ラインに重なる瞬間に、<strong>正解の選択肢のレーン</strong>を叩きます。</li>
            <li>キーボードは <kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd>、画面は下のボタンをタップ。</li>
            <li>正誤は「どのレーンを叩いたか」だけで決まります。タイミングはスコアとコンボに効きます。</li>
          </ol>
        </div>

        <div className="rhythm-setting-row">
          <p className="eyebrow">難易度</p>
          <div className="rhythm-tier-buttons" role="group" aria-label="難易度">
            {DIFFICULTY_TIERS.map((option) => (
              <button
                key={option}
                type="button"
                className={option === tier ? 'button' : 'button secondary'}
                onClick={() => setTier(option)}
              >
                {TIER_LABEL[option]}
              </button>
            ))}
          </div>
          <p className="hint">
            {graphMode
              ? `むずかしいほど1問あたりの拍が短くなります（${TIER_LABEL[tier]}: ${chart.beatsPerQuestion}拍／問 ＝ 約${secondsPerQuestion}秒）。グラフを${choiceCount}枚見くらべる時間を考えて選んでください。`
              : `むずかしいほど1問あたりの拍が短くなります（${TIER_LABEL[tier]}: ${chart.beatsPerQuestion}拍／問 ＝ 約${secondsPerQuestion}秒）。`}
          </p>
        </div>

        <div className="rhythm-setting-row">
          <label className="rhythm-volume">
            音量
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(event) =>
                updateSettings((previous) => ({ ...previous, volume: Number(event.target.value) / 100 }))
              }
            />
            <span>{Math.round(settings.volume * 100)}</span>
          </label>
          <label className="rhythm-volume">
            判定オフセット
            <input
              type="range"
              min={-200}
              max={200}
              step={5}
              value={settings.offsetMs}
              onChange={(event) =>
                updateSettings((previous) => ({ ...previous, offsetMs: Number(event.target.value) }))
              }
            />
            <span>{settings.offsetMs}ms</span>
          </label>
          <div className="card-actions">
            <button type="button" className="button secondary" onClick={startCalibration} disabled={calibrating}>
              {calibrating ? `クリックに合わせて叩く（${calibrationTaps}回）` : 'タイミングを測る'}
            </button>
            {calibrating && (
              <button
                type="button"
                className="button secondary"
                onPointerDown={(event) => {
                  event.preventDefault();
                  handleCalibrationTap();
                }}
              >
                ここを叩く
              </button>
            )}
          </div>
          {calibrationMessage && <p className="hint">{calibrationMessage}</p>}
          <p className="hint">
            音がズレて感じるときに使います。クリック音に合わせて <kbd>Space</kbd> か上のボタンを16回叩いてください。
          </p>
        </div>

        <div className="challenge-actions centered">
          <button type="button" className="button" onClick={startPlay} disabled={calibrating}>
            スタート
          </button>
          <Link to={`/challenge/${quiz.id}`} className="button secondary">通常モードで解く</Link>
        </div>
      </div>
    </section>
  );
}

export default RhythmChallenge;
