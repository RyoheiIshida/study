import { Question } from '../types';
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
 * 音ゲーモードのレーンに並べる4つの選択肢。
 *
 * レーンが4つしかないので、選択肢が5つ以上ある問題では4つに絞る。ただし絞った結果
 * 正解が消えると、そのレーンを叩きようがなくなり永久に不正解になってしまう。
 * 正解を必ず残せると確認できない問題は `null` を返し、音ゲーモードの対象から外す。
 */
export function buildLaneOptions(question: Question): string[] | null {
  const options = buildAnswerOptions(question, false);
  if (options.length < LANE_COUNT) return null;

  const correct = findCorrectOption(options, question.answer);
  if (!correct) return null;
  if (options.length === LANE_COUNT) return options;

  const others = options.filter((option) => option !== correct).slice(0, LANE_COUNT - 1);
  return [correct, ...others].sort((a, b) => a.localeCompare(b));
}
