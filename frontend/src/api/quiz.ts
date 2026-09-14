import { Grade, ProgressRecord, Question, Quiz, SavedProgress, Subject } from '../types';
import { TOKEN_KEY } from './auth';
import { childQuery } from './childQuery';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const STORAGE_KEY = 'study-app-quizzes';
const PROGRESS_KEY = 'study-app-progress';

/**
 * 超かんたん（2択）をさらに細かく分けた段階。1つの段階では、決まった2本の直線だけを見比べる。
 *
 * 見る場所を1つに絞るため、傾きの段階は切片を 0、切片の段階は傾きを 1 にそろえてある。
 * 2本の違いが傾き（または切片）だけになり、ほかの数字に気を取られずに練習できる。
 * backend/src/data/store.ts にも同じ生成処理がある。問題を変えるときは両方そろえること。
 */
type LinearPairFocus = 'slope' | 'intercept';

interface LinearPairLevel {
  key: string;
  focus: LinearPairFocus;
  values: [number, number];
}

const linearPairLevels: LinearPairLevel[] = [
  { key: 'slope-1-half', focus: 'slope', values: [1, 0.5] },
  { key: 'slope-1-2', focus: 'slope', values: [1, 2] },
  { key: 'slope-1-m1', focus: 'slope', values: [1, -1] },
  { key: 'slope-2-m2', focus: 'slope', values: [2, -2] },
  { key: 'intercept-1-2', focus: 'intercept', values: [1, 2] },
  { key: 'intercept-1-3', focus: 'intercept', values: [1, 3] },
  { key: 'intercept-2-3', focus: 'intercept', values: [2, 3] },
  { key: 'intercept-1-m1', focus: 'intercept', values: [1, -1] },
  { key: 'intercept-2-m2', focus: 'intercept', values: [2, -2] },
  { key: 'intercept-3-m3', focus: 'intercept', values: [3, -3] },
];

/** value × d が整数になる最小の d。傾き 1/2 なら 2（x が 2 増えると y が 1 増える）。 */
function denominatorOf(value: number): number {
  return [1, 2, 3, 4, 5, 6].find((item) => Number.isInteger(value * item)) ?? 1;
}

/** 0.5 → '1/2' のように、問題文と同じ分数の書き方にする。 */
function formatNumber(value: number): string {
  const denominator = denominatorOf(value);
  if (denominator === 1) return String(value);
  return `${value < 0 ? '-' : ''}${Math.abs(value * denominator)}/${denominator}`;
}

function formatLinear(slope: number, intercept: number): string {
  const coefficient = slope === 1 ? '' : slope === -1 ? '-' : formatNumber(slope);
  const constant = intercept === 0 ? '' : intercept > 0 ? ` + ${intercept}` : ` - ${-intercept}`;
  return `y = ${coefficient}x${constant}`;
}

function pairLine(focus: LinearPairFocus, value: number) {
  return focus === 'slope' ? { slope: value, intercept: 0 } : { slope: 1, intercept: value };
}

function pairExplanation(focus: LinearPairFocus, target: number, other: number): string {
  const { slope, intercept } = pairLine(focus, target);
  const equation = formatLinear(slope, intercept);
  if (focus === 'intercept') {
    return `${equation} の切片は ${target} なので、y 軸と ${target} の目盛りで交わります。もう一方の直線は ${other} で交わります。`;
  }
  const run = denominatorOf(target);
  const rise = target * run;
  const direction = target > 0 ? '右上がり' : '右下がり';
  const comparison =
    Math.sign(target) === Math.sign(other)
      ? `傾き ${formatNumber(other)} の直線より${Math.abs(target) > Math.abs(other) ? '急な' : 'ゆるやかな'}${direction}です。`
      : `${direction}の直線です。`;
  return `${equation} は傾きが ${formatNumber(target)} なので、x が ${run} 増えると y は ${Math.abs(rise)} ${rise > 0 ? '増えます' : '減ります'}。${comparison}`;
}

function buildLinearPairQuiz({ key, focus, values }: LinearPairLevel): Quiz {
  const name = focus === 'slope' ? '傾き' : '切片';
  const [first, second] = values.map(formatNumber);
  const questions: Question[] = [];
  for (const target of values) {
    const other = target === values[0] ? values[1] : values[0];
    const { slope, intercept } = pairLine(focus, target);
    // 同じ式を、正解が A の問題と B の問題で1回ずつ出す。答えの位置で覚えてしまわないように。
    for (const answer of ['A', 'B']) {
      const [a, b] = answer === 'A' ? [target, other] : [other, target];
      questions.push({
        id: `linear-pair-${key}-${questions.length + 1}`,
        text: `直線 ${formatLinear(slope, intercept)} のグラフとして正しいものを選びましょう。`,
        answer,
        graphOptions: [
          { id: 'A', ...pairLine(focus, a) },
          { id: 'B', ...pairLine(focus, b) },
        ],
        options: [`A: ${name}が ${formatNumber(a)} の直線`, `B: ${name}が ${formatNumber(b)} の直線`],
        explanation: pairExplanation(focus, target, other),
      });
    }
  }
  return {
    id: `linear-graph-pair-${key}`,
    title: `一次関数のグラフ（${name} ${first} と ${second}）`,
    subject: 'Math',
    grade: 'Middle School',
    description: `2択です。${name}が ${first} と ${second} の直線を見分けましょう。`,
    questions,
  };
}

const linearPairQuizzes = linearPairLevels.map(buildLinearPairQuiz);

/**
 * 問題一覧から外したクイズ。以前この端末に保存したクイズの中に残っていても出さない。
 * backend/src/data/store.ts の retiredQuizIds とそろえてある。
 */
const RETIRED_QUIZ_IDS = new Set(['linear-graph-pair-long-slope', 'linear-graph-pair-long-intercept']);

export const initialQuizzes: Quiz[] = [
  {
    id: 'small-math-1',
    title: 'Addition Sprint',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Warm up with quick one-digit addition.',
    questions: [
      { id: 'q1', text: '3 + 5 = ?', answer: '8', options: ['6', '8', '7', '9'], explanation: '3 plus 5 makes 8.' },
      { id: 'q2', text: '7 + 2 = ?', answer: '9', options: ['8', '10', '6', '9'], explanation: 'Count two steps after 7: 8, 9.' },
      { id: 'q3', text: '6 + 4 = ?', answer: '10', options: ['11', '8', '10', '9'], explanation: '6 and 4 are a pair that makes 10.' },
      { id: 'q13', text: '2 + 6 = ?', answer: '8', options: ['7', '8', '9', '6'], explanation: '2 plus 6 makes 8.' },
      { id: 'q14', text: '9 + 1 = ?', answer: '10', options: ['9', '11', '10', '8'], explanation: 'Count one step after 9: 10.' },
      { id: 'q15', text: '4 + 5 = ?', answer: '9', options: ['8', '9', '10', '7'], explanation: '4 plus 5 makes 9.' },
      { id: 'q16', text: '8 + 3 = ?', answer: '11', options: ['10', '11', '12', '9'], explanation: 'Count three steps after 8: 9, 10, 11.' },
      { id: 'q17', text: '5 + 7 = ?', answer: '12', options: ['11', '12', '13', '10'], explanation: '5 plus 7 makes 12.' },
      { id: 'q18', text: '9 + 6 = ?', answer: '15', options: ['14', '15', '16', '13'], explanation: '9 plus 6 makes 15.' },
      { id: 'q19', text: '12 + 8 = ?', answer: '20', options: ['18', '19', '20', '21'], explanation: '12 plus 8 makes 20.' },
    ],
  },
  {
    id: 'small-math-2',
    title: 'Subtraction Ranger',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Practice taking away small numbers with confidence.',
    questions: [
      { id: 'q4', text: '10 - 3 = ?', answer: '7', options: ['6', '7', '8', '5'], explanation: 'Take 3 away from 10 to get 7.' },
      { id: 'q5', text: '14 - 5 = ?', answer: '9', options: ['8', '9', '10', '7'], explanation: '14 minus 5 is 9.' },
      { id: 'q6', text: '8 - 2 = ?', answer: '6', options: ['7', '6', '5', '4'], explanation: 'Two less than 8 is 6.' },
      { id: 'q20', text: '9 - 4 = ?', answer: '5', options: ['4', '5', '6', '3'], explanation: 'Take 4 away from 9 to get 5.' },
      { id: 'q21', text: '15 - 7 = ?', answer: '8', options: ['7', '8', '9', '6'], explanation: 'Take 7 away from 15 to get 8.' },
      { id: 'q22', text: '11 - 6 = ?', answer: '5', options: ['4', '5', '6', '7'], explanation: 'Take 6 away from 11 to get 5.' },
      { id: 'q23', text: '13 - 8 = ?', answer: '5', options: ['4', '5', '6', '7'], explanation: 'Take 8 away from 13 to get 5.' },
      { id: 'q24', text: '16 - 9 = ?', answer: '7', options: ['6', '7', '8', '5'], explanation: 'Take 9 away from 16 to get 7.' },
      { id: 'q25', text: '20 - 12 = ?', answer: '8', options: ['7', '8', '9', '6'], explanation: 'Take 12 away from 20 to get 8.' },
      { id: 'q26', text: '18 - 11 = ?', answer: '7', options: ['6', '7', '8', '5'], explanation: 'Take 11 away from 18 to get 7.' },
    ],
  },
  {
    id: 'small-math-3',
    title: 'Multiplication Master',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Build rhythm with small multiplication facts.',
    questions: [
      { id: 'q7', text: '3 x 4 = ?', answer: '12', options: ['12', '11', '9', '10'], explanation: '3 groups of 4 make 12.' },
      { id: 'q8', text: '6 x 2 = ?', answer: '12', options: ['8', '10', '12', '14'], explanation: 'Doubling 6 gives 12.' },
      { id: 'q9', text: '7 x 3 = ?', answer: '21', options: ['21', '20', '18', '24'], explanation: '7 + 7 + 7 = 21.' },
      { id: 'q27', text: '2 x 5 = ?', answer: '10', options: ['8', '10', '12', '9'], explanation: '2 groups of 5 make 10.' },
      { id: 'q28', text: '4 x 4 = ?', answer: '16', options: ['12', '14', '16', '18'], explanation: '4 groups of 4 make 16.' },
      { id: 'q29', text: '5 x 5 = ?', answer: '25', options: ['20', '25', '30', '15'], explanation: '5 groups of 5 make 25.' },
      { id: 'q30', text: '8 x 2 = ?', answer: '16', options: ['14', '16', '18', '12'], explanation: 'Doubling 8 gives 16.' },
      { id: 'q31', text: '6 x 3 = ?', answer: '18', options: ['15', '16', '18', '21'], explanation: '6 + 6 + 6 = 18.' },
      { id: 'q32', text: '9 x 2 = ?', answer: '18', options: ['16', '18', '20', '14'], explanation: 'Doubling 9 gives 18.' },
      { id: 'q33', text: '4 x 6 = ?', answer: '24', options: ['20', '22', '24', '26'], explanation: '4 groups of 6 make 24.' },
    ],
  },
  {
    id: 'small-math-4',
    title: 'Division Trail',
    subject: 'Arithmetic',
    grade: 'Elementary',
    description: 'Split numbers into equal groups.',
    questions: [
      { id: 'q10', text: '12 / 3 = ?', answer: '4', options: ['3', '4', '6', '5'], explanation: '12 split into 3 equal groups gives 4 in each.' },
      { id: 'q11', text: '15 / 5 = ?', answer: '3', options: ['2', '3', '4', '5'], explanation: '15 split into 5 equal groups gives 3 in each.' },
      { id: 'q12', text: '18 / 6 = ?', answer: '3', options: ['2', '3', '4', '6'], explanation: '18 split into 6 equal groups gives 3 in each.' },
      { id: 'q34', text: '16 / 4 = ?', answer: '4', options: ['3', '4', '5', '6'], explanation: '16 split into 4 equal groups gives 4 in each.' },
      { id: 'q35', text: '20 / 5 = ?', answer: '4', options: ['3', '4', '5', '6'], explanation: '20 split into 5 equal groups gives 4 in each.' },
      { id: 'q36', text: '24 / 6 = ?', answer: '4', options: ['3', '4', '5', '6'], explanation: '24 split into 6 equal groups gives 4 in each.' },
      { id: 'q37', text: '9 / 3 = ?', answer: '3', options: ['2', '3', '4', '5'], explanation: '9 split into 3 equal groups gives 3 in each.' },
      { id: 'q38', text: '21 / 7 = ?', answer: '3', options: ['2', '3', '4', '5'], explanation: '21 split into 7 equal groups gives 3 in each.' },
      { id: 'q39', text: '27 / 9 = ?', answer: '3', options: ['2', '3', '4', '5'], explanation: '27 split into 9 equal groups gives 3 in each.' },
      { id: 'q40', text: '30 / 5 = ?', answer: '6', options: ['5', '6', '7', '8'], explanation: '30 split into 5 equal groups gives 6 in each.' },
    ],
  },
  {
    id: 'linear-graph-1',
    title: '一次関数のグラフ',
    subject: 'Math',
    grade: 'Middle School',
    description: '4択です。式から傾きと切片を読み取り、対応するグラフを選びましょう。',
    questions: [
      {
        id: 'linear-1',
        text: '直線 y = 2x + 3 のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 2, intercept: 3 },
          { id: 'B', slope: 3, intercept: 2 },
          { id: 'C', slope: -2, intercept: 3 },
          { id: 'D', slope: 2, intercept: -3 },
        ],
        options: [
          'A: 切片が 3 で、x が 1 増えるごとに y は 2 増える直線',
          'B: 切片が 2 で、x が 1 増えるごとに y は 3 増える直線',
          'C: 切片が 3 で、x が 1 増えるごとに y は 2 減る直線',
          'D: 切片が -3 で、x が 1 増えるごとに y は 2 増える直線',
        ],
        explanation: '一次関数 y = ax + b では、a が傾き、b が切片です。y = 2x + 3 は傾き 2、切片 3 です。',
      },
      {
        id: 'linear-2',
        text: '直線 y = -x + 4 のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 4 },
          { id: 'B', slope: -1, intercept: 4 },
          { id: 'C', slope: -1, intercept: -4 },
          { id: 'D', slope: 2, intercept: 4 },
        ],
        options: [
          'A: 切片が 4 で、x が 1 増えるごとに y は 1 増える直線',
          'B: 切片が 4 で、x が 1 増えるごとに y は 1 減る直線',
          'C: 切片が -4 で、x が 1 増えるごとに y は 1 減る直線',
          'D: 切片が 4 で、x が 1 増えるごとに y は 2 増える直線',
        ],
        explanation: 'y = -x + 4 は傾きが -1、切片が 4 なので、x が増えると y は 1 ずつ減ります。',
      },
      {
        id: 'linear-3',
        text: '直線 y = 3x - 2 のグラフとして正しいものを選びましょう。',
        answer: 'C',
        graphOptions: [
          { id: 'A', slope: 2, intercept: -2 },
          { id: 'B', slope: 3, intercept: 2 },
          { id: 'C', slope: 3, intercept: -2 },
          { id: 'D', slope: -2, intercept: 3 },
        ],
        options: [
          'A: 切片が -2 で、x が 1 増えるごとに y は 2 増える直線',
          'B: 切片が 2 で、x が 1 増えるごとに y は 3 増える直線',
          'C: 切片が -2 で、x が 1 増えるごとに y は 3 増える直線',
          'D: 切片が 3 で、x が 1 増えるごとに y は 2 減る直線',
        ],
        explanation: '傾きは 3、切片は -2 です。x が 1 増えると y は 3 増え、y 軸との交点は -2 です。',
      },
      {
        id: 'linear-4',
        text: '直線 y = 1/2 x + 1 のグラフとして正しいものを選びましょう。',
        answer: 'D',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 1 },
          { id: 'B', slope: -1, intercept: 1 },
          { id: 'C', slope: -0.5, intercept: 2 },
          { id: 'D', slope: 0.5, intercept: 1 },
        ],
        options: [
          'A: 切片が 1 で、x が 2 増えるごとに y は 2 増える直線',
          'B: 切片が 1 で、x が 2 増えるごとに y は 2 減る直線',
          'C: 切片が 2 で、x が 1 増えるごとに y は 1/2 減る直線',
          'D: 切片が 1 で、x が 2 増えるごとに y は 1 増える直線',
        ],
        explanation: '傾きが 1/2 なので、x が 2 増えると y は 1 増えます。切片は 1 です。',
      },
      {
        id: 'linear-5',
        text: '直線 y = -2x + 5 のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: -2, intercept: 5 },
          { id: 'B', slope: 2, intercept: -5 },
          { id: 'C', slope: 2, intercept: 5 },
          { id: 'D', slope: -5, intercept: 2 },
        ],
        options: [
          'A: 切片が 5 で、x が 1 増えるごとに y は 2 減る直線',
          'B: 切片が -5 で、x が 1 増えるごとに y は 2 増える直線',
          'C: 切片が 5 で、x が 1 増えるごとに y は 2 増える直線',
          'D: 切片が 2 で、x が 1 増えるごとに y は 5 減る直線',
        ],
        explanation: 'y = -2x + 5 は傾き -2、切片 5 です。x が 1 増えると y は 2 減ります。',
      },
    ],
  },
  {
    id: 'linear-graph-easy-intercept0',
    title: '一次関数のグラフ（かんたん：傾き）',
    subject: 'Math',
    grade: 'Middle School',
    description: '4択です。傾きだけに注目して正しいグラフを選びましょう。',
    questions: [
      {
        id: 'linear-easy0-1',
        text: '直線 y = 2x のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 2, intercept: 0 },
          { id: 'B', slope: -2, intercept: 0 },
          { id: 'C', slope: 3, intercept: 0 },
          { id: 'D', slope: 0.5, intercept: 0 },
        ],
        options: [
          'A: 切片が 0 で、x が 1 増えるごとに y は 2 増える直線',
          'B: 切片が 0 で、x が 1 増えるごとに y は 2 減る直線',
          'C: 切片が 0 で、x が 1 増えるごとに y は 3 増える直線',
          'D: 切片が 0 で、x が 2 増えるごとに y は 1 増える直線',
        ],
        explanation: '一次関数 y = ax では切片は常に 0 で、原点を通ります。y = 2x は傾き 2 です。',
      },
      {
        id: 'linear-easy0-2',
        text: '直線 y = -x のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 0 },
          { id: 'B', slope: -1, intercept: 0 },
          { id: 'C', slope: -2, intercept: 0 },
          { id: 'D', slope: 2, intercept: 0 },
        ],
        options: [
          'A: 切片が 0 で、x が 1 増えるごとに y は 1 増える直線',
          'B: 切片が 0 で、x が 1 増えるごとに y は 1 減る直線',
          'C: 切片が 0 で、x が 1 増えるごとに y は 2 減る直線',
          'D: 切片が 0 で、x が 1 増えるごとに y は 2 増える直線',
        ],
        explanation: 'y = -x は傾きが -1、切片が 0 なので、原点を通り x が増えると y は 1 ずつ減ります。',
      },
      {
        id: 'linear-easy0-3',
        text: '直線 y = 3x のグラフとして正しいものを選びましょう。',
        answer: 'C',
        graphOptions: [
          { id: 'A', slope: 2, intercept: 0 },
          { id: 'B', slope: -3, intercept: 0 },
          { id: 'C', slope: 3, intercept: 0 },
          { id: 'D', slope: -2, intercept: 0 },
        ],
        options: [
          'A: 切片が 0 で、x が 1 増えるごとに y は 2 増える直線',
          'B: 切片が 0 で、x が 1 増えるごとに y は 3 減る直線',
          'C: 切片が 0 で、x が 1 増えるごとに y は 3 増える直線',
          'D: 切片が 0 で、x が 1 増えるごとに y は 2 減る直線',
        ],
        explanation: '傾きは 3、切片は 0 です。原点を通り、x が 1 増えると y は 3 増えます。',
      },
      {
        id: 'linear-easy0-4',
        text: '直線 y = 1/2 x のグラフとして正しいものを選びましょう。',
        answer: 'D',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 0 },
          { id: 'B', slope: -1, intercept: 0 },
          { id: 'C', slope: -0.5, intercept: 0 },
          { id: 'D', slope: 0.5, intercept: 0 },
        ],
        options: [
          'A: 切片が 0 で、x が 2 増えるごとに y は 2 増える直線',
          'B: 切片が 0 で、x が 2 増えるごとに y は 2 減る直線',
          'C: 切片が 0 で、x が 1 増えるごとに y は 1/2 減る直線',
          'D: 切片が 0 で、x が 2 増えるごとに y は 1 増える直線',
        ],
        explanation: '傾きが 1/2 なので、原点を通り x が 2 増えると y は 1 増えます。',
      },
      {
        id: 'linear-easy0-5',
        text: '直線 y = -2x のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: -2, intercept: 0 },
          { id: 'B', slope: 2, intercept: 0 },
          { id: 'C', slope: -3, intercept: 0 },
          { id: 'D', slope: 3, intercept: 0 },
        ],
        options: [
          'A: 切片が 0 で、x が 1 増えるごとに y は 2 減る直線',
          'B: 切片が 0 で、x が 1 増えるごとに y は 2 増える直線',
          'C: 切片が 0 で、x が 1 増えるごとに y は 3 減る直線',
          'D: 切片が 0 で、x が 1 増えるごとに y は 3 増える直線',
        ],
        explanation: 'y = -2x は傾き -2、切片 0 です。原点を通り、x が 1 増えると y は 2 減ります。',
      },
    ],
  },
  {
    id: 'linear-graph-easy-slope1',
    title: '一次関数のグラフ（かんたん：切片）',
    subject: 'Math',
    grade: 'Middle School',
    description: '4択です。切片だけに注目して正しいグラフを選びましょう。',
    questions: [
      {
        id: 'linear-easy1-1',
        text: '直線 y = x + 3 のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 3 },
          { id: 'B', slope: 1, intercept: -3 },
          { id: 'C', slope: 1, intercept: 5 },
          { id: 'D', slope: 1, intercept: 2 },
        ],
        options: [
          'A: 傾きが 1 で、切片が 3 の直線',
          'B: 傾きが 1 で、切片が -3 の直線',
          'C: 傾きが 1 で、切片が 5 の直線',
          'D: 傾きが 1 で、切片が 2 の直線',
        ],
        explanation: '一次関数 y = x + b では傾きは常に 1 で、b が切片です。y = x + 3 の切片は 3 です。',
      },
      {
        id: 'linear-easy1-2',
        text: '直線 y = x - 2 のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 2 },
          { id: 'B', slope: 1, intercept: -2 },
          { id: 'C', slope: 1, intercept: -4 },
          { id: 'D', slope: 1, intercept: 4 },
        ],
        options: [
          'A: 傾きが 1 で、切片が 2 の直線',
          'B: 傾きが 1 で、切片が -2 の直線',
          'C: 傾きが 1 で、切片が -4 の直線',
          'D: 傾きが 1 で、切片が 4 の直線',
        ],
        explanation: 'y = x - 2 の切片は -2 です。傾きは 1 なので、x が 1 増えると y も 1 増えます。',
      },
      {
        id: 'linear-easy1-3',
        text: '直線 y = x + 5 のグラフとして正しいものを選びましょう。',
        answer: 'C',
        graphOptions: [
          { id: 'A', slope: 1, intercept: -5 },
          { id: 'B', slope: 1, intercept: 2 },
          { id: 'C', slope: 1, intercept: 5 },
          { id: 'D', slope: 1, intercept: -2 },
        ],
        options: [
          'A: 傾きが 1 で、切片が -5 の直線',
          'B: 傾きが 1 で、切片が 2 の直線',
          'C: 傾きが 1 で、切片が 5 の直線',
          'D: 傾きが 1 で、切片が -2 の直線',
        ],
        explanation: '切片は y 軸との交点です。y = x + 5 の切片は 5 です。',
      },
      {
        id: 'linear-easy1-4',
        text: '直線 y = x - 1 のグラフとして正しいものを選びましょう。',
        answer: 'D',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 1 },
          { id: 'B', slope: 1, intercept: 3 },
          { id: 'C', slope: 1, intercept: -3 },
          { id: 'D', slope: 1, intercept: -1 },
        ],
        options: [
          'A: 傾きが 1 で、切片が 1 の直線',
          'B: 傾きが 1 で、切片が 3 の直線',
          'C: 傾きが 1 で、切片が -3 の直線',
          'D: 傾きが 1 で、切片が -1 の直線',
        ],
        explanation: 'y = x - 1 の切片は -1 です。傾きは 1 なので原点より少し下から右上がりに伸びます。',
      },
      {
        id: 'linear-easy1-5',
        text: '直線 y = x - 4 のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 1, intercept: -4 },
          { id: 'B', slope: 1, intercept: 4 },
          { id: 'C', slope: 1, intercept: 2 },
          { id: 'D', slope: 1, intercept: -2 },
        ],
        options: [
          'A: 傾きが 1 で、切片が -4 の直線',
          'B: 傾きが 1 で、切片が 4 の直線',
          'C: 傾きが 1 で、切片が 2 の直線',
          'D: 傾きが 1 で、切片が -2 の直線',
        ],
        explanation: 'y = x - 4 の切片は -4 です。傾きは 1 なので x が 1 増えると y も 1 増えます。',
      },
    ],
  },
  {
    id: 'linear-graph-supereasy-slope',
    title: '一次関数のグラフ（超かんたん：傾き＋か－）',
    subject: 'Math',
    grade: 'Middle School',
    description: '2択の超かんたんモードです。',
    questions: [
      {
        id: 'linear-supereasy-slope-1',
        text: '直線 y = 2x のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 2, intercept: 0 },
          { id: 'B', slope: -2, intercept: 0 },
        ],
        options: [
          'A: 傾きが ＋（プラス）で右上がりの直線',
          'B: 傾きが －（マイナス）で右下がりの直線',
        ],
        explanation: 'y = 2x は傾きが +2 なので、右上がりの直線になります。',
      },
      {
        id: 'linear-supereasy-slope-2',
        text: '直線 y = -3x のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: 3, intercept: 0 },
          { id: 'B', slope: -3, intercept: 0 },
        ],
        options: [
          'A: 傾きが ＋（プラス）で右上がりの直線',
          'B: 傾きが －（マイナス）で右下がりの直線',
        ],
        explanation: 'y = -3x は傾きが -3 なので、右下がりの直線になります。',
      },
      {
        id: 'linear-supereasy-slope-3',
        text: '直線 y = x のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: -1, intercept: 0 },
          { id: 'B', slope: 1, intercept: 0 },
        ],
        options: [
          'A: 傾きが －（マイナス）で右下がりの直線',
          'B: 傾きが ＋（プラス）で右上がりの直線',
        ],
        explanation: 'y = x は傾きが +1 なので、右上がりの直線になります。',
      },
      {
        id: 'linear-supereasy-slope-4',
        text: '直線 y = -2x のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: -2, intercept: 0 },
          { id: 'B', slope: 2, intercept: 0 },
        ],
        options: [
          'A: 傾きが －（マイナス）で右下がりの直線',
          'B: 傾きが ＋（プラス）で右上がりの直線',
        ],
        explanation: 'y = -2x は傾きが -2 なので、右下がりの直線になります。',
      },
      {
        id: 'linear-supereasy-slope-5',
        text: '直線 y = 1/2x のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 0.5, intercept: 0 },
          { id: 'B', slope: -0.5, intercept: 0 },
        ],
        options: [
          'A: 傾きが ＋（プラス）で右上がりの直線',
          'B: 傾きが －（マイナス）で右下がりの直線',
        ],
        explanation: 'y = 1/2x は傾きが +0.5 なので、ゆるやかな右上がりの直線になります。',
      },
    ],
  },
  {
    id: 'linear-graph-supereasy-intercept',
    title: '一次関数のグラフ（超かんたん：切片）',
    subject: 'Math',
    grade: 'Middle School',
    description: '2択の超かんたんモードです。',
    questions: [
      {
        id: 'linear-supereasy-intercept-1',
        text: '直線 y = x + 3 のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 3 },
          { id: 'B', slope: 1, intercept: -3 },
        ],
        options: [
          'A: 切片が 3 の直線',
          'B: 切片が -3 の直線',
        ],
        explanation: 'y = x + 3 の切片は 3 です。',
      },
      {
        id: 'linear-supereasy-intercept-2',
        text: '直線 y = x - 2 のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: 1, intercept: 2 },
          { id: 'B', slope: 1, intercept: -2 },
        ],
        options: [
          'A: 切片が 2 の直線',
          'B: 切片が -2 の直線',
        ],
        explanation: 'y = x - 2 の切片は -2 です。',
      },
      {
        id: 'linear-supereasy-intercept-3',
        text: '直線 y = x + 1 のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: 1, intercept: -1 },
          { id: 'B', slope: 1, intercept: 1 },
        ],
        options: [
          'A: 切片が -1 の直線',
          'B: 切片が 1 の直線',
        ],
        explanation: 'y = x + 1 の切片は 1 です。',
      },
      {
        id: 'linear-supereasy-intercept-4',
        text: '直線 y = x - 3 のグラフとして正しいものを選びましょう。',
        answer: 'A',
        graphOptions: [
          { id: 'A', slope: 1, intercept: -3 },
          { id: 'B', slope: 1, intercept: 3 },
        ],
        options: [
          'A: 切片が -3 の直線',
          'B: 切片が 3 の直線',
        ],
        explanation: 'y = x - 3 の切片は -3 です。',
      },
      {
        id: 'linear-supereasy-intercept-5',
        text: '直線 y = x + 2 のグラフとして正しいものを選びましょう。',
        answer: 'B',
        graphOptions: [
          { id: 'A', slope: 1, intercept: -2 },
          { id: 'B', slope: 1, intercept: 2 },
        ],
        options: [
          'A: 切片が -2 の直線',
          'B: 切片が 2 の直線',
        ],
        explanation: 'y = x + 2 の切片は 2 です。',
      },
    ],
  },
  ...linearPairQuizzes,
];

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function readStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function mergeGraphOptions(quiz: Quiz): Quiz {
  const fallback = initialQuizzes.find((item) => item.id === quiz.id);
  if (!fallback) return quiz;

  return {
    ...quiz,
    questions: quiz.questions.map((question) => {
      const fallbackQuestion = fallback.questions.find((item) => item.id === question.id);
      return question.graphOptions?.length || !fallbackQuestion?.graphOptions
        ? question
        : { ...question, graphOptions: fallbackQuestion.graphOptions, options: fallbackQuestion.options ?? question.options };
    }),
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiPath(path), init);
  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // Keep the status-based fallback.
    }
    throw new Error(message);
  }
  return response.json();
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  try {
    const quizzes = await fetchJson<Quiz[]>('/api/quizzes');
    return quizzes.map(mergeGraphOptions);
  } catch {
    const saved = readStorage<Quiz[]>(STORAGE_KEY, []);
    if (saved.length === 0) {
      writeStorage(STORAGE_KEY, initialQuizzes);
      return initialQuizzes;
    }
    return saved.filter((quiz) => !RETIRED_QUIZ_IDS.has(quiz.id)).map(mergeGraphOptions);
  }
}

export async function fetchQuizById(id: string): Promise<Quiz | undefined> {
  try {
    return mergeGraphOptions(await fetchJson<Quiz>(`/api/quizzes/${id}`));
  } catch {
    const quizzes = await fetchQuizzes();
    return quizzes.find((quiz) => quiz.id === id);
  }
}

export async function saveProgress(record: ProgressRecord): Promise<SavedProgress> {
  try {
    return await fetchJson<SavedProgress>('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(record),
    });
  } catch {
    const progress = readStorage<ProgressRecord[]>(PROGRESS_KEY, []);
    const index = progress.findIndex((item) => item.quizId === record.quizId);
    if (index >= 0) {
      progress[index] = record;
    } else {
      progress.push(record);
    }
    writeStorage(PROGRESS_KEY, progress);
    return record;
  }
}

export async function fetchProgress(child?: string): Promise<ProgressRecord[]> {
  // 端末に残っているのはこの端末で遊んだ本人の記録なので、子供の記録を見るときは使わずにエラーを返す。
  if (child) {
    return fetchJson<ProgressRecord[]>(`/api/progress${childQuery(child)}`, {
      headers: getAuthHeaders(),
    });
  }
  try {
    return await fetchJson<ProgressRecord[]>('/api/progress', {
      headers: getAuthHeaders(),
    });
  } catch {
    return readStorage<ProgressRecord[]>(PROGRESS_KEY, []);
  }
}

export async function createQuiz(quiz: Quiz): Promise<Quiz> {
  try {
    return await fetchJson<Quiz>('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
  } catch {
    const quizzes = await fetchQuizzes();
    const next = [...quizzes.filter((item) => item.id !== quiz.id), quiz];
    writeStorage(STORAGE_KEY, next);
    return quiz;
  }
}

export async function filterQuizzes(subject?: Subject, grade?: Grade): Promise<Quiz[]> {
  const quizzes = await fetchQuizzes();
  return quizzes.filter((quiz) => {
    if (subject && quiz.subject !== subject) return false;
    if (grade && quiz.grade !== grade) return false;
    return true;
  });
}
