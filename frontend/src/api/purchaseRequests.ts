import { ExchangeRateInfo, PurchaseRequest } from '../types';
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

export async function fetchExchangeRate(): Promise<ExchangeRateInfo> {
  return fetchJson<ExchangeRateInfo>('/api/purchase-requests/rate');
}

export async function fetchPurchaseRequests(): Promise<PurchaseRequest[]> {
  return fetchJson<PurchaseRequest[]>('/api/purchase-requests');
}

export async function createPurchaseRequest(pointsCost: number, memo?: string): Promise<PurchaseRequest> {
  return fetchJson<PurchaseRequest>('/api/purchase-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointsCost, memo }),
  });
}

function postAction(id: number, action: string, body?: unknown): Promise<PurchaseRequest> {
  return fetchJson<PurchaseRequest>(`/api/purchase-requests/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export const approveRequest = (id: number) => postAction(id, 'approve');
export const rejectRequest = (id: number, reason?: string) => postAction(id, 'reject', { reason });
export const handOverRequest = (id: number) => postAction(id, 'hand-over');
export const confirmReceipt = (id: number) => postAction(id, 'confirm-receipt');
export const cancelRequest = (id: number) => postAction(id, 'cancel');
