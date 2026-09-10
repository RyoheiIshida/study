import { MutableRefObject, useEffect, useRef } from 'react';
import { AudioEngine } from '../music/engine';
import { Chart } from '../music/types';

/**
 * ノーツが落ちてくる部分の描画だけを受け持つ。入力とゲーム進行は親（RhythmChallenge）にある。
 *
 * ここは60fpsで動くので React の state を一切使わない。毎フレーム
 * `engine.currentBeat()` を読んで座標を計算し、判定済みかどうかなどの可変情報は
 * ref 越しに読む。そうしないと再レンダリングがフレーム落ちの原因になる。
 */

export const LANE_COLORS = ['#2dd4bf', '#f2c14e', '#f28b82', '#7aa7e0'];

const JUDGE_LINE_MARGIN = 30;
const NOTE_HEIGHT = 18;
const FLASH_SECONDS = 0.25;

interface NoteHighwayProps {
  chart: Chart;
  engine: AudioEngine;
  /** 演奏中だけノーツを動かす。停止中は空のレーンを描く。 */
  active: boolean;
  /** すでに回答した問題の添字。その問題の判定ノーツは描かない。 */
  judgedRef: MutableRefObject<Set<number>>;
  /** レーンごとの、最後に叩かれた時刻（AudioContext基準）。光らせるのに使う。 */
  laneFlashRef: MutableRefObject<number[]>;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function NoteHighway({ chart, engine, active, judgedRef, laneFlashRef }: NoteHighwayProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  // 描画対象の先頭ノーツ。拍は単調に進むので、毎フレーム先頭から探し直さずに済む。
  const firstVisibleRef = useRef(0);

  useEffect(() => {
    firstVisibleRef.current = 0;
  }, [chart, active]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!wrapper || !canvas) return;
      const rect = wrapper.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.max(Math.floor(rect.width * dpr), 1);
      canvas.height = Math.max(Math.floor(rect.height * dpr), 1);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);

    let frame = 0;

    function draw() {
      frame = window.requestAnimationFrame(draw);
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;

      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) return;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const laneWidth = width / 4;
      const judgeY = height - JUDGE_LINE_MARGIN;
      const pixelsPerBeat = (judgeY - 10) / chart.lookAheadBeats;
      // 演奏していないあいだの拍位置は前回のプレイの残りなので、空のレーンを描く。
      const running = active && engine.isRunning;
      const beat = running ? engine.currentBeat() : 0;
      const now = engine.currentTime();

      // 背景とレーン
      context.fillStyle = '#101d22';
      context.fillRect(0, 0, width, height);
      for (let lane = 0; lane < 4; lane++) {
        const x = lane * laneWidth;
        context.fillStyle = lane % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.015)';
        context.fillRect(x, 0, laneWidth, height);

        const flashAge = now - (laneFlashRef.current[lane] ?? -Infinity);
        if (flashAge >= 0 && flashAge < FLASH_SECONDS) {
          context.globalAlpha = 0.35 * (1 - flashAge / FLASH_SECONDS);
          context.fillStyle = LANE_COLORS[lane];
          context.fillRect(x, 0, laneWidth, height);
          context.globalAlpha = 1;
        }

        context.strokeStyle = 'rgba(255,255,255,0.08)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, height);
        context.stroke();
      }

      // 判定ライン。拍の頭で太くしてメトロノーム代わりにする。
      const beatPhase = running ? beat - Math.floor(beat) : 0.5;
      const pulse = running ? 1 - Math.min(beatPhase * 2, 1) : 0;
      context.strokeStyle = `rgba(255,255,255,${0.35 + pulse * 0.45})`;
      context.lineWidth = 2 + pulse * 2;
      context.beginPath();
      context.moveTo(0, judgeY);
      context.lineTo(width, judgeY);
      context.stroke();

      for (let lane = 0; lane < 4; lane++) {
        context.strokeStyle = LANE_COLORS[lane];
        context.globalAlpha = 0.5 + pulse * 0.4;
        context.lineWidth = 2;
        roundedRect(context, lane * laneWidth + laneWidth * 0.12, judgeY - NOTE_HEIGHT / 2, laneWidth * 0.76, NOTE_HEIGHT, 6);
        context.stroke();
        context.globalAlpha = 1;
      }

      if (!running) return;

      const notes = chart.notes;
      let index = firstVisibleRef.current;
      while (index < notes.length && notes[index].beat < beat - 0.75) index += 1;
      firstVisibleRef.current = index;

      for (let i = index; i < notes.length; i++) {
        const note = notes[i];
        const relative = note.beat - beat;
        if (relative > chart.lookAheadBeats) break;
        if (note.kind === 'answer' && judgedRef.current.has(note.questionIndex)) continue;

        const y = judgeY - relative * pixelsPerBeat;
        const x = note.lane * laneWidth;

        if (note.kind === 'guide') {
          context.globalAlpha = 0.4;
          context.fillStyle = '#ffffff';
          context.beginPath();
          context.arc(x + laneWidth / 2, y, 4, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 1;
          continue;
        }

        context.fillStyle = LANE_COLORS[note.lane];
        roundedRect(context, x + laneWidth * 0.1, y - NOTE_HEIGHT / 2, laneWidth * 0.8, NOTE_HEIGHT, 7);
        context.fill();
        context.fillStyle = 'rgba(255,255,255,0.35)';
        roundedRect(context, x + laneWidth * 0.1, y - NOTE_HEIGHT / 2, laneWidth * 0.8, NOTE_HEIGHT / 2.6, 7);
        context.fill();
      }
    }

    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [chart, engine, active, judgedRef, laneFlashRef]);

  return (
    <div className="note-highway" ref={wrapperRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default NoteHighway;
