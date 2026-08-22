import { PointsSummary } from '../types';
import { TOKEN_KEY } from './auth';
import { fetchProgress } from './quiz';
import { computeAttemptPoints } from '../utils/points';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fallbackPointsSummary(): Promise<PointsSummary> {
  const records = await fetchProgress();
  let totalPoints = 0;
  let totalCorrect = 0;
  for (const record of records) {
    totalPoints += computeAttemptPoints(record);
    totalCorrect += record.correct;
  }

  return {
    totalPoints,
    totalCorrect,
    totalAttempts: records.length,
  };
}

export async function fetchPointsSummary(): Promise<PointsSummary> {
  try {
    const response = await fetch(apiPath('/api/points'), { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch {
    return fallbackPointsSummary();
  }
}
