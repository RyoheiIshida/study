import { AuthCredentials, AuthResponse, AuthUser } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
const BASE_URL = `${API_BASE_URL}/api/auth`;
export const TOKEN_KEY = 'study-app-token';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
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

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  return fetchJson<AuthResponse>(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function register(credentials: AuthCredentials): Promise<AuthResponse> {
  return fetchJson<AuthResponse>(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function fetchCurrentUser(token: string): Promise<{ user: AuthUser }> {
  return fetchJson<{ user: AuthUser }>(`${BASE_URL}/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}
