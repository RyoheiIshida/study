import { TrophySummary } from '../types';
import { TOKEN_KEY } from './auth';
import { fetchProgress, fetchQuizzes } from './quiz';
import { computeTrophiesFromProgress } from '../utils/trophies';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fallbackTrophySummary(): Promise<TrophySummary> {
  const [records, quizzes] = await Promise.all([fetchProgress(), fetchQuizzes()]);
  const trophies = computeTrophiesFromProgress(records, quizzes);
  return { trophies, count: trophies.length };
}

export async function fetchTrophySummary(): Promise<TrophySummary> {
  try {
    const response = await fetch(apiPath('/api/trophies'), { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch {
    return fallbackTrophySummary();
  }
}
