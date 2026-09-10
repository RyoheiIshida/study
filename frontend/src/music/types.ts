/**
 * 楽曲と譜面の共通型。
 *
 * 時間の単位は一貫して「拍(beat)」で扱う。秒に変換するのは AudioEngine の中だけで、
 * 楽曲データも譜面も BPM に依存しない形で書けるようにしている。
 */

/** 楽曲中の1音。 */
export interface MelodyNote {
  /** ループ先頭からの拍。0 = 1小節目1拍目。小数可（0.5 = 8分裏）。 */
  beat: number;
  /** MIDIノート番号。60 = C4。 */
  midi: number;
  /** 長さ（拍）。 */
  dur: number;
  /** 音量 0..1。省略時 0.8。 */
  vel?: number;
}

/**
 * ドラムの1小節分のパターン。16分音符16ステップを1文字ずつで表す。
 * 'x' = 強く鳴らす / 'o' = 弱く鳴らす / それ以外（'.'）= 休符。
 * 配列がループ小節数より短い場合は先頭から繰り返して使う。
 */
export type DrumPattern = string[];

export interface Song {
  id: string;
  title: string;
  /** 曲の雰囲気を1行で。スタート画面に出す。 */
  mood: string;
  bpm: number;
  /**
   * 1問に割り当てる拍数の倍率。省略時 1。
   * 速い曲ほど1拍が短いので、難易度ごとの拍数をそのまま使うと問題を読む時間が足りなくなる。
   * BPM を上げたぶんをここで戻し、体感の「1問あたり何秒か」を曲どうしでそろえる。
   */
  beatsPerQuestionScale?: number;
  beatsPerBar: number;
  /** 1ループの小節数。曲はこの長さで延々ループする。 */
  loopBars: number;
  /** 小節ごとのコード名（'C' 'Am' 'F' 'G7' など）。長さは loopBars と一致させる。 */
  chords: string[];
  /** 主旋律。 */
  lead: MelodyNote[];
  /** ベース。 */
  bass: MelodyNote[];
  drums: {
    kick: DrumPattern;
    snare: DrumPattern;
    hat: DrumPattern;
  };
  /** コンボ音に使う音階（MIDI番号の昇順）。曲の調と衝突しない音だけを並べる。 */
  comboScale: number[];
}

export type Lane = 0 | 1 | 2 | 3;

export const LANES: Lane[] = [0, 1, 2, 3];

/** キーボードでの各レーンの担当キー。 */
export const LANE_KEYS = ['d', 'f', 'j', 'k'];

export interface ChartNote {
  id: string;
  /** 曲頭からの絶対拍。 */
  beat: number;
  lane: Lane;
  /** answer = 判定対象のノーツ / guide = 拍を示すだけの装飾（判定なし）。 */
  kind: 'answer' | 'guide';
  /** answer のときは対応する問題の添字。guide や導入部では -1。 */
  questionIndex: number;
}

export interface Chart {
  songId: string;
  bpm: number;
  /** 曲頭からカウントインに使う拍数。最初の問題はこの拍から始まる。 */
  leadInBeats: number;
  /** 1問に割り当てる拍数。 */
  beatsPerQuestion: number;
  /**
   * ノーツが画面上部に現れてから判定ラインに届くまでの拍数。
   * `beatsPerQuestion - 1` にしてあるので、問題文の表示とノーツの出現が同時になる。
   */
  lookAheadBeats: number;
  /** 曲全体の長さ（拍）。ここに達したら演奏を止める。 */
  totalBeats: number;
  notes: ChartNote[];
  /** 問題ごとの、問題文を差し替える拍。 */
  questionStartBeats: number[];
  /** 問題ごとの、判定ノーツが判定ラインに届く拍。 */
  answerBeats: number[];
}
