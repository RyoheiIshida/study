import { Grade, ProgressRecord, Quiz, Subject } from '../types';
import { TOKEN_KEY } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const STORAGE_KEY = 'study-app-quizzes';
const PROGRESS_KEY = 'study-app-progress';

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
    ],
  },
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

export async function fetchProgress(): Promise<ProgressRecord[]> {
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
