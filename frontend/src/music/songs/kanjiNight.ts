import { MelodyNote, Song } from '../types';

/** 小節ごとのルート音を受け取り、8分刻みのベースラインに展開する。 */
function buildDrivingBass(rootsPerBar: number[]): MelodyNote[] {
  const notes: MelodyNote[] = [];
  for (let bar = 0; bar < rootsPerBar.length; bar++) {
    const root = rootsPerBar[bar];
    for (let step = 0; step < 8; step++) {
      notes.push({
        beat: bar * 4 + step * 0.5,
        // 小節の折り返しで5度に上がると単調さが消える。
        midi: step === 6 ? root + 7 : root,
        dur: 0.45,
        vel: step % 2 === 0 ? 0.85 : 0.55,
      });
    }
  }
  return notes;
}

/**
 * 「よるの漢字」 — Aマイナー / BPM 140 / 疾走感のあるマイナー。
 *
 * 高難易度（中学生向け・4拍ウィンドウ）用。8分でベースを刻んで前へ進む感じを出し、
 * 最後の小節だけ E（Aマイナーのドミナント）に置き換えてループの引きを作っている。
 * コード進行は Am - F - C - G - Am - F - C - E。
 */
export const kanjiNight: Song = {
  id: 'kanji-night',
  title: 'よるの漢字',
  mood: '疾走するマイナー',
  bpm: 140,
  beatsPerBar: 4,
  loopBars: 8,
  chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E'],
  lead: [
    // 1小節目 (Am)
    { beat: 0, midi: 69, dur: 0.5 },
    { beat: 0.5, midi: 72, dur: 0.5 },
    { beat: 1, midi: 76, dur: 1 },
    { beat: 2, midi: 81, dur: 1 },
    { beat: 3, midi: 76, dur: 1 },
    // 2小節目 (F)
    { beat: 4, midi: 77, dur: 1 },
    { beat: 5, midi: 76, dur: 0.5 },
    { beat: 5.5, midi: 72, dur: 0.5 },
    { beat: 6, midi: 69, dur: 2 },
    // 3小節目 (C)
    { beat: 8, midi: 72, dur: 0.5 },
    { beat: 8.5, midi: 76, dur: 0.5 },
    { beat: 9, midi: 79, dur: 1 },
    { beat: 10, midi: 76, dur: 2 },
    // 4小節目 (G)
    { beat: 12, midi: 74, dur: 1 },
    { beat: 13, midi: 71, dur: 1 },
    { beat: 14, midi: 67, dur: 2 },
    // 5小節目 (Am) — 頂点から降りてくる
    { beat: 16, midi: 81, dur: 0.5 },
    { beat: 16.5, midi: 79, dur: 0.5 },
    { beat: 17, midi: 76, dur: 1 },
    { beat: 18, midi: 72, dur: 1 },
    { beat: 19, midi: 69, dur: 1 },
    // 6小節目 (F)
    { beat: 20, midi: 77, dur: 1 },
    { beat: 21, midi: 81, dur: 1 },
    { beat: 22, midi: 77, dur: 2 },
    // 7小節目 (C)
    { beat: 24, midi: 76, dur: 1 },
    { beat: 25, midi: 79, dur: 1 },
    { beat: 26, midi: 84, dur: 2 },
    // 8小節目 (E) — G# を通ることでループ頭の Am に強く帰る
    { beat: 28, midi: 83, dur: 1 },
    { beat: 29, midi: 80, dur: 1 },
    { beat: 30, midi: 76, dur: 2 },
  ],
  // 8分刻みのルート。1小節につき8音。
  bass: buildDrivingBass([45, 41, 48, 43, 45, 41, 48, 40]),
  drums: {
    kick: [
      'x..x..x...x.....',
      'x..x..x...x.....',
      'x..x..x...x.....',
      'x..x..x...x.x.x.',
    ],
    snare: [
      '....x.......x...',
      '....x.......x...',
      '....x.......x...',
      '....x.......x.x.',
    ],
    hat: ['xoxoxoxoxoxoxoxo'],
  },
  // A マイナーペンタトニック A4 から。
  comboScale: [69, 72, 74, 76, 79, 81, 84, 86, 88, 91],
};
