/**
 * Web Audio API だけで音を作る合成音源。音源ファイルは一切使わない。
 *
 * どの関数も「いつ鳴らすか」を AudioContext のタイムライン上の絶対時刻(秒)で受け取る。
 * 呼び出し時刻ではなく予約時刻で鳴るので、先読みスケジューラから安全に呼べる。
 */

/** 各パートの音量バス。曲の中でのバランスはここで一度だけ決める。 */
export interface SynthBuses {
  lead: GainNode;
  bass: GainNode;
  chord: GainNode;
  drum: GainNode;
  se: GainNode;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const ROOT_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus4: [0, 5, 7],
};

/**
 * 'Am' 'F' 'G7' のようなコード名を MIDI ノート番号の配列に変換する。
 * 解釈できない名前は C メジャーとして扱い、曲が無音になるより鳴らすことを優先する。
 */
export function chordToMidi(name: string, octave = 4): number[] {
  const match = name.match(/^([A-G])([#b]?)(.*)$/);
  if (!match) return chordToMidi('C', octave);
  const [, letter, accidental, quality] = match;
  const intervals = CHORD_INTERVALS[quality] ?? CHORD_INTERVALS[''];
  let root = ROOT_SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  root += 12 * (octave + 1);
  return intervals.map((interval) => root + interval);
}

/**
 * 楽曲パートと効果音を別の出口につなぐ。演奏を止めたあとも判定音だけは鳴らせるように、
 * 効果音バスだけは楽曲用のミュートの影響を受けない場所に挿す。
 */
export function createBuses(ctx: AudioContext, musicDest: AudioNode, seDest: AudioNode): SynthBuses {
  function bus(gain: number, destination: AudioNode): GainNode {
    const node = ctx.createGain();
    node.gain.value = gain;
    node.connect(destination);
    return node;
  }
  return {
    lead: bus(0.22, musicDest),
    bass: bus(0.3, musicDest),
    chord: bus(0.1, musicDest),
    drum: bus(0.5, musicDest),
    se: bus(0.35, seDest),
  };
}

/** ノイズ系ドラムのもとになる 1 秒分のホワイトノイズ。エンジン起動時に一度だけ作る。 */
export function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export interface ToneOptions {
  time: number;
  freq: number;
  dur: number;
  vel: number;
  type: OscillatorType;
  /** ローパスの遮断周波数。省略時はフィルタを挟まない。 */
  cutoff?: number;
  attack?: number;
  release?: number;
}

/** 単音を鳴らす。リード・ベース・コードパッド・効果音のすべてがこれを使う。 */
export function playTone(ctx: AudioContext, destination: AudioNode, options: ToneOptions): void {
  const { time, freq, dur, vel, type, cutoff, attack = 0.008, release = 0.09 } = options;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(Math.max(vel, 0.0002), time + attack);
  // サステインを少し落としてから離す。まっすぐ伸ばすより耳当たりがよい。
  env.gain.exponentialRampToValueAtTime(Math.max(vel * 0.65, 0.0002), time + dur * 0.6);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);

  let tail: AudioNode = env;
  if (cutoff !== undefined) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.8;
    env.connect(filter);
    tail = filter;
  }

  osc.connect(env);
  tail.connect(destination);
  osc.start(time);
  osc.stop(time + dur + release + 0.02);
}

export function playKick(ctx: AudioContext, destination: AudioNode, time: number, vel: number): void {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.05);

  const env = ctx.createGain();
  env.gain.setValueAtTime(vel, time);
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

  osc.connect(env);
  env.connect(destination);
  osc.start(time);
  osc.stop(time + 0.3);
}

function playNoise(
  ctx: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  time: number,
  vel: number,
  decay: number,
  filterType: BiquadFilterType,
  frequency: number,
): void {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  // 毎回同じ波形の頭から鳴らすと機械的に聞こえるので、読み出し位置をずらす。
  const offset = Math.random() * (buffer.duration - decay - 0.05);

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;

  const env = ctx.createGain();
  env.gain.setValueAtTime(vel, time);
  env.gain.exponentialRampToValueAtTime(0.0001, time + decay);

  source.connect(filter);
  filter.connect(env);
  env.connect(destination);
  source.start(time, Math.max(offset, 0), decay + 0.05);
}

export function playSnare(
  ctx: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  time: number,
  vel: number,
): void {
  playNoise(ctx, destination, buffer, time, vel * 0.8, 0.16, 'bandpass', 1800);
  // ノイズだけだと芯がないので、短いサイン波を重ねて胴鳴りを足す。
  playTone(ctx, destination, {
    time,
    freq: 190,
    dur: 0.05,
    vel: vel * 0.35,
    type: 'triangle',
    release: 0.04,
  });
}

export function playHat(
  ctx: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  time: number,
  vel: number,
): void {
  playNoise(ctx, destination, buffer, time, vel * 0.35, 0.045, 'highpass', 7000);
}
