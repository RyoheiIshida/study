import { MelodyNote, Song } from './types';
import { JudgeKind } from './judge';
import {
  SynthBuses,
  chordToMidi,
  createBuses,
  createNoiseBuffer,
  midiToFreq,
  playHat,
  playKick,
  playSnare,
  playTone,
} from './synth';

/**
 * 楽曲の再生と、ゲーム全体のマスタークロックを受け持つ。
 *
 * 音ゲーで `setInterval` や `Date.now()` をクロックに使うと、数十秒でノーツと音がずれる。
 * 唯一の基準は `AudioContext.currentTime` で、
 *
 *   - 発音は「先読みスケジューラ」で 25ms ごとに 120ms 先までを予約する
 *   - 描画と判定は `requestAnimationFrame` 側から `currentBeat()` を読むだけ
 *
 * という定番の組み合わせにしている。React の state は一切クロックに関与しない。
 */

/** スケジューラを回す間隔（ミリ秒）。 */
const LOOKAHEAD_MS = 25;
/** 何秒先までの発音を予約しておくか。 */
const SCHEDULE_AHEAD_S = 0.12;
/** start() を呼んでから実際に曲が始まるまでの余裕。最初の音の取りこぼしを防ぐ。 */
const START_DELAY_S = 0.15;
/** ドラムパターン1小節あたりのステップ数（16分音符）。 */
const DRUM_STEPS_PER_BAR = 16;

interface LoopEvent {
  /** ループ先頭からの拍。 */
  beat: number;
  play: (time: number) => void;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private buses: SynthBuses | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private song: Song | null = null;
  private events: LoopEvent[] = [];
  private eventIndex = 0;
  private loopIndex = 0;
  private eventsExhausted = false;

  private schedulerId: number | null = null;
  private startTime = 0;
  private secondsPerBeatValue = 0.5;
  private totalBeats = 0;
  private running = false;
  private onFinish: (() => void) | null = null;

  private offsetSec = 0;
  private volume = 0.7;

  get isRunning(): boolean {
    return this.running;
  }

  get secondsPerBeat(): number {
    return this.secondsPerBeatValue;
  }

  get msPerBeat(): number {
    return this.secondsPerBeatValue * 1000;
  }

  get currentSong(): Song | null {
    return this.song;
  }

  /**
   * AudioContext は初回の start() で一度だけ作る。ブラウザの autoplay policy により
   * ユーザー操作を起点に呼ばないと suspended のままになるので、呼び出し側は必ず
   * クリック／タップのハンドラから start() を呼ぶこと。
   */
  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();

    const master = ctx.createGain();
    master.gain.value = this.volume;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.ratio.value = 4;
    master.connect(compressor);
    compressor.connect(ctx.destination);

    // 楽曲パートだけをまとめる段。停止時にここだけ絞れば、判定音は鳴らせる。
    const music = ctx.createGain();
    music.gain.value = 1;
    music.connect(master);

    this.ctx = ctx;
    this.masterGain = master;
    this.musicGain = music;
    this.buses = createBuses(ctx, music, master);
    this.noiseBuffer = createNoiseBuffer(ctx);
    return ctx;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(Math.max(volume, 0), 1);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setOffsetMs(offsetMs: number): void {
    this.offsetSec = offsetMs / 1000;
  }

  currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** 判定オフセットを含まない、譜面そのままの拍位置。発音予約とキャリブレーションで使う。 */
  rawBeatAt(time: number): number {
    return (time - this.startTime) / this.secondsPerBeatValue;
  }

  /** プレイヤーが体感する拍位置。描画と判定はどちらもこれを使うので両者がずれない。 */
  beatAt(time: number): number {
    return (time - this.startTime - this.offsetSec) / this.secondsPerBeatValue;
  }

  currentBeat(): number {
    return this.beatAt(this.currentTime());
  }

  private timeAtBeat(beat: number): number {
    return this.startTime + beat * this.secondsPerBeatValue;
  }

  async start(song: Song, totalBeats: number, onFinish?: () => void): Promise<void> {
    this.stop();
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.song = song;
    this.totalBeats = totalBeats;
    this.onFinish = onFinish ?? null;
    this.secondsPerBeatValue = 60 / song.bpm;
    this.events = this.buildLoopEvents(song);
    this.eventIndex = 0;
    this.loopIndex = 0;
    this.eventsExhausted = false;
    this.startTime = ctx.currentTime + START_DELAY_S;
    this.running = true;

    if (this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
      this.musicGain.gain.setValueAtTime(1, ctx.currentTime);
    }

    this.tick();
    this.schedulerId = window.setInterval(this.tick, LOOKAHEAD_MS);
  }

  stop(): void {
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.running = false;
    this.onFinish = null;
    // 予約済みの音（最大 SCHEDULE_AHEAD_S 先）を素早く消してから元に戻す。
    if (this.ctx && this.musicGain) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0, now + 0.06);
      this.musicGain.gain.setValueAtTime(1, now + SCHEDULE_AHEAD_S + 0.2);
    }
  }

  private finish(): void {
    const callback = this.onFinish;
    this.stop();
    callback?.();
  }

  private tick = (): void => {
    const ctx = this.ctx;
    const song = this.song;
    if (!ctx || !song || !this.running) return;

    const loopBeats = song.loopBars * song.beatsPerBar;
    if (loopBeats > 0 && this.events.length > 0 && !this.eventsExhausted) {
      const horizonBeat = this.rawBeatAt(ctx.currentTime + SCHEDULE_AHEAD_S);
      while (true) {
        const event = this.events[this.eventIndex];
        const absoluteBeat = this.loopIndex * loopBeats + event.beat;
        if (absoluteBeat >= this.totalBeats) {
          // 予約はここで打ち切るが、再生が最後まで進むまで finish() はしない。
          this.eventsExhausted = true;
          break;
        }
        if (absoluteBeat >= horizonBeat) break;
        event.play(this.timeAtBeat(absoluteBeat));
        this.eventIndex += 1;
        if (this.eventIndex >= this.events.length) {
          this.eventIndex = 0;
          this.loopIndex += 1;
        }
      }
    }

    if (this.rawBeatAt(ctx.currentTime) >= this.totalBeats) {
      this.finish();
    }
  };

  private buildLoopEvents(song: Song): LoopEvent[] {
    const ctx = this.ensureContext();
    const buses = this.buses!;
    const noise = this.noiseBuffer!;
    const secondsPerBeat = 60 / song.bpm;
    const events: LoopEvent[] = [];

    const pushMelody = (notes: MelodyNote[], bus: GainNode, type: OscillatorType, cutoff?: number) => {
      for (const note of notes) {
        const freq = midiToFreq(note.midi);
        const dur = note.dur * secondsPerBeat;
        const vel = note.vel ?? 0.8;
        events.push({
          beat: note.beat,
          play: (time) => playTone(ctx, bus, { time, freq, dur, vel, type, cutoff }),
        });
      }
    };

    pushMelody(song.lead, buses.lead, 'square', 2600);
    pushMelody(song.bass, buses.bass, 'triangle');

    // コードは小節頭にパッドとして置く。和音があるだけで一気に曲らしくなる。
    for (let bar = 0; bar < song.loopBars; bar++) {
      const chordName = song.chords[bar % song.chords.length];
      const dur = song.beatsPerBar * secondsPerBeat * 0.95;
      const midis = chordToMidi(chordName, 4);
      events.push({
        beat: bar * song.beatsPerBar,
        play: (time) => {
          for (const midi of midis) {
            playTone(ctx, buses.chord, {
              time,
              freq: midiToFreq(midi),
              dur,
              vel: 0.5,
              type: 'sawtooth',
              cutoff: 1200,
              attack: 0.05,
              release: 0.2,
            });
          }
        },
      });
    }

    const beatsPerStep = song.beatsPerBar / DRUM_STEPS_PER_BAR;
    const pushDrum = (patterns: string[], play: (time: number, vel: number) => void) => {
      if (patterns.length === 0) return;
      for (let bar = 0; bar < song.loopBars; bar++) {
        const pattern = patterns[bar % patterns.length];
        for (let step = 0; step < DRUM_STEPS_PER_BAR; step++) {
          const symbol = pattern[step];
          if (symbol !== 'x' && symbol !== 'o') continue;
          const vel = symbol === 'x' ? 0.9 : 0.5;
          events.push({
            beat: bar * song.beatsPerBar + step * beatsPerStep,
            play: (time) => play(time, vel),
          });
        }
      }
    };

    pushDrum(song.drums.kick, (time, vel) => playKick(ctx, buses.drum, time, vel));
    pushDrum(song.drums.snare, (time, vel) => playSnare(ctx, buses.drum, noise, time, vel));
    pushDrum(song.drums.hat, (time, vel) => playHat(ctx, buses.drum, noise, time, vel));

    // 同じ拍のイベントは登録順のままでよい。安定ソートで拍順に並べる。
    events.sort((a, b) => a.beat - b.beat);
    return events;
  }

  /** 判定に対する効果音。コンボが伸びるほど音階が上がる。 */
  playSe(kind: JudgeKind, combo: number): void {
    const ctx = this.ctx;
    const buses = this.buses;
    if (!ctx || !buses) return;
    const time = ctx.currentTime;

    if (kind === 'miss') {
      playTone(ctx, buses.se, { time, freq: 110, dur: 0.12, vel: 0.5, type: 'sawtooth', cutoff: 700 });
      return;
    }

    const scale = this.song?.comboScale ?? [72, 74, 76, 79, 81];
    const midi = scale[Math.min(Math.max(combo - 1, 0), scale.length - 1)];
    const vel = kind === 'perfect' ? 0.85 : kind === 'great' ? 0.65 : 0.45;
    playTone(ctx, buses.se, { time, freq: midiToFreq(midi), dur: 0.1, vel, type: 'triangle' });
    if (kind === 'perfect') {
      // PERFECT だけオクターブ上を重ねて、耳だけで最高判定と分かるようにする。
      playTone(ctx, buses.se, { time, freq: midiToFreq(midi + 12), dur: 0.08, vel: 0.4, type: 'sine' });
    }
  }

  /** キャリブレーション用の単純なクリック。 */
  playClick(time: number, accent: boolean): void {
    const ctx = this.ctx;
    const buses = this.buses;
    if (!ctx || !buses) return;
    playTone(ctx, buses.se, {
      time,
      freq: accent ? 1600 : 1100,
      dur: 0.03,
      vel: accent ? 0.7 : 0.45,
      type: 'square',
      release: 0.02,
    });
  }

  /**
   * キャリブレーション用のメトロノーム。楽曲と同じクロックの上で動くので、
   * 測ったズレをそのまま判定オフセットとして使える。
   */
  async startMetronome(bpm: number, beats: number, onFinish?: () => void): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    this.stop();
    this.song = null;
    this.secondsPerBeatValue = 60 / bpm;
    this.totalBeats = beats;
    this.onFinish = onFinish ?? null;
    this.startTime = ctx.currentTime + START_DELAY_S;
    this.running = true;

    for (let beat = 0; beat < beats; beat++) {
      this.playClick(this.timeAtBeat(beat), beat % 4 === 0);
    }

    this.schedulerId = window.setInterval(() => {
      if (this.rawBeatAt(this.currentTime()) >= this.totalBeats) {
        this.finish();
      }
    }, LOOKAHEAD_MS);
  }

  /** ページを離れるときに呼ぶ。AudioContext ごと破棄する。 */
  dispose(): void {
    this.stop();
    this.ctx?.close().catch(() => {
      // すでに閉じている場合は何もしない。
    });
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.buses = null;
    this.noiseBuffer = null;
  }
}
