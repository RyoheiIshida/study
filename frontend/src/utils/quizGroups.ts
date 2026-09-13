import { Grade, Subject } from '../types';
import { MAX_SESSION_QUESTIONS } from './shuffle';

export interface QuizGroupMember {
  quizId: string;
  /** 回答記録に保存され、分析画面の系列名にもなる。過去の記録とつながらなくなるので変えない。 */
  difficultyLabel: string;
  order: number;
  /** 難易度選択画面でどのタブに並べるか。QuizGroup.tracks の id。 */
  track: string;
  /** 難易度選択画面の行に出す短い名前。タブ名（「傾き」など）はくり返さない。 */
  name: string;
  /**
   * ロングの段階か。ロングは長く続けて解くこと自体が難しさなので、
   * ほかのクイズのように15問（MAX_SESSION_QUESTIONS）で打ち切らず、全問を出す。
   */
  isLong?: boolean;
}

/** 難易度選択画面のタブ。何に注目して練習するかで問題を分ける。 */
export interface QuizTrack {
  id: string;
  title: string;
  description: string;
}

export interface QuizGroup {
  id: string;
  title: string;
  subject: Subject;
  grade: Grade;
  description: string;
  tracks: QuizTrack[];
  members: QuizGroupMember[];
}

export const quizGroups: QuizGroup[] = [
  {
    id: 'linear-function',
    title: '一次関数のグラフ',
    subject: 'Math',
    grade: 'Middle School',
    description: '式から傾きと切片を読み取り、対応するグラフを選ぶ問題です。難易度を選んで挑戦しましょう。',
    tracks: [
      {
        id: 'slope',
        title: '傾き',
        description: '切片は 0 のまま、傾きだけがちがう直線を見分けます。右上がりか右下がりか、どれくらい急かに注目しましょう。',
      },
      {
        id: 'intercept',
        title: '切片',
        description: '傾きは 1 のまま、切片だけがちがう直線を見分けます。y 軸と交わる目盛りに注目しましょう。',
      },
      {
        id: 'both',
        title: '両方',
        description: '傾きと切片の両方を式から読み取ります。傾きと切片のタブを練習してから挑戦しましょう。',
      },
    ],
    // 各タブの中は「2本だけを見比べる2択 → いろいろな数の2択 → 2択をぜんぶ混ぜたロング → 4択」の順に並べる。
    // ロングは短い2択より難しく、4択の手前の仕上げに当たる。
    // 段階ごとの報酬（★の数）は backend/src/lib/difficulty.ts で決めている。段階を足したら向こうも更新すること。
    members: [
      { quizId: 'linear-graph-pair-slope-1-half', difficultyLabel: '傾き 1と1/2', order: 1, track: 'slope', name: '1 と 1/2' },
      { quizId: 'linear-graph-pair-slope-1-2', difficultyLabel: '傾き 1と2', order: 2, track: 'slope', name: '1 と 2' },
      { quizId: 'linear-graph-pair-slope-1-m1', difficultyLabel: '傾き 1と-1', order: 3, track: 'slope', name: '1 と -1' },
      { quizId: 'linear-graph-pair-slope-2-m2', difficultyLabel: '傾き 2と-2', order: 4, track: 'slope', name: '2 と -2' },
      { quizId: 'linear-graph-supereasy-slope', difficultyLabel: '超かんたん1', order: 5, track: 'slope', name: '＋か－か' },
      { quizId: 'linear-graph-pair-long-slope', difficultyLabel: '傾き ロング', order: 6, track: 'slope', name: 'ロング（ぜんぶ混ぜる）', isLong: true },
      { quizId: 'linear-graph-easy-intercept0', difficultyLabel: 'かんたん1', order: 7, track: 'slope', name: '4本から選ぶ' },
      { quizId: 'linear-graph-pair-intercept-1-2', difficultyLabel: '切片 1と2', order: 8, track: 'intercept', name: '1 と 2' },
      { quizId: 'linear-graph-pair-intercept-1-3', difficultyLabel: '切片 1と3', order: 9, track: 'intercept', name: '1 と 3' },
      { quizId: 'linear-graph-pair-intercept-2-3', difficultyLabel: '切片 2と3', order: 10, track: 'intercept', name: '2 と 3' },
      { quizId: 'linear-graph-pair-intercept-1-m1', difficultyLabel: '切片 1と-1', order: 11, track: 'intercept', name: '1 と -1' },
      { quizId: 'linear-graph-pair-intercept-2-m2', difficultyLabel: '切片 2と-2', order: 12, track: 'intercept', name: '2 と -2' },
      { quizId: 'linear-graph-pair-intercept-3-m3', difficultyLabel: '切片 3と-3', order: 13, track: 'intercept', name: '3 と -3' },
      { quizId: 'linear-graph-supereasy-intercept', difficultyLabel: '超かんたん2', order: 14, track: 'intercept', name: '＋か－か' },
      { quizId: 'linear-graph-pair-long-intercept', difficultyLabel: '切片 ロング', order: 15, track: 'intercept', name: 'ロング（ぜんぶ混ぜる）', isLong: true },
      { quizId: 'linear-graph-easy-slope1', difficultyLabel: 'かんたん2', order: 16, track: 'intercept', name: '4本から選ぶ' },
      { quizId: 'linear-graph-1', difficultyLabel: 'ふつう', order: 17, track: 'both', name: '傾きも切片も' },
    ],
  },
];

export function findGroupByQuizId(quizId: string): QuizGroup | undefined {
  return quizGroups.find((group) => group.members.some((member) => member.quizId === quizId));
}

export function findGroupById(groupId: string): QuizGroup | undefined {
  return quizGroups.find((group) => group.id === groupId);
}

const DEFAULT_DIFFICULTY_LABEL = '通常';

export function getDifficultyLabel(quizId: string): string {
  const group = findGroupByQuizId(quizId);
  const member = group?.members.find((item) => item.quizId === quizId);
  return member?.difficultyLabel ?? DEFAULT_DIFFICULTY_LABEL;
}

/** 1回のプレイで出す問題数の上限。ロングの段階だけは上限なし（全問）。 */
export function getSessionQuestionLimit(quizId: string): number {
  const member = findGroupByQuizId(quizId)?.members.find((item) => item.quizId === quizId);
  return member?.isLong ? Number.POSITIVE_INFINITY : MAX_SESSION_QUESTIONS;
}

export function getDifficultyOrder(difficultyLabel: string): number {
  for (const group of quizGroups) {
    const member = group.members.find((item) => item.difficultyLabel === difficultyLabel);
    if (member) return member.order;
  }
  return Number.MAX_SAFE_INTEGER;
}
