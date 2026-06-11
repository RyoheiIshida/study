import { Grade, ProgressRecord, Question, Quiz, Subject } from '../types';

const STORAGE_KEY = 'study-app-quizzes';
const PROGRESS_KEY = 'study-app-progress';

const initialQuizzes: Quiz[] = [
  {
    id: 'small-math-1',
    title: 'たし算チャレンジ',
    subject: '算数',
    grade: '小学校',
    description: '小学校算数の基本的なたし算問題です。',
    questions: [
      { id: 'q1', text: '3 + 5 = ?', answer: '8', options: ['6', '8', '7', '9'] },
      { id: 'q2', text: '7 + 2 = ?', answer: '9', options: ['8', '10', '6', '9'] },
      { id: 'q3', text: '6 + 4 = ?', answer: '10', options: ['11', '8', '10', '9'] },
    ],
  },
  {
    id: 'small-math-2',
    title: 'ひき算レンジャー',
    subject: '算数',
    grade: '小学校',
    description: '小学校のひき算をマスターしよう。',
    questions: [
      { id: 'q4', text: '10 - 3 = ?', answer: '7', options: ['6', '7', '8', '5'] },
      { id: 'q5', text: '14 - 5 = ?', answer: '9', options: ['8', '9', '10', '7'] },
      { id: 'q6', text: '8 - 2 = ?', answer: '6', options: ['7', '6', '5', '4'] },
    ],
  },
  {
    id: 'small-math-3',
    title: 'かけざんマスター',
    subject: '算数',
    grade: '小学校',
    description: '九九を使ってかけざんに挑戦しよう。',
    questions: [
      { id: 'q7', text: '3 × 4 = ?', answer: '12', options: ['12', '11', '9', '10'] },
      { id: 'q8', text: '6 × 2 = ?', answer: '12', options: ['8', '10', '12', '14'] },
      { id: 'q9', text: '7 × 3 = ?', answer: '21', options: ['21', '20', '18', '24'] },
    ],
  },
  {
    id: 'small-math-4',
    title: 'わりざんチャレンジ',
    subject: '算数',
    grade: '小学校',
    description: 'わりざんの問題で答えを選ぼう。',
    questions: [
      { id: 'q10', text: '12 ÷ 3 = ?', answer: '4', options: ['3', '4', '6', '5'] },
      { id: 'q11', text: '15 ÷ 5 = ?', answer: '3', options: ['2', '3', '4', '5'] },
      { id: 'q12', text: '18 ÷ 6 = ?', answer: '3', options: ['2', '3', '4', '6'] },
    ],
  },
];

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

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  try {
    return await fetchJson<Quiz[]>('/api/quizzes');
  } catch {
    const saved = readStorage<Quiz[]>(STORAGE_KEY, []);
    if (saved.length === 0) {
      writeStorage(STORAGE_KEY, initialQuizzes);
      return initialQuizzes;
    }
    return saved;
  }
}

export async function fetchQuizById(id: string): Promise<Quiz | undefined> {
  try {
    return await fetchJson<Quiz>(`/api/quizzes/${id}`);
  } catch {
    const quizzes = await fetchQuizzes();
    return quizzes.find((quiz) => quiz.id === id);
  }
}

export async function saveProgress(record: ProgressRecord): Promise<ProgressRecord> {
  try {
    return await fetchJson<ProgressRecord>('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

export async function fetchProgress(): Promise<ProgressRecord[]> {
  try {
    return await fetchJson<ProgressRecord[]>('/api/progress');
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
    const next = [...quizzes, quiz];
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
