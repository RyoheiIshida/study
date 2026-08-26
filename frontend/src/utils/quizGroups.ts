import { Grade, Subject } from '../types';

export interface QuizGroupMember {
  quizId: string;
  difficultyLabel: string;
  order: number;
}

export interface QuizGroup {
  id: string;
  title: string;
  subject: Subject;
  grade: Grade;
  description: string;
  members: QuizGroupMember[];
}

export const quizGroups: QuizGroup[] = [
  {
    id: 'linear-function',
    title: '一次関数のグラフ',
    subject: 'Math',
    grade: 'Middle School',
    description: '式から傾きと切片を読み取り、対応するグラフを選ぶ問題です。難易度を選んで挑戦しましょう。',
    members: [
      { quizId: 'linear-graph-supereasy-slope', difficultyLabel: '超かんたん1', order: 1 },
      { quizId: 'linear-graph-supereasy-intercept', difficultyLabel: '超かんたん2', order: 2 },
      { quizId: 'linear-graph-easy-intercept0', difficultyLabel: 'かんたん1', order: 3 },
      { quizId: 'linear-graph-easy-slope1', difficultyLabel: 'かんたん2', order: 4 },
      { quizId: 'linear-graph-1', difficultyLabel: 'ふつう', order: 5 },
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

export function getDifficultyOrder(difficultyLabel: string): number {
  for (const group of quizGroups) {
    const member = group.members.find((item) => item.difficultyLabel === difficultyLabel);
    if (member) return member.order;
  }
  return Number.MAX_SAFE_INTEGER;
}
