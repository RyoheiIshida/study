import { Song } from '../types';

/**
 * 「あさひのステップ」 — Cメジャー / BPM 100 / 4つ打ちの明るいポップ。
 *
 * 低学年・かんたん難易度向け。テンポを落とし、旋律は C メジャーペンタトニック
 * （C D E G A）に寄せて、外れた感じの音が出ないようにしてある。
 * コード進行は 1小節ずつ C - Am - F - G を2周。
 */
export const sunriseSteps: Song = {
  id: 'sunrise-steps',
  title: 'あさひのステップ',
  mood: 'ゆったり明るい 4つ打ちポップ',
  bpm: 100,
  beatsPerBar: 4,
  loopBars: 8,
  chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'],
  lead: [
    // 1小節目 (C)
    { beat: 0, midi: 64, dur: 1 },
    { beat: 1, midi: 67, dur: 1 },
    { beat: 2, midi: 72, dur: 1.5 },
    { beat: 3.5, midi: 69, dur: 0.5 },
    // 2小節目 (Am)
    { beat: 4, midi: 69, dur: 1 },
    { beat: 5, midi: 72, dur: 1 },
    { beat: 6, midi: 69, dur: 2 },
    // 3小節目 (F)
    { beat: 8, midi: 69, dur: 1 },
    { beat: 9, midi: 72, dur: 1 },
    { beat: 10, midi: 74, dur: 2 },
    // 4小節目 (G)
    { beat: 12, midi: 71, dur: 1 },
    { beat: 13, midi: 74, dur: 1 },
    { beat: 14, midi: 67, dur: 2 },
    // 5小節目 (C) — ここから1オクターブ上げて後半を盛り上げる
    { beat: 16, midi: 72, dur: 1 },
    { beat: 17, midi: 76, dur: 1 },
    { beat: 18, midi: 79, dur: 1.5 },
    { beat: 19.5, midi: 76, dur: 0.5 },
    // 6小節目 (Am)
    { beat: 20, midi: 69, dur: 1 },
    { beat: 21, midi: 72, dur: 1 },
    { beat: 22, midi: 76, dur: 2 },
    // 7小節目 (F)
    { beat: 24, midi: 77, dur: 1 },
    { beat: 25, midi: 76, dur: 1 },
    { beat: 26, midi: 74, dur: 2 },
    // 8小節目 (G) — C に戻れるよう D → B → C で締める
    { beat: 28, midi: 74, dur: 1 },
    { beat: 29, midi: 71, dur: 1 },
    { beat: 30, midi: 72, dur: 2 },
  ],
  bass: [
    { beat: 0, midi: 48, dur: 1.5 },
    { beat: 2, midi: 48, dur: 1.5 },
    { beat: 4, midi: 45, dur: 1.5 },
    { beat: 6, midi: 45, dur: 1.5 },
    { beat: 8, midi: 41, dur: 1.5 },
    { beat: 10, midi: 41, dur: 1.5 },
    { beat: 12, midi: 43, dur: 1.5 },
    { beat: 14, midi: 43, dur: 1.5 },
    { beat: 16, midi: 48, dur: 1.5 },
    { beat: 18, midi: 48, dur: 1.5 },
    { beat: 20, midi: 45, dur: 1.5 },
    { beat: 22, midi: 45, dur: 1.5 },
    { beat: 24, midi: 41, dur: 1.5 },
    { beat: 26, midi: 41, dur: 1.5 },
    { beat: 28, midi: 43, dur: 1.5 },
    { beat: 30, midi: 43, dur: 1.5 },
  ],
  drums: {
    // 8小節ぶん。最後の1小節だけフィルを入れてループの切れ目を作る。
    kick: [
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x.x.x.x.',
    ],
    snare: ['....x.......x...'],
    hat: ['x.o.x.o.x.o.x.o.'],
  },
  // C メジャーペンタトニック C5 から2オクターブ。
  comboScale: [72, 74, 76, 79, 81, 84, 86, 88, 91, 93],
};
