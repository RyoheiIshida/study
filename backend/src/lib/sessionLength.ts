/**
 * 1回のプレイで出す問題数（音ゲーモードでは曲の長さ）を、そのクイズの上達に合わせて伸ばす。
 *
 * 最初は問題数の上限（15問）までで遊ぶ。同じクイズを何度も解いて正答率が安定してきたら、
 * 1段階ずつ ×2、×3、×4 と長くする。問題の数が足りないクイズ（2択の4問など）は同じ問題を
 * くり返して出すので、覚えた2本を見分けるだけでなく、長く続けて集中することが練習になる。
 * 以前あった「ロング」の段階は、これに置きかえて無くした。
 *
 * 段階は保存せず、毎回プレイ履歴（QuizAttempt）から数え直す。一度伸びた長さは、あとで
 * 正答率が下がっても短くは戻さない。
 * frontend/src/utils/shuffle.ts の MAX_SESSION_QUESTIONS（通信できないときの問題数）と上限をそろえてある。
 */

/** 最初の段階で出す問題数の上限。 */
export const BASE_SESSION_QUESTIONS = 15;

/** どれだけ伸びても、1回のプレイはこの問題数まで。 */
export const MAX_EXTENDED_QUESTIONS = 30;

/** 最初の段階の問題数に掛ける倍率。 */
const LENGTH_MULTIPLIERS = [1, 2, 3, 4];

/** 次の段階へ進むのに必要なプレイ回数。今の長さ以上で遊んだ直近の回だけを数える。 */
export const PROMOTION_PLAYS = 5;

/** 直近 PROMOTION_PLAYS 回をまとめた正答率がこれ以上なら、次の段階へ進む。 */
export const PROMOTION_ACCURACY = 0.8;

export interface SessionLength {
  /** 次のプレイで出す問題数。 */
  questionCount: number;
  /** 今の段階（0 始まり）。 */
  stage: number;
  /** 段階の数。stage が stageCount - 1 なら、もう伸びない。 */
  stageCount: number;
  /** 次の段階の問題数。いちばん長い段階では null。 */
  nextQuestionCount: number | null;
  /** 今の段階で数えているプレイ回数（最大 PROMOTION_PLAYS）。 */
  recentPlays: number;
  requiredPlays: number;
  /** 今の段階で数えているプレイの正答率。まだ1回も遊んでいなければ null。 */
  recentAccuracy: number | null;
  requiredAccuracy: number;
}

interface AttemptLike {
  total: number;
  correct: number;
}

export function sessionLengthSteps(quizQuestionCount: number): number[] {
  const base = Math.min(quizQuestionCount, BASE_SESSION_QUESTIONS);
  if (base <= 0) return [0];
  const steps = LENGTH_MULTIPLIERS.map((multiplier) => Math.min(base * multiplier, MAX_EXTENDED_QUESTIONS));
  // 上限で頭打ちになった段階は同じ長さになるので1つにまとめる（15問のクイズは 15 → 30 の2段階）。
  // 最初の段階は上限より長くてもそのまま残す。
  return steps.filter((count, index) => index === 0 || count > steps[index - 1]);
}

/** attempts はそのユーザーのそのクイズのプレイを、古い順に並べたもの。 */
export function computeSessionLength(quizQuestionCount: number, attempts: AttemptLike[]): SessionLength {
  const steps = sessionLengthSteps(quizQuestionCount);
  let stage = 0;
  let window: AttemptLike[] = [];

  for (const attempt of attempts) {
    if (stage >= steps.length - 1) break;
    // 伸びる前の短いプレイは、今の段階の練習としては数えない。
    if (attempt.total < steps[stage]) continue;
    window = [...window, attempt].slice(-PROMOTION_PLAYS);
    if (window.length === PROMOTION_PLAYS && accuracyOf(window)! >= PROMOTION_ACCURACY) {
      stage += 1;
      window = [];
    }
  }

  return {
    questionCount: steps[stage],
    stage,
    stageCount: steps.length,
    nextQuestionCount: steps[stage + 1] ?? null,
    recentPlays: window.length,
    requiredPlays: PROMOTION_PLAYS,
    recentAccuracy: accuracyOf(window),
    requiredAccuracy: PROMOTION_ACCURACY,
  };
}

function accuracyOf(attempts: AttemptLike[]): number | null {
  const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  if (total === 0) return null;
  return attempts.reduce((sum, attempt) => sum + attempt.correct, 0) / total;
}
