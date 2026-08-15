import { DailyQuest } from '../types';
import { TOKEN_KEY } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const QUESTS_KEY = 'study-app-daily-quests';

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

export async function fetchDailyQuests(): Promise<DailyQuest[]> {
  try {
    const quests = await fetchJson<DailyQuest[]>('/api/quests/today', {
      headers: getAuthHeaders(),
    });
    writeStorage(QUESTS_KEY, quests);
    return quests;
  } catch {
    return readStorage<DailyQuest[]>(QUESTS_KEY, []);
  }
}
