import { auth } from './firebase';
import { API_BASE } from '../constants/api';
import { getUserTimeZone } from '../utils/dates';

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  status?: number;
  isQuota?: boolean;

  constructor(message: string, status?: number, isQuota?: boolean) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isQuota = isQuota;
  }
}

/**
 * Authenticated API request helper for NeuroSync backend.
 * Automatically attaches Firebase ID token when available,
 * handles timeouts, and normalizes error messages.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 18000, headers = {}, ...rest } = options;

  let token: string | undefined;
  try {
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
  } catch (err) {
    console.warn('Failed to retrieve Firebase ID token:', err);
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timezone': getUserTimeZone(),
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timer);

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || res.statusText };
      }
    }

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      const isQuota = res.status === 429 || /quota|rate limit/i.test(errorMsg);
      throw new ApiError(errorMsg, res.status, isQuota);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection and try again.', 408);
    }
    throw new ApiError(err?.message || 'Network error. Please try again.', 500);
  }
}
