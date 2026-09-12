import { MelodyNote, Song } from '../types';

/**
 * 「ブルーアワー」 — Eマイナー / BPM 152 / 切なさで押し切る疾走エモロック。
 *
 * ネオンラッシュ（明るい高速ボカロポップ）の対になる曲として、同じ「速い曲」でも
 * 短調・エモ寄りの型を組み直したもの。実在の楽曲は使わず、型だけを取っている:
 * 丸サ進行（IVM7 - V - iiim7 - vim）、Aメロは8分主体、サビで4つ打ちに切り替えて押す、
 * 最後に導音 D#(87) を置いて次ループへ半音でつなぐ。ジャンルや進行に著作権はない。
 *
 * 旋律はネオンラッシュより16分を減らして8分主体にしてあるので、拍が取りやすい。
 * BPM 152 は 1拍 0.395 秒。難易度ごとの拍数（8/6/4拍）そのままだと短いので
 * `beatsPerQuestionScale` で 1.5 倍する。1問あたり やさしい4.7秒 / ふつう3.6秒 /
 * むずかしい2.4秒 になり、ネオンラッシュ（4.3/3.2/2.1秒）より少しだけ余裕がある。
 */

/** 16分（既定）で音を並べる。サビの駆け上がりだけに使う。 */
function run(startBeat: number, midis: number[], step = 0.25): MelodyNote[] {
  return midis.map((midi, index) => ({ beat: startBeat + index * step, midi, dur: step }));
}

/**
 * 8分でルートを刻み、小節の終わりだけ5度→オクターブ上へ持ち上げるベース。
 * 4つ打ちに寄りかからずに前へ進む、エモロックの定番の動き。
 */
function driveBass(rootsPerBar: number[]): MelodyNote[] {
  const notes: MelodyNote[] = [];
  rootsPerBar.forEach((root, bar) => {
    for (let step = 0; step < 8; step++) {
      // 最後の2つの8分で5度→オクターブと上がり、次の小節の頭へ受け渡す。
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

export const blueHour: Song = {
  id: 'blue-hour',
  title: 'ブルーアワー',
  mood: '切なさで押し切る疾走エモロック',
  bpm: 152,
  beatsPerBar: 4,
  loopBars: 8,
  // 1拍 0.395 秒。拍数をそのまま使うと問題を読み切れないので 1.5 倍して戻す。
  beatsPerQuestionScale: 1.5,
  // 丸サ進行（Cmaj7 - D - Bm7 - Em）を2周。後半だけ Am7 - B7 に振り、
  // B7 の D# から次ループ頭の Cmaj7（E を含む）へ半音でつなぐ。
  chords: ['Cmaj7', 'D', 'Bm7', 'Em', 'Cmaj7', 'D', 'Am7', 'B7'],
  lead: [
    // 1小節目 (Cmaj7) — Aメロ。8分主体で、低めの音域から始める。
    { beat: 0, midi: 83, dur: 0.5 },
    { beat: 0.5, midi: 84, dur: 0.5 },
    { beat: 1, midi: 83, dur: 0.5 },
    { beat: 1.5, midi: 79, dur: 0.5 },
    { beat: 2, midi: 81, dur: 1 },
    { beat: 3, midi: 79, dur: 0.5 },
    { beat: 3.5, midi: 78, dur: 0.5 },
    // 2小節目 (D)
    { beat: 4, midi: 78, dur: 0.5 },
    { beat: 4.5, midi: 81, dur: 0.5 },
    { beat: 5, midi: 83, dur: 1 },
    { beat: 6, midi: 81, dur: 0.5 },
    { beat: 6.5, midi: 83, dur: 0.5 },
    { beat: 7, midi: 86, dur: 1 },
    // 3小節目 (Bm7)
    { beat: 8, midi: 86, dur: 0.5 },
    { beat: 8.5, midi: 83, dur: 0.5 },
    { beat: 9, midi: 81, dur: 0.5 },
    { beat: 9.5, midi: 83, dur: 0.5 },
    { beat: 10, midi: 86, dur: 1 },
    { beat: 11, midi: 83, dur: 0.5 },
    { beat: 11.5, midi: 81, dur: 0.5 },
    // 4小節目 (Em) — サビへの助走。オクターブ上の E(88) へ跳ねて持ち上げる。
    { beat: 12, midi: 79, dur: 0.5 },
    { beat: 12.5, midi: 81, dur: 0.5 },
    { beat: 13, midi: 88, dur: 1 },
    { beat: 14, midi: 83, dur: 0.5 },
    { beat: 14.5, midi: 84, dur: 0.5 },
    { beat: 15, midi: 83, dur: 0.5 },
    { beat: 15.5, midi: 84, dur: 0.5 },
    // 5小節目 (Cmaj7) — サビ。高い音域に貼りついたまま歌い切る。
    { beat: 16, midi: 88, dur: 1 },
    { beat: 17, midi: 86, dur: 0.5 },
    { beat: 17.5, midi: 88, dur: 0.5 },
    { beat: 18, midi: 84, dur: 0.5 },
    { beat: 18.5, midi: 86, dur: 0.5 },
    { beat: 19, midi: 83, dur: 1 },
    // 6小節目 (D) — ここだけ16分の駆け上がりを差し込む。
    { beat: 20, midi: 86, dur: 0.5 },
    { beat: 20.5, midi: 88, dur: 0.5 },
    { beat: 21, midi: 88, dur: 1 },
    ...run(22, [86, 88, 86, 84]),
    { beat: 23, midi: 83, dur: 1 },
    // 7小節目 (Am7) — いちど落として、もういちど上げ直す。
    { beat: 24, midi: 84, dur: 0.5 },
    { beat: 24.5, midi: 81, dur: 0.5 },
    { beat: 25, midi: 79, dur: 0.5 },
    { beat: 25.5, midi: 81, dur: 0.5 },
    ...run(26, [84, 86, 88, 86]),
    { beat: 27, midi: 84, dur: 1 },
    // 8小節目 (B7) — D#(87) が導音。すぐ上の E(88) へ解決して次のループへ渡す。
    { beat: 28, midi: 83, dur: 0.5 },
    { beat: 28.5, midi: 84, dur: 0.5 },
    { beat: 29, midi: 83, dur: 0.5 },
    { beat: 29.5, midi: 81, dur: 0.5 },
    { beat: 30, midi: 78, dur: 0.5 },
    { beat: 30.5, midi: 81, dur: 0.5 },
    { beat: 31, midi: 87, dur: 0.5 },
    { beat: 31.5, midi: 88, dur: 0.5 },
  ],
  // C3 - D3 - B2 - E2 - C3 - D3 - A2 - B2。4小節目の Em だけ低く落として着地感を出す。
  bass: driveBass([48, 50, 47, 40, 48, 50, 45, 47]),
  drums: {
    kick: [
      // Aメロは4つ打ちにせず、1拍目と2拍裏・3拍目で前に押すロックのキック。
      'x.....x.x.......',
      'x.....x.x.....x.',
      'x.....x.x.......',
      'x.....x.x...x...',
      // サビで4つ打ちに切り替える。ここが曲のいちばん強いところ。
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x...x...',
      'x...x...x.x.x.x.',
    ],
    snare: [
      '....x.......x...',
      '....x.......x...',
      '....x.......x...',
      '....x.......x..o',
      '....x.......x...',
      '....x.......x...',
      '....x.......x..o',
      '....x...x.x.xxx.',
    ],
    hat: [
      // Aメロは8分ハット。ネオンラッシュの16分より隙間があり、拍を取りやすい。
      'x.o.x.o.x.o.x.o.',
      'x.o.x.o.x.o.x.o.',
      'x.o.x.o.x.o.x.o.',
      'x.o.x.o.x.o.xoxo',
      // サビだけ16分に細かくして密度を上げる。
      'xoxoxoxoxoxoxoxo',
      'xoxoxoxoxoxoxoxo',
      'xoxoxoxoxoxoxoxo',
      // 最後はハットを切って、キックとスネアのフィルだけを見せる。
      'xoxoxoxoxoxo....',
    ],
  },
  // E マイナーペンタトニック（E G A B D）を B4 から2オクターブ。
  comboScale: [71, 74, 76, 79, 81, 83, 86, 88, 91, 93],
};
