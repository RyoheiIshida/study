import { TrophySummary } from '../types';
import { TOKEN_KEY } from './auth';
import { childQuery } from './childQuery';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchTrophySummary(child?: string): Promise<TrophySummary> {
  const response = await fetch(apiPath(`/api/trophies${childQuery(child)}`), { headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}
