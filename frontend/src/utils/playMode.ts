import { Quiz } from '../types';
import { isRhythmEligible } from '../music/chart';

/**
 * プレイするときに選ぶモード。
 *
 * 以前は音ゲーモードをヘッダーの専用ページから辿っていたが、遊ぶ内容は同じクイズなので
 * 「どのクイズを解くか」を選んだあとに「どう解くか」を選ぶ形にまとめた。
 * 選んだモードは localStorage に残し、次にクイズを選ぶときも同じモードで始められるようにする。
 */
export type PlayMode = 'normal' | 'rhythm';

export const PLAY_MODES: PlayMode[] = ['normal', 'rhythm'];

export const PLAY_MODE_LABEL: Record<PlayMode, string> = {
  normal: '通常モード',
  rhythm: '♪ 音ゲーモード',
};

export const PLAY_MODE_HINT: Record<PlayMode, string> = {
  normal: '自分のペースで1問ずつ解きます。',
  rhythm: '曲に合わせて、正解の選択肢のレーンを叩きます。',
};

const STORAGE_KEY = 'study.playMode';

export function loadPlayMode(): PlayMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'rhythm' ? 'rhythm' : 'normal';
  } catch {
    return 'normal';
  }
}

export function savePlayMode(mode: PlayMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // プライベートモードなどで保存できなくても、そのセッション中は選択が効くので無視する。
  }
}

/**
 * クイズを始めるときの遷移先。
 * 音ゲーモードに対応していないクイズは通常モードで開く（入口を塞がない）。
 */
export function playPath(quiz: Quiz, mode: PlayMode): string {
  if (mode === 'rhythm' && isRhythmEligible(quiz)) return `/rhythm/${quiz.id}`;
  return `/challenge/${quiz.id}`;
}
