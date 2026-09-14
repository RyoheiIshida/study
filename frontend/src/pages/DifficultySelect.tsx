import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchProgress, fetchQuizzes } from '../api/quiz';
import { fetchSessionLengths } from '../api/sessionLength';
import { ProgressRecord, Quiz, SessionLength } from '../types';
import { QuizGroupMember, findGroupById } from '../utils/quizGroups';
import { MAX_SESSION_QUESTIONS } from '../utils/shuffle';
import { isRhythmEligible } from '../music/chart';
import { playPath } from '../utils/playMode';
import { usePlayMode } from '../hooks/usePlayMode';
import PlayModeToggle from '../components/PlayModeToggle';
import RewardBadge from '../components/RewardBadge';

interface LevelEntry {
  member: QuizGroupMember;
  quiz: Quiz;
  progress?: ProgressRecord;
  /** 前回のプレイで全問正解したか。進捗は最新の1回だけが保存されている。 */
  isCleared: boolean;
}

function choiceCount(quiz: Quiz): number | undefined {
  const first = quiz.questions[0];
  return first?.graphOptions?.length ?? first?.options?.length;
}

function DifficultySelect() {
  const { groupId } = useParams();
  const group = groupId ? findGroupById(groupId) : undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [sessionLengths, setSessionLengths] = useState<Record<string, SessionLength>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [playMode, setPlayMode] = usePlayMode();

  useEffect(() => {
    Promise.all([fetchQuizzes(), fetchProgress(), fetchSessionLengths()]).then(([quizData, progressData, lengthData]) => {
      setQuizzes(quizData);
      setProgress(progressData);
      setSessionLengths(lengthData);
      setIsLoading(false);
    });
  }, []);

  if (!group) {
    return <Navigate to="/" replace />;
  }

  const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const progressByQuizId = new Map(progress.map((record) => [record.quizId, record]));
  const levels: LevelEntry[] = group.members
    .flatMap((member) => {
      const quiz = quizById.get(member.quizId);
      if (!quiz) return [];
      const record = progressByQuizId.get(quiz.id);
      const isCleared = Boolean(record && record.total > 0 && record.correct >= record.total);
      return [{ member, quiz, progress: record, isCleared }];
    })
    .sort((a, b) => a.member.order - b.member.order);

  // 選んだタブは URL に残す。問題を解いて「戻る」で帰ってきても同じタブが開く。
  const requestedTrack = searchParams.get('track');
  const activeTrack = group.tracks.find((track) => track.id === requestedTrack) ?? group.tracks[0];
  const trackLevels = levels.filter((level) => level.member.track === activeTrack.id);
  const nextQuizId = trackLevels.find((level) => !level.isCleared)?.quiz.id;

  function selectTrack(trackId: string) {
    setSearchParams({ track: trackId }, { replace: true });
  }

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
        <div className="track-tabs" role="tablist" aria-label="練習する内容">
          {group.tracks.map((track) => {
            const inTrack = levels.filter((level) => level.member.track === track.id);
            const cleared = inTrack.filter((level) => level.isCleared).length;
            const isActive = track.id === activeTrack.id;
            return (
              <button
                key={track.id}
                type="button"
                role="tab"
                id={`track-tab-${track.id}`}
                aria-selected={isActive}
                aria-controls="track-panel"
                className="track-tab"
                onClick={() => selectTrack(track.id)}
              >
                {track.title}
                {!isLoading && <small>{cleared}/{inTrack.length} クリア</small>}
              </button>
            );
          })}
        </div>

        <div id="track-panel" role="tabpanel" aria-labelledby={`track-tab-${activeTrack.id}`}>
          <p className="hint track-description">{activeTrack.description}</p>
          <PlayModeToggle mode={playMode} onChange={setPlayMode} />
          {isLoading ? (
            <p>読み込み中...</p>
          ) : trackLevels.length === 0 ? (
            <p>この問題セットはまだありません。</p>
          ) : (
            <ol className="level-list">
              {trackLevels.map(({ member, quiz, progress: record, isCleared }, index) => {
                const choices = choiceCount(quiz);
                const isNext = quiz.id === nextQuizId;
                // 同じ段階を続けて解いて上達すると、問題数が伸びる（backend/src/lib/sessionLength.ts）。
                const length = sessionLengths[quiz.id];
                const questionCount = length?.questionCount ?? Math.min(quiz.questions.length, MAX_SESSION_QUESTIONS);
                return (
                  <li
                    key={quiz.id}
                    className={`level-row${isCleared ? ' is-cleared' : ''}${isNext ? ' is-next' : ''}`}
                  >
                    <span className="level-step" aria-hidden="true">{isCleared ? '✓' : index + 1}</span>
                    <div>
                      <span className="level-name">{member.name}</span>
                      <span className="level-meta">
                        {quiz.reward && <RewardBadge reward={quiz.reward} />}
                        {choices && <span>{choices}択</span>}
                        <span>{questionCount}問</span>
                        {length && length.stage > 0 && <span>長さ {length.stage + 1}/{length.stageCount}</span>}
                        {record && <span>前回 {record.correct}/{record.total}</span>}
                        {isNext && <span className="tag">次はここ</span>}
                        {playMode === 'rhythm' && !isRhythmEligible(quiz) && <span>通常モードのみ</span>}
                      </span>
                    </div>
                    <div className="level-actions">
                      <Link to={playPath(quiz, playMode)} className="button">開始</Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

export default DifficultySelect;
