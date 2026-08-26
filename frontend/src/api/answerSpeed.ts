import { AnswerSpeedRecord, AnswerSpeedTrendPoint } from '../types';
import { TOKEN_KEY } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function saveAnswerSpeedRecords(records: AnswerSpeedRecord[]): Promise<void> {
  if (records.length === 0) return;
  const response = await fetch(apiPath('/api/answer-speed'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ records }),
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
}

export async function fetchAnswerSpeedTrend(): Promise<AnswerSpeedTrendPoint[]> {
  const response = await fetch(apiPath('/api/answer-speed'), { headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}
