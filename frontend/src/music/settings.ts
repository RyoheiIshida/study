/**
 * 音ゲーモードの端末ごとの設定。
 *
 * 音の出力遅延は端末・ブラウザ・Bluetoothイヤホンの有無で大きく変わるため、判定オフセットは
 * 端末に紐づく値であってアカウントに紐づく値ではない。そのためサーバーではなく localStorage
 * に置く（サーバー側の変更を増やさずに済むという利点もある）。
 */

const STORAGE_KEY = 'rhythm-settings-v1';

export interface RhythmSettings {
  /** マスター音量 0..1。 */
  volume: number;
  /**
   * 判定オフセット（ミリ秒）。プレイヤーが平均して何ミリ秒遅れて叩くかを表す。
   * 正の値ほど、譜面と判定の両方を後ろへずらす。
   */
  offsetMs: number;
}

export const DEFAULT_SETTINGS: RhythmSettings = {
  volume: 0.7,
  offsetMs: 0,
};

export const MAX_OFFSET_MS = 300;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function loadSettings(): RhythmSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<RhythmSettings>;
    return {
      volume: typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
        ? clamp(parsed.volume, 0, 1)
        : DEFAULT_SETTINGS.volume,
      offsetMs: typeof parsed.offsetMs === 'number' && Number.isFinite(parsed.offsetMs)
        ? clamp(parsed.offsetMs, -MAX_OFFSET_MS, MAX_OFFSET_MS)
        : DEFAULT_SETTINGS.offsetMs,
    };
  } catch {
    // プライベートウィンドウなどで localStorage が読めない場合は既定値で動かす。
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: RhythmSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 保存できなくてもプレイ自体は続けられるので、失敗は握りつぶす。
  }
}

/** キャリブレーションで集めたズレの中央値を、そのままオフセットとして使えるように丸める。 */
export function medianOffsetMs(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  return clamp(Math.round(median), -MAX_OFFSET_MS, MAX_OFFSET_MS);
}
