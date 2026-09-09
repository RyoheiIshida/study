import { LoginSummary } from '../types';
import { TOKEN_KEY } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Marks today as a day the user showed up. Safe to call repeatedly. */
export async function recordLoginDay(): Promise<LoginSummary> {
  const response = await fetch(apiPath('/api/login-days/checkin'), {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchLoginSummary(): Promise<LoginSummary> {
  const response = await fetch(apiPath('/api/login-days'), { headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}
