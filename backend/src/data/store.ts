const quizzesKey = 'backend-study-quizzes';
const progressKey = 'backend-study-progress';

type Question = {
  id: string;
  text: string;
  answer: string;
  explanation?: string;
};

type Quiz = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  questions: Question[];
};

type ProgressRecord = {
  quizId: string;
  completed: number;
  total: number;
  correct: number;
  streak: number;
  lastPlayed: string;
};

const defaultQuizzes: Quiz[] = [
  {
    id: 'small-math-1',
    title: 'たし算チャレンジ',
    subject: '算数',
    grade: '小学校',
    description: '小学校算数の基本的なたし算問題です。',
    questions: [
      { id: 'q1', text: '3 + 5 = ?', answer: '8' },
      { id: 'q2', text: '7 + 2 = ?', answer: '9' },
      { id: 'q3', text: '6 + 4 = ?', answer: '10' },
    ],
  },
  {
    id: 'small-math-2',
    title: 'ひき算レンジャー',
    subject: '算数',
    grade: '小学校',
    description: '小学校のひき算をマスターしよう。',
    questions: [
      { id: 'q4', text: '10 - 3 = ?', answer: '7', explanation: '10から3を引くと7です。' },
      { id: 'q5', text: '14 - 5 = ?', answer: '9', explanation: '14から5を引くと9です。' },
      { id: 'q6', text: '8 - 2 = ?', answer: '6', explanation: '8から2を引くと6です。' },
    ],
  },
  {
    id: 'small-math-3',
    title: 'かけざんマスター',
    subject: '算数',
    grade: '小学校',
    description: '九九を使ってかけざんに挑戦しよう。',
    questions: [
      { id: 'q7', text: '3 × 4 = ?', answer: '12', explanation: '3を4つ分足すと12です。' },
      { id: 'q8', text: '6 × 2 = ?', answer: '12', explanation: '6を2つ分足すと12です。' },
      { id: 'q9', text: '7 × 3 = ?', answer: '21', explanation: '7を3つ分足すと21です。' },
    ],
  },
  {
    id: 'small-math-4',
    title: 'わりざんチャレンジ',
    subject: '算数',
    grade: '小学校',
    description: 'わりざんの問題で答えを選ぼう。',
    questions: [
      { id: 'q10', text: '12 ÷ 3 = ?', answer: '4', explanation: '12を3人で分けると1人あたり4です。' },
      { id: 'q11', text: '15 ÷ 5 = ?', answer: '3', explanation: '15を5人で分けると1人あたり3です。' },
      { id: 'q12', text: '18 ÷ 6 = ?', answer: '3', explanation: '18を6人で分けると1人あたり3です。' },
    ],
  },
];

function readData<T>(key: string, fallback: T): T {
  const text = process.env.NODE_ENV === 'test' ? null : undefined; // avoid blank
  return fallback;
}

export function getQuizzes(): Quiz[] {
  return defaultQuizzes;
}

export function getQuizById(id: string): Quiz | undefined {
  return defaultQuizzes.find((quiz) => quiz.id === id);
}

export function saveQuiz(quiz: Quiz): Quiz {
  defaultQuizzes.push(quiz);
  return quiz;
}

const progressRecords: ProgressRecord[] = [];

export function getProgress(): ProgressRecord[] {
  return progressRecords;
}

export function saveProgressRecord(record: ProgressRecord): ProgressRecord {
  const index = progressRecords.findIndex((item) => item.quizId === record.quizId);
  if (index >= 0) {
    progressRecords[index] = record;
  } else {
    progressRecords.push(record);
  }
  return record;
}
