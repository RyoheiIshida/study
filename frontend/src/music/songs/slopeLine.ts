import { Song } from '../types';

/**
 * 「スロープライン」 — Fメジャー / BPM 104 / まっすぐ伸びるシンセポップ。
 *
 * 一次関数の音ゲー用に書いた曲。主旋律は「1小節ごとに傾きが変わる直線」でできている。
 * 1拍あたり音階を +1 ずつ上げる小節、+2 ずつ上げる小節、-2 ずつ下げる小節、
 * まったく動かない小節（傾き0）を並べてあり、曲を聴いているだけで
 * 「傾きが大きい＝急に上がる」「傾きが負＝下がる」が耳から入るようにしてある。
 *
 * BPM 104 は 1拍 ≈ 0.58秒。むずかしい（4拍／問）でも2.3秒あり、
 * グラフを4つ見比べる時間として最低限を確保できる速さにした。
 * コード進行は F - Dm - Bb - C を2周。
 */

/** F メジャーの音階（MIDI番号）。旋律はこの配列の添字を等差で動かして作る。 */
const F_MAJOR = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81, 82, 84];

/**
 * 直線そのものの旋律を作る。`degree = slope * n + intercept` の音を1拍ずつ並べる。
 * 一次関数の式がそのまま旋律になるので、譜面の裏づけがコメントなしでも読める。
 */
function line(startBeat: number, intercept: number, slope: number, count: number, dur = 1) {
  return Array.from({ length: count }, (_, n) => ({
    beat: startBeat + n * dur,
    midi: F_MAJOR[intercept + slope * n],
    dur,
  }));
}

export const slopeLine: Song = {
  id: 'slope-line',
  title: 'スロープライン',
  mood: 'まっすぐ伸びるシンセポップ',
  bpm: 104,
  beatsPerBar: 4,
  loopBars: 8,
  chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'],
  lead: [
    // 1小節目 (F) — 傾き +1。1拍ごとに音階を1つずつ上がる、ゆるやかな上り坂。
    ...line(0, 0, 1, 4),
    // 2小節目 (Dm) — 上りきって折り返す。
    { beat: 4, midi: 72, dur: 1.5 },
    { beat: 5.5, midi: 74, dur: 0.5 },
    { beat: 6, midi: 72, dur: 2 },
    // 3小節目 (Bb) — 傾き +2。同じ1拍で倍上がるので、1小節目より急に聞こえる。
    ...line(8, 3, 2, 4),
    // 4小節目 (C) — 傾き -2。今度は下り坂。
    ...line(12, 8, -2, 3),
    { beat: 14, midi: 72, dur: 2 },
    // 5小節目 (F) — 1オクターブ上で、8分刻みの傾き +1。
    ...line(16, 7, 1, 4, 0.5),
    { beat: 18, midi: 84, dur: 2 },
    // 6小節目 (Dm) — 傾き -1 でゆるやかに戻る。
    ...line(20, 9, -1, 2),
    { beat: 22, midi: 77, dur: 2 },
    // 7小節目 (Bb) — 傾き 0。動かない＝水平な直線。
    { beat: 24, midi: 77, dur: 0.5 },
    { beat: 24.5, midi: 77, dur: 0.5 },
    { beat: 25, midi: 77, dur: 0.5 },
    { beat: 25.5, midi: 77, dur: 0.5 },
    { beat: 26, midi: 77, dur: 2 },
    // 8小節目 (C) — 傾き -2 で切片まで下りて、1小節目の頭につなぐ。
    ...line(28, 8, -2, 2),
    { beat: 30, midi: 72, dur: 2 },
  ],
  bass: [
    // ルートは F - D - Bb - C。表拍を踏み、3拍目だけ5度に上げて動きを出す。
    ...[41, 38, 34, 36, 41, 38, 34, 36].flatMap((root, bar) => [
      { beat: bar * 4, midi: root, dur: 0.9, vel: 0.9 },
      { beat: bar * 4 + 1, midi: root, dur: 0.45, vel: 0.6 },
      { beat: bar * 4 + 2, midi: root + 7, dur: 0.9, vel: 0.8 },
      { beat: bar * 4 + 3, midi: root, dur: 0.45, vel: 0.6 },
      { beat: bar * 4 + 3.5, midi: root + 12, dur: 0.4, vel: 0.5 },
    ]),
  ],
  drums: {
    kick: [
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x.x.',
    ],
    snare: [
      '....x.......x...',
      '....x.......x...',
      '....x.......x...',
      '....x.......x.xx',
    ],
    hat: ['xoxoxoxoxoxoxoxo'],
  },
  // F メジャーペンタトニック F4 から。
  comboScale: [65, 67, 69, 72, 74, 77, 79, 81, 84, 86],
};
