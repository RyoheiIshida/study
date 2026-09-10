import { MelodyNote, Song } from '../types';

/**
 * 「ネオンラッシュ」 — Aマイナー / BPM 168 / 高速ボカロポップ。
 *
 * 今の10代に刺さる「速い曲」の型をそのまま組み立てた曲。実在の楽曲は使わず、
 * 流行りの作り（イントロ無し・16分刻みのハット・詰め込んだ早口の旋律・
 * 半音で解決する turnaround）だけを取り出してある。ジャンルや進行に著作権はない。
 *
 * 他の曲と違うのは BPM 168 という速さで、1拍が 0.36 秒しかない。
 * そのままだと難易度ごとの拍数（8/6/4拍）が短すぎて問題を読み切れないので、
 * `beatsPerQuestionScale` で 1.5 倍に戻し、体感の秒数を他の曲にそろえている。
 *
 * コード進行は Am - F - C - G（小室進行）を軸に、後半で Dm7 - E7 に振って
 * G# の導音から次のループの A へ半音で解決させる。ボカロ曲の定番の終わり方。
 */

/** 16分（既定）で音を並べる。ボカロ曲の“早口”フレーズはこれで書く。 */
function run(startBeat: number, midis: number[], step = 0.25): MelodyNote[] {
  return midis.map((midi, index) => ({ beat: startBeat + index * step, midi, dur: step }));
}

/**
 * 16分の裏でオクターブ上に跳ぶベース。速いテンポでこれをやると推進力が出る。
 * 小節ごとのルート音を受け取り、8分刻みに展開する。
 */
function rushBass(rootsPerBar: number[]): MelodyNote[] {
  const notes: MelodyNote[] = [];
  rootsPerBar.forEach((root, bar) => {
    for (let step = 0; step < 8; step++) {
      notes.push({
        beat: bar * 4 + step * 0.5,
        // 2拍にいちど、裏拍でオクターブ上へ跳ねる。
        midi: step % 4 === 3 ? root + 12 : root,
        dur: 0.45,
        // 表拍を強く、裏拍を弱く。これだけで機械的な連打が跳ねて聞こえる。
        vel: step % 2 === 0 ? 0.95 : 0.55,
      });
    }
  });
  return notes;
}

export const neonRush: Song = {
  id: 'neon-rush',
  title: 'ネオンラッシュ',
  mood: '疾走感マシマシの高速ボカロポップ',
  bpm: 168,
  beatsPerBar: 4,
  loopBars: 8,
  // 1拍 0.36 秒なので、拍数はそのままでは短すぎる。1.5 倍して他の曲と秒数をそろえる。
  beatsPerQuestionScale: 1.5,
  chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm7', 'E7'],
  lead: [
    // 1小節目 (Am) — イントロを置かず、1拍目からいきなりフックに入る。
    { beat: 0, midi: 81, dur: 0.5 },
    { beat: 0.5, midi: 81, dur: 0.5 },
    { beat: 1, midi: 84, dur: 0.5 },
    { beat: 1.5, midi: 83, dur: 0.5 },
    { beat: 2, midi: 81, dur: 1 },
    { beat: 3, midi: 76, dur: 0.5 },
    { beat: 3.5, midi: 79, dur: 0.5 },
    // 2小節目 (F)
    { beat: 4, midi: 77, dur: 0.5 },
    { beat: 4.5, midi: 81, dur: 0.5 },
    { beat: 5, midi: 84, dur: 1 },
    { beat: 6, midi: 83, dur: 0.5 },
    { beat: 6.5, midi: 84, dur: 0.5 },
    { beat: 7, midi: 81, dur: 1 },
    // 3小節目 (C)
    { beat: 8, midi: 84, dur: 0.5 },
    { beat: 8.5, midi: 84, dur: 0.5 },
    { beat: 9, midi: 88, dur: 0.5 },
    { beat: 9.5, midi: 84, dur: 0.5 },
    { beat: 10, midi: 83, dur: 1 },
    { beat: 11, midi: 81, dur: 0.5 },
    { beat: 11.5, midi: 83, dur: 0.5 },
    // 4小節目 (G) — 後半へ持ち上げるため、最後を A で終えて 5小節目の頭につなぐ。
    { beat: 12, midi: 79, dur: 0.5 },
    { beat: 12.5, midi: 83, dur: 0.5 },
    { beat: 13, midi: 86, dur: 1 },
    { beat: 14, midi: 84, dur: 0.5 },
    { beat: 14.5, midi: 83, dur: 0.5 },
    { beat: 15, midi: 79, dur: 0.5 },
    { beat: 15.5, midi: 81, dur: 0.5 },
    // 5小節目 (Am) — サビ。16分の駆け上がりで一段上の音域へ。
    ...run(16, [81, 83, 84, 86]),
    { beat: 17, midi: 88, dur: 1 },
    { beat: 18, midi: 84, dur: 0.5 },
    { beat: 18.5, midi: 88, dur: 0.5 },
    { beat: 19, midi: 89, dur: 0.5 },
    { beat: 19.5, midi: 88, dur: 0.5 },
    // 6小節目 (F)
    { beat: 20, midi: 89, dur: 0.5 },
    { beat: 20.5, midi: 88, dur: 0.5 },
    { beat: 21, midi: 84, dur: 1 },
    ...run(22, [88, 84, 83, 84]),
    { beat: 23, midi: 81, dur: 1 },
    // 7小節目 (Dm7) — 16分を畳みかけていちばん忙しくする。
    ...run(24, [86, 84, 81, 84]),
    { beat: 25, midi: 86, dur: 0.5 },
    { beat: 25.5, midi: 88, dur: 0.5 },
    ...run(26, [89, 88, 86, 84]),
    { beat: 27, midi: 83, dur: 1 },
    // 8小節目 (E7) — G#(80) が導音。次のループ頭の A(81) へ半音で解決する。
    { beat: 28, midi: 88, dur: 0.5 },
    { beat: 28.5, midi: 86, dur: 0.5 },
    { beat: 29, midi: 84, dur: 0.5 },
    { beat: 29.5, midi: 83, dur: 0.5 },
    { beat: 30, midi: 81, dur: 0.5 },
    { beat: 30.5, midi: 83, dur: 0.5 },
    { beat: 31, midi: 80, dur: 1 },
  ],
  // A2 - F2 - C3 - G2 - A2 - F2 - D3 - E3。
  bass: rushBass([45, 41, 48, 43, 45, 41, 50, 52]),
  drums: {
    // 4つ打ちを土台に、2小節おきに前のめりのキックを足す。最後の1小節はフィル。
    kick: [
      'x...x...x...x...',
      'x...x...x..xx...',
      'x...x...x...x...',
      'x...x...x..xx...',
      'x...x...x...x...',
      'x...x...x..xx...',
      'x...x...x..xx...',
      'x...x.x.x.x.x.x.',
    ],
    snare: [
      '....x.......x...',
      '....x.......x...',
      '....x.......x...',
      '....x.......x..o',
      '....x.......x...',
      '....x.......x...',
      '....x.......x...',
      '....x...x.x.x.x.',
    ],
    // 16分ハット。表拍を強く鳴らして、速さが「刻み」として聞こえるようにする。
    hat: ['xoxoxoxoxoxoxoxo'],
  },
  // A マイナーペンタトニック C5 から2オクターブ。
  comboScale: [72, 74, 76, 79, 81, 84, 86, 88, 91, 93],
};
