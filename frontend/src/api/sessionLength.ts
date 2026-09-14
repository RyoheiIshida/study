import { SessionLength } from '../types';
import { TOKEN_KEY } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(apiPath(path), { headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

/** そのクイズの、次のプレイで出す問題数。通信できないときは null（最初の段階の問題数で遊ぶ）。 */
export async function fetchSessionLength(quizId: string): Promise<SessionLength | null> {
  try {
    return await fetchJson<SessionLength>(`/api/progress/session-lengths/${encodeURIComponent(quizId)}`);
  } catch {
    return null;
  }
}

/** クイズ id ごとの、次のプレイで出す問題数。通信できないときは空。 */
export async function fetchSessionLengths(): Promise<Record<string, SessionLength>> {
  try {
    return await fetchJson<Record<string, SessionLength>>('/api/progress/session-lengths');
  } catch {
    return {};
  }
}
