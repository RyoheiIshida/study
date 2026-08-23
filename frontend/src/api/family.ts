import { FamilyInfo } from '../types';
import { TOKEN_KEY } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiPath(path), {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
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

export async function fetchFamilyInfo(): Promise<FamilyInfo> {
  return fetchJson<FamilyInfo>('/api/family/me');
}

export async function createInvite(): Promise<{ code: string; expiresAt: string }> {
  return fetchJson('/api/family/invite', { method: 'POST' });
}

export async function linkFamily(code: string): Promise<{ linked: boolean }> {
  return fetchJson('/api/family/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
}
