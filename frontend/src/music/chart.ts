import { Quiz } from '../types';
import { getDifficultyLabel } from '../utils/quizGroups';
import { buildLaneChoices } from '../utils/answerOptions';
import { Chart, ChartNote, LANES, Lane, Song } from './types';
import { neonRush, songById } from './songs';

/**
 * 問題データから譜面を自動生成する。
 *
 * 譜面を手書きせず生成にしているのは、このアプリが1プレイごとに問題をシャッフルして
 * 15問を抜き出す（`utils/shuffle.ts`）ため。固定譜面だと問題と噛み合わない。
 */

export type DifficultyTier = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_TIERS: DifficultyTier[] = ['easy', 'normal', 'hard'];

export const TIER_LABEL: Record<DifficultyTier, string> = {
  easy: 'やさしい',
  normal: 'ふつう',
  hard: 'むずかしい',
};

/**
 * 1問に割り当てる拍数。短いほど考える時間が減り、譜面が忙しくなる。
 *
 * これは BPM 100〜140 帯の曲を前提にした値で、そのまま使うと速い曲では秒数が足りない。
 * 曲側の beatsPerQuestionScale を掛けて、体感の秒数をどの曲でもそろえる。
 */
const BEATS_PER_QUESTION: Record<DifficultyTier, number> = {
  easy: 8,
  normal: 6,
  hard: 4,
};

/** ガイドノーツを何拍おきに置くか。 */
const GUIDE_EVERY_BEATS: Record<DifficultyTier, number> = {
  easy: 2,
  normal: 1,
  hard: 1,
};

/** カウントインの拍数。この拍数だけガイドノーツが流れてから最初の問題が出る。 */
const COUNT_IN_BEATS = 8;

/** 最後のノーツのあと、曲を止めるまでの余韻。 */
const TAIL_BEATS = 4;

/** グラフを選ぶ問題（一次関数）かどうか。レーンの見た目も曲もここで分岐する。 */
export function isGraphQuiz(quiz: Quiz): boolean {
  return quiz.questions.some((question) => question.graphOptions && question.graphOptions.length > 0);
}

/**
 * そのクイズで鳴らす曲。プレイヤーがスタート画面で選んでいれば、それを最優先する。
 *
 * 選べる曲はネオンラッシュだけなので、既定もネオンラッシュ。以前の
 * 「一次関数はスロープライン」といった曲の振り分けは、その曲を非表示にしたぶん無くなっている。
 */
export function songForQuiz(songId?: string | null): Song {
  const chosen = songId ? songById.get(songId) : undefined;
  return chosen ?? neonRush;
}

/**
 * 音ゲーモードで遊べるクイズかどうか。
 * 4つのレーン＝4つの選択肢という作りなので、記述式には対応しない。
 */
export function isRhythmEligible(quiz: Quiz): boolean {
  // 国語（漢字）は読みをひらがなで入力する記述式なので、レーンに割り当てられない。
  if (quiz.subject === 'Japanese') return false;
  if (quiz.questions.length === 0) return false;
  // 正解を含む4つの選択肢に落とせない問題が1つでもあると、その問題は必ず不正解になる。
  // グラフ選択問題は4つのグラフがそのままレーンになる（buildLaneChoices が面倒を見る）。
  return quiz.questions.every((question) => buildLaneChoices(question) !== null);
}

/** クイズから既定の難易度を決める。プレイヤーはスタート画面で変更できる。 */
export function defaultTierForQuiz(quiz: Quiz): DifficultyTier {
  // グラフ問題は4枚のグラフを見比べる時間が要る。中学の問題だからと 'hard'（4拍／問）を
  // 既定にすると、読み終える前にノーツが判定ラインを通過してしまう。
  if (isGraphQuiz(quiz)) return 'easy';
  if (getDifficultyLabel(quiz.id).includes('かんたん')) return 'easy';
  if (quiz.grade === 'Middle School') return 'hard';
  return 'normal';
}

/**
 * ガイドノーツのレーン。見た目が偏らない程度にばらけていれば十分なので、
 * 決定的なハッシュで散らす。同じ譜面なら毎回同じ位置に出る。
 */
function guideLane(seed: number): Lane {
  const noise = Math.sin(seed * 12.9898) * 43758.5453;
  return (Math.floor((noise - Math.floor(noise)) * 4) % 4) as Lane;
}

export function buildChart(questionCount: number, song: Song, tier: DifficultyTier): Chart {
  const beatsPerQuestion = Math.round(BEATS_PER_QUESTION[tier] * (song.beatsPerQuestionScale ?? 1));
  // ノーツの出現＝問題文の表示。両者を同じ拍にそろえると「出た問題がそのまま落ちてくる」
  // という読み方になり、BPM が変わっても迷わない。
  const lookAheadBeats = beatsPerQuestion - 1;
  // カウントインのガイドも画面上から落ちきるよう、先読みぶんだけ前に余白を取る。
  const leadInBeats = COUNT_IN_BEATS + lookAheadBeats;
  const guideEvery = GUIDE_EVERY_BEATS[tier];

  const notes: ChartNote[] = [];
  const questionStartBeats: number[] = [];
  const answerBeats: number[] = [];

  for (let i = 0; i < COUNT_IN_BEATS; i++) {
    notes.push({
      id: `count-${i}`,
      beat: lookAheadBeats + i,
      lane: (i % 4) as Lane,
      kind: 'guide',
      questionIndex: -1,
    });
  }

  for (let index = 0; index < questionCount; index++) {
    const startBeat = leadInBeats + index * beatsPerQuestion;
    const answerBeat = startBeat + beatsPerQuestion - 1;
    questionStartBeats.push(startBeat);
    answerBeats.push(answerBeat);

    // 判定ノーツは4レーン全部に同時に降らせる。正解のレーンだけに置くと答えが見えてしまう。
    for (const lane of LANES) {
      notes.push({
        id: `answer-${index}-${lane}`,
        beat: answerBeat,
        lane,
        kind: 'answer',
        questionIndex: index,
      });
    }

    for (let beat = startBeat; beat < answerBeat; beat += guideEvery) {
      notes.push({
        id: `guide-${index}-${beat}`,
        beat,
        lane: guideLane(index * 16 + beat),
        kind: 'guide',
        questionIndex: -1,
      });
    }
  }

  notes.sort((a, b) => a.beat - b.beat);

  return {
    songId: song.id,
    bpm: song.bpm,
    leadInBeats,
    beatsPerQuestion,
    lookAheadBeats,
    totalBeats: leadInBeats + questionCount * beatsPerQuestion + TAIL_BEATS,
    notes,
    questionStartBeats,
    answerBeats,
  };
}

/** その拍で表示しているべき問題の添字。カウントイン中と演奏後は -1。 */
export function questionIndexAtBeat(chart: Chart, beat: number): number {
  if (beat < chart.leadInBeats) return -1;
  const index = Math.floor((beat - chart.leadInBeats) / chart.beatsPerQuestion);
  return index < chart.questionStartBeats.length ? index : -1;
}
