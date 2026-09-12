import { MelodyNote, Song } from '../types';

/**
 * 「フルドライブ」 — Cメジャー / BPM 176 / アニメOP風の疾走ポップロック。
 *
 * もとは同じ枠に「ブルーアワー」（Eマイナーの切ないエモロック）を置いていたが、
 * アニソンの型に組み替えたもの。実在の楽曲は使わず、型だけを取っている:
 * カノン進行（C-G-Am-Em-F-C-F-G）、1小節目のキメ（旋律とキック・スネアを同じ位置で叩く）、
 * サビ頭がいきなり最高音、サビ前の16分の駆け上がり、最後の G の導音 B(83) から
 * 次ループ頭の C(84) へ解決。ジャンルや進行に著作権はない。
 *
 * ネオンラッシュ（Aマイナーの高速ボカロポップ）に対して、こちらは長調で明るく、
 * サビで4つ打ちに切り替えて押し切るのが違い。
 *
 * BPM 176 は 1拍 0.341 秒。難易度ごとの拍数（8/6/4拍）そのままでは短すぎるので
 * `beatsPerQuestionScale` で 1.5 倍する。1問あたり やさしい4.1秒 / ふつう3.1秒 /
 * むずかしい2.0秒 になり、ネオンラッシュ（4.3/3.2/2.1秒）とほぼ同じ体感になる。
 */

/** 16分（既定）で音を並べる。サビ前の駆け上がりと締めのフレーズだけに使う。 */
function run(startBeat: number, midis: number[], step = 0.25): MelodyNote[] {
  return midis.map((midi, index) => ({ beat: startBeat + index * step, midi, dur: step }));
}

/**
 * 8分でルートを刻み、小節の後半で5度→オクターブ上へ上がって次の小節へ渡すベース。
 * アニソンの疾走曲はベースが休まず走り続けるので、全小節同じ形で通す。
 */
function driveBass(rootsPerBar: number[]): MelodyNote[] {
  const notes: MelodyNote[] = [];
  rootsPerBar.forEach((root, bar) => {
    for (let step = 0; step < 8; step++) {
      const midi = step === 6 ? root + 7 : step === 7 ? root + 12 : root;
      notes.push({
        beat: bar * 4 + step * 0.5,
        midi,
        dur: 0.45,
        // 表拍を強く、裏拍を弱く。8分の連打が跳ねて聞こえる。
        vel: step % 2 === 0 ? 0.9 : 0.55,
      });
    }
  });
  return notes;
}

export const fullDrive: Song = {
  id: 'full-drive',
  title: 'フルドライブ',
  mood: '全開で駆け抜けるアニメOP風ロック',
  bpm: 176,
  beatsPerBar: 4,
  loopBars: 8,
  // 1拍 0.341 秒。拍数をそのまま使うと問題を読み切れないので 1.5 倍して戻す。
  beatsPerQuestionScale: 1.5,
  // カノン進行。8小節目の G から次ループ頭の C へ、いちばん強い形で戻る。
  chords: ['C', 'G', 'Am', 'Em', 'F', 'C', 'F', 'G'],
  lead: [
    // 1小節目 (C) — キメ。ドラムと同じ位置で3発叩いてから走り出す。
    { beat: 0, midi: 84, dur: 0.5 },
    { beat: 0.5, midi: 83, dur: 0.5 },
    { beat: 1, midi: 84, dur: 0.5 },
    // 3拍目の手前まで伸ばして、拍を食う感じを出す。
    { beat: 1.5, midi: 79, dur: 1 },
    { beat: 2.5, midi: 81, dur: 0.5 },
    { beat: 3, midi: 83, dur: 0.5 },
    { beat: 3.5, midi: 84, dur: 0.5 },
    // 2小節目 (G)
    { beat: 4, midi: 86, dur: 0.5 },
    { beat: 4.5, midi: 83, dur: 0.5 },
    { beat: 5, midi: 79, dur: 1 },
    { beat: 6, midi: 83, dur: 0.5 },
    { beat: 6.5, midi: 86, dur: 0.5 },
    { beat: 7, midi: 88, dur: 1 },
    // 3小節目 (Am)
    { beat: 8, midi: 84, dur: 0.5 },
    { beat: 8.5, midi: 81, dur: 0.5 },
    { beat: 9, midi: 84, dur: 0.5 },
    { beat: 9.5, midi: 86, dur: 0.5 },
    { beat: 10, midi: 84, dur: 1 },
    { beat: 11, midi: 81, dur: 0.5 },
    { beat: 11.5, midi: 83, dur: 0.5 },
    // 4小節目 (Em) — いちど低い音まで落として、最後の1拍を16分で駆け上がる。
    { beat: 12, midi: 84, dur: 0.5 },
    { beat: 12.5, midi: 83, dur: 0.5 },
    { beat: 13, midi: 79, dur: 1 },
    { beat: 14, midi: 76, dur: 0.5 },
    { beat: 14.5, midi: 79, dur: 0.5 },
    ...run(15, [81, 83, 84, 86]),
    // 5小節目 (F) — サビ。1拍目でいきなり最高音 F6(89) に飛び込む。
    { beat: 16, midi: 89, dur: 1 },
    { beat: 17, midi: 88, dur: 0.5 },
    { beat: 17.5, midi: 86, dur: 0.5 },
    { beat: 18, midi: 88, dur: 1 },
    { beat: 19, midi: 84, dur: 0.5 },
    { beat: 19.5, midi: 86, dur: 0.5 },
    // 6小節目 (C)
    { beat: 20, midi: 88, dur: 1 },
    { beat: 21, midi: 84, dur: 0.5 },
    { beat: 21.5, midi: 86, dur: 0.5 },
    { beat: 22, midi: 84, dur: 0.5 },
    { beat: 22.5, midi: 83, dur: 0.5 },
    { beat: 23, midi: 81, dur: 1 },
    // 7小節目 (F) — もういちど最高音まで上げ直す。
    { beat: 24, midi: 84, dur: 0.5 },
    { beat: 24.5, midi: 86, dur: 0.5 },
    { beat: 25, midi: 88, dur: 1 },
    { beat: 26, midi: 89, dur: 0.5 },
    { beat: 26.5, midi: 88, dur: 0.5 },
    { beat: 27, midi: 86, dur: 1 },
    // 8小節目 (G) — 16分で降りてきて、導音 B(83) から次ループ頭の C(84) へ解決する。
    { beat: 28, midi: 88, dur: 0.5 },
    { beat: 28.5, midi: 86, dur: 0.5 },
    { beat: 29, midi: 84, dur: 0.5 },
    { beat: 29.5, midi: 86, dur: 0.5 },
    ...run(30, [88, 86, 84, 81]),
    { beat: 31, midi: 79, dur: 0.5 },
    { beat: 31.5, midi: 83, dur: 0.5 },
  ],
  // C3 - G2 - A2 - E2 - F2 - C3 - F2 - G2。カノン進行のルートをそのままなぞる。
  bass: driveBass([48, 43, 45, 40, 41, 48, 41, 43]),
  drums: {
    kick: [
      // 1小節目と3小節目はキメ。旋律と同じ 1拍目・1拍裏・2拍目で揃えて叩く。
      'x.x.x.....x.....',
      'x...x..x..x.....',
      'x.x.x.....x.....',
      'x...x..x..x.x...',
      // サビは4つ打ちに切り替えて押し切る。
      'x...x...x...x...',
      'x...x...x..xx...',
      'x...x...x...x...',
      'x...x...x.x.x.x.',
    ],
    snare: [
      '..x.x.......x...',
      '....x.......x...',
      '..x.x.......x...',
      '....x.......x..o',
      '....x.......x...',
      '....x.......x...',
      '....x.......x..o',
      '....x...x.xxx.x.',
    ],
    hat: [
      // キメの小節はハットも一緒に止めて、空いたところから8分で戻す。
      'x.x.x.....o.o.o.',
      'x.o.x.o.x.o.x.o.',
      'x.x.x.....o.o.o.',
      'x.o.x.o.x.o.xoxo',
      // サビだけ16分に細かくして密度を上げる。
      'xoxoxoxoxoxoxoxo',
      'xoxoxoxoxoxoxoxo',
      'xoxoxoxoxoxoxoxo',
      // 最後はハットを切って、キックとスネアのフィルだけを見せる。
      'xoxoxoxoxo......',
    ],
  },
  // C メジャーペンタトニック（C D E G A）を C5 から2オクターブ。
  comboScale: [72, 74, 76, 79, 81, 84, 86, 88, 91, 93],
};
