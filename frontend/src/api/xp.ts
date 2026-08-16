import { XpSummary } from '../types';
import { TOKEN_KEY } from './auth';
import { fetchProgress } from './quiz';
import { computeAttemptXp, getLevelProgress } from '../utils/leveling';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fallbackXpSummary(): Promise<XpSummary> {
  const records = await fetchProgress();
  const sorted = [...records].sort(
    (a, b) => new Date(a.lastPlayed).getTime() - new Date(b.lastPlayed).getTime(),
  );

  const dailyMap = new Map<string, number>();
  let totalXp = 0;
  for (const record of sorted) {
    const xp = computeAttemptXp(record);
    totalXp += xp;
    const dateKey = record.lastPlayed.slice(0, 10);
    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + xp);
  }

  let runningCumulative = 0;
  const dailyXp = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, xp]) => {
      runningCumulative += xp;
      return { date, xp, cumulativeXp: runningCumulative };
    });

  return { ...getLevelProgress(totalXp), attemptCount: records.length, dailyXp, levelUps: [] };
}

export async function fetchXpSummary(): Promise<XpSummary> {
  try {
    const response = await fetch(apiPath('/api/xp'), { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch {
    return fallbackXpSummary();
  }
}
