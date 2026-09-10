/**
 * タイミング判定とスコア計算。
 *
 * 重要な方針: **正誤とタイミングは切り離す。**
 * 「どのレーンを叩いたか」だけが正誤（isCorrect）を決め、タイミングの良し悪しはスコアと
 * 演出にしか効かない。こうしておくと、音ゲーモードで稼げるXP・ポイント・トロフィー・
 * 日次クエストの意味が通常モードとそろい、サーバー側の集計に手を入れずに済む。
 * ノーツを叩けなかった問題だけが miss かつ不正解になる（通常モードの時間切れと同じ扱い）。
 */

export type JudgeKind = 'perfect' | 'great' | 'good' | 'miss';

/** 判定ラインからのズレの許容幅（ミリ秒、絶対値）。 */
export const JUDGE_WINDOWS_MS: Record<Exclude<JudgeKind, 'miss'>, number> = {
  perfect: 60,
  great: 120,
  good: 200,
};

export const JUDGE_LABEL: Record<JudgeKind, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  miss: 'MISS',
};

export function judgeTiming(deltaMs: number): JudgeKind {
  const abs = Math.abs(deltaMs);
  if (abs <= JUDGE_WINDOWS_MS.perfect) return 'perfect';
  if (abs <= JUDGE_WINDOWS_MS.great) return 'great';
  if (abs <= JUDGE_WINDOWS_MS.good) return 'good';
  return 'miss';
}

const BASE_SCORE: Record<JudgeKind, number> = {
  perfect: 200,
  great: 150,
  good: 100,
  miss: 0,
};

const MAX_COMBO_BONUS_STEPS = 10;

/**
 * 1問ぶんのスコア。不正解なら 0。
 * 通常モードの `100 + streak * 20 + secondsLeft` と同じくらいの桁になるよう調整してある。
 */
export function noteScore(kind: JudgeKind, correct: boolean, combo: number): number {
  if (!correct) return 0;
  const comboBonus = Math.min(combo, MAX_COMBO_BONUS_STEPS) * 10;
  return BASE_SCORE[kind] + comboBonus;
}

export interface JudgeCounts {
  perfect: number;
  great: number;
  good: number;
  miss: number;
}

export function emptyJudgeCounts(): JudgeCounts {
  return { perfect: 0, great: 0, good: 0, miss: 0 };
}
