import { SessionLength } from '../types';

interface Props {
  /** このプレイで出した問題数。結果画面では、これと保存後の問題数を比べて伸びたかを出す。 */
  before?: SessionLength | null;
  /** 次のプレイの問題数。 */
  length: SessionLength | null | undefined;
  /** 音ゲーモードでは問題数といっしょに曲も長くなるので、そのことも伝える。 */
  rhythm?: boolean;
}

/**
 * 同じクイズを続けて解くと問題数（音ゲーモードでは曲の長さ）が伸びることを伝える。
 * どこまで遊べば次の段階に進むかも出して、くり返し解く目当てにする。
 */
function SessionLengthNote({ before, length, rhythm = false }: Props) {
  if (!length || length.stageCount <= 1) return null;

  const grew = before && length.questionCount > before.questionCount;
  const stageText = `長さ ${length.stage + 1}/${length.stageCount}`;
  const requiredPercent = Math.round(length.requiredAccuracy * 100);

  let goal: string;
  if (length.nextQuestionCount === null) {
    goal = 'いちばん長い段階です。';
  } else if (length.recentPlays < length.requiredPlays) {
    goal = `あと${length.requiredPlays - length.recentPlays}回遊んで、正答率が${requiredPercent}%以上なら ${length.nextQuestionCount}問にのびます。`;
  } else {
    const recentPercent = Math.round((length.recentAccuracy ?? 0) * 100);
    goal = `直近${length.requiredPlays}回の正答率は${recentPercent}%。${requiredPercent}%以上になると ${length.nextQuestionCount}問にのびます。`;
  }

  return (
    <div className="level-result">
      <p className="eyebrow">問題数</p>
      {grew && (
        <p className="feedback">
          🎉 この問題に慣れてきたので、次から {length.questionCount}問になります{rhythm ? '（曲も長くなります）' : ''}。
        </p>
      )}
      <p className="hint">
        {stageText}（{length.questionCount}問） ・ {goal}
      </p>
    </div>
  );
}

export default SessionLengthNote;
