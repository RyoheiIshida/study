import { GraphOption, Question } from '../types';
import { normalizeReading } from './reading';

/**
 * 選択肢の組み立て。通常モードと音ゲーモードの両方が同じ選択肢を出す必要があるため、
 * QuestionChallenge にあったロジックをそのまま切り出した純関数。
 */

/** 'A: 48' のようなラベル付き選択肢から、答え合わせに使う値だけを取り出す。 */
export function getAnswerValue(option: string): string {
  const label = option.match(/^([A-D]):\s*/)?.[1];
  return label ?? option;
}

/**
 * 4つの選択肢を返す。問題データに4つ以上の選択肢があればそれを使い、
 * 足りない場合は正解の数値の前後からダミーを作る（数値でなければ「選択肢N」で埋める）。
 */
export function buildAnswerOptions(question: Question | undefined, isTextInput: boolean): string[] {
  if (!question || isTextInput) return [];
  if (question.options && question.options.length >= 4) {
    return question.options;
  }

  const answerNumber = Number(question.answer);
  const base = new Set<string>([question.answer]);
  if (Number.isFinite(answerNumber)) {
    let offset = 1;
    while (base.size < 4) {
      for (const candidate of [answerNumber - offset, answerNumber + offset]) {
        if (base.size >= 4) break;
        if (candidate >= 0) {
          base.add(String(candidate));
        }
      }
      offset += 1;
    }
  } else {
    let counter = 1;
    while (base.size < 4) {
      base.add(`選択肢${counter}`);
      counter += 1;
    }
  }
  return Array.from(base).sort((a, b) => a.localeCompare(b));
}

export const LANE_COUNT = 4;

function findCorrectOption(options: string[], answer: string): string | undefined {
  const normalizedAnswer = normalizeReading(answer);
  return options.find((option) => normalizeReading(getAnswerValue(option)) === normalizedAnswer);
}

/**
 * 音ゲーモードで1レーンに割り当てる選択肢。
 *
 * 文字の選択肢とグラフの選択肢を同じ形で扱うための型。判定に使う値（`value`）と
 * 画面に出すもの（`label` またはグラフ）を分けてあるので、レーンの見た目がグラフに
 * 変わっても、正誤を決めるコードは1本のままで済む。
 */
export interface LaneChoice {
  /** 答え合わせに使う値。`question.answer` と突き合わせる。 */
  value: string;
  /** レーンとリザルトに出す文字。グラフ問題では 'A' などの記号だけになる。 */
  label: string;
  /** グラフ選択問題のときだけ入る。レーンにはこのグラフを描く。 */
  graph?: GraphOption;
}

/**
 * 音ゲーモードのレーンに並べる4つの選択肢。
 *
 * レーンが4つしかないので、選択肢が5つ以上ある問題では4つに絞る。ただし絞った結果
 * 正解が消えると、そのレーンを叩きようがなくなり永久に不正解になってしまう。
 * 正解を必ず残せると確認できない問題は `null` を返し、音ゲーモードの対象から外す。
 */
export function buildLaneChoices(question: Question): LaneChoice[] | null {
  // 一次関数のようなグラフ選択問題。文章の選択肢は長すぎてレーンに収まらないので、
  // グラフそのものをレーンに描く。並び順は A・B・C・D のまま動かさない。
  if (question.graphOptions && question.graphOptions.length > 0) {
    return buildGraphLaneChoices(question.graphOptions, question.answer);
  }

  const options = buildAnswerOptions(question, false);
  if (options.length < LANE_COUNT) return null;

  const correct = findCorrectOption(options, question.answer);
  if (!correct) return null;

  const chosen =
    options.length === LANE_COUNT
      ? options
      : [correct, ...options.filter((option) => option !== correct).slice(0, LANE_COUNT - 1)].sort((a, b) =>
          a.localeCompare(b),
        );

  return chosen.map((option) => ({ value: getAnswerValue(option), label: option }));
}

function buildGraphLaneChoices(graphOptions: GraphOption[], answer: string): LaneChoice[] | null {
  const normalizedAnswer = normalizeReading(answer);
  const correct = graphOptions.find((option) => normalizeReading(option.id) === normalizedAnswer);
  // 正解のグラフが選択肢に無い問題は、どのレーンを叩いても不正解になってしまう。
  if (!correct) return null;

  // 2択の問題（超かんたん）は、1つの選択肢に2レーンずつ割り当てる。
  // レーンを2つ余らせるより、選択肢1つあたりの幅が倍になってグラフが大きく出せる。
  // 隣り合う同じ選択肢は、画面側で1つの広いボタンにまとめられる。
  if (graphOptions.length === 2) {
    return graphOptions.flatMap((option) =>
      Array.from({ length: LANE_COUNT / 2 }, () => ({ value: option.id, label: option.id, graph: option })),
    );
  }
  if (graphOptions.length < LANE_COUNT) return null;

  const chosen =
    graphOptions.length === LANE_COUNT
      ? graphOptions
      : [correct, ...graphOptions.filter((option) => option !== correct).slice(0, LANE_COUNT - 1)].sort((a, b) =>
          a.id.localeCompare(b.id),
        );

  return chosen.map((option) => ({ value: option.id, label: option.id, graph: option }));
}
