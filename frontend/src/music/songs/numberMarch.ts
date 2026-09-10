import { Song } from '../types';

/**
 * 「かけざんマーチ」 — Gメジャー / BPM 120 / 軽快なマーチ。
 *
 * 標準難易度の既定曲。BPM 120 は 1拍 = 0.5秒ちょうどで拍を取りやすく、
 * 譜面の6拍ウィンドウが約3秒になるので、読んで選ぶのにちょうどよい。
 * コード進行は G - Em - C - D を2周。
 */
export const numberMarch: Song = {
  id: 'number-march',
  title: 'かけざんマーチ',
  mood: '軽快に進むマーチ',
  bpm: 120,
  beatsPerBar: 4,
  loopBars: 8,
  chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D'],
  lead: [
    // 1小節目 (G) — 同音連打で行進のリズムを作る
    { beat: 0, midi: 74, dur: 0.5 },
    { beat: 0.5, midi: 74, dur: 0.5 },
    { beat: 1, midi: 79, dur: 1 },
    { beat: 2, midi: 71, dur: 1 },
    { beat: 3, midi: 74, dur: 1 },
    // 2小節目 (Em)
    { beat: 4, midi: 76, dur: 1 },
    { beat: 5, midi: 74, dur: 1 },
    { beat: 6, midi: 71, dur: 2 },
    // 3小節目 (C)
    { beat: 8, midi: 72, dur: 1 },
    { beat: 9, midi: 76, dur: 1 },
    { beat: 10, midi: 79, dur: 1 },
    { beat: 11, midi: 76, dur: 1 },
    // 4小節目 (D)
    { beat: 12, midi: 74, dur: 1 },
    { beat: 13, midi: 78, dur: 1 },
    { beat: 14, midi: 81, dur: 2 },
    // 5小節目 (G) — 後半は上の音域で
    { beat: 16, midi: 79, dur: 0.5 },
    { beat: 16.5, midi: 81, dur: 0.5 },
    { beat: 17, midi: 83, dur: 1 },
    { beat: 18, midi: 79, dur: 2 },
    // 6小節目 (Em)
    { beat: 20, midi: 71, dur: 1 },
    { beat: 21, midi: 76, dur: 1 },
    { beat: 22, midi: 79, dur: 2 },
    // 7小節目 (C)
    { beat: 24, midi: 81, dur: 1 },
    { beat: 25, midi: 79, dur: 1 },
    { beat: 26, midi: 76, dur: 2 },
    // 8小節目 (D) — F# → A → D で G に戻る
    { beat: 28, midi: 78, dur: 1 },
    { beat: 29, midi: 81, dur: 1 },
    { beat: 30, midi: 74, dur: 2 },
  ],
  bass: [
    // マーチらしく表拍を刻む。
    { beat: 0, midi: 43, dur: 0.9 },
    { beat: 1, midi: 43, dur: 0.9 },
    { beat: 2, midi: 50, dur: 0.9 },
    { beat: 3, midi: 43, dur: 0.9 },
    { beat: 4, midi: 40, dur: 0.9 },
    { beat: 5, midi: 40, dur: 0.9 },
    { beat: 6, midi: 47, dur: 0.9 },
    { beat: 7, midi: 40, dur: 0.9 },
    { beat: 8, midi: 48, dur: 0.9 },
    { beat: 9, midi: 48, dur: 0.9 },
    { beat: 10, midi: 43, dur: 0.9 },
    { beat: 11, midi: 48, dur: 0.9 },
    { beat: 12, midi: 50, dur: 0.9 },
    { beat: 13, midi: 50, dur: 0.9 },
    { beat: 14, midi: 45, dur: 0.9 },
    { beat: 15, midi: 50, dur: 0.9 },
    { beat: 16, midi: 43, dur: 0.9 },
    { beat: 17, midi: 43, dur: 0.9 },
    { beat: 18, midi: 50, dur: 0.9 },
    { beat: 19, midi: 43, dur: 0.9 },
    { beat: 20, midi: 40, dur: 0.9 },
    { beat: 21, midi: 40, dur: 0.9 },
    { beat: 22, midi: 47, dur: 0.9 },
    { beat: 23, midi: 40, dur: 0.9 },
    { beat: 24, midi: 48, dur: 0.9 },
    { beat: 25, midi: 48, dur: 0.9 },
    { beat: 26, midi: 43, dur: 0.9 },
    { beat: 27, midi: 48, dur: 0.9 },
    { beat: 28, midi: 50, dur: 0.9 },
    { beat: 29, midi: 50, dur: 0.9 },
    { beat: 30, midi: 45, dur: 0.9 },
    { beat: 31, midi: 50, dur: 0.9 },
  ],
  drums: {
    kick: [
      'x.....x...x.....',
      'x.....x...x.....',
      'x.....x...x.....',
      'x.....x...x.x.x.',
    ],
    snare: [
      '....x.......x...',
      '....x.......x...',
      '....x.......x...',
      '....x.......x.x.',
    ],
    hat: ['xoxoxoxoxoxoxoxo'],
  },
  // G メジャーペンタトニック G4 から。
  comboScale: [67, 69, 71, 74, 76, 79, 81, 83, 86, 88],
};
