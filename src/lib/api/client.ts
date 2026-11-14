import createClient from 'openapi-fetch';
import { useSession } from '@/features/auth/session-store';
import type { components, paths } from './schema';

export type Schemas = components['schemas'];
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** The API error envelope: { error: { code, message, details, requestId } } (guide 10.1). */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
  }
  get isNetwork() {
    return this.status === 0;
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.clone().json()) as { error?: { code: string; message: string; details?: unknown; requestId?: string } };
    if (body.error) return new ApiError(body.error.code, body.error.message, res.status, body.error.details, body.error.requestId);
  } catch {
    /* not JSON */
  }
  return new ApiError('HTTP_ERROR', 'Something went wrong. Try again.', res.status);
}

export type RefreshResult = 'ok' | 'rejected' | 'offline';
let refreshing: Promise<RefreshResult> | null = null;

/** Rotate the refresh cookie. One refresh at a time, across tabs too, because tokens are single use. */
export function refreshSession(): Promise<RefreshResult> {
  if (!refreshing) {
    const run = async (): Promise<RefreshResult> => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-Requested-With': 'ojabook-web' },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) return 'rejected';
          return 'offline'; // the server is unwell: keep what is on the device and try again later
        }
        const body = (await res.json()) as { accessToken: string };
        useSession.getState().setAccessToken(body.accessToken);
        return 'ok';
      } catch {
        return 'offline'; // no network: keep the session and try again later
      }
    };
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    refreshing = (locks ? locks.request('ojabook-refresh', run) : run()).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

function attach(req: Request) {
  const { accessToken, activeBusinessId } = useSession.getState();
  if (accessToken) req.headers.set('Authorization', `Bearer ${accessToken}`);
  if (activeBusinessId) req.headers.set('X-Business-Id', activeBusinessId);
}

async function authedFetch(input: Request): Promise<Response> {
  const retryable = input.clone();
  attach(input);
  const res = await fetch(input, { credentials: 'include' });
  if (res.status !== 401 || input.url.includes('/auth/')) return res;
  const refreshed = await refreshSession();
  if (refreshed === 'rejected') useSession.getState().clear();
  if (refreshed !== 'ok') return res;
  attach(retryable);
  return fetch(retryable, { credentials: 'include' });
}

export const api = createClient<paths>({ baseUrl: API_URL, fetch: authedFetch });

type Result<T> = { data?: T; error?: unknown; response: Response };

/** Unwrap an openapi-fetch result into data, or throw a typed ApiError. */
export async function unwrap<T>(call: Promise<Result<T>>): Promise<T> {
  let result: Result<T>;
  try {
    result = await call;
  } catch {
    throw new ApiError('NETWORK', 'You are offline or the server cannot be reached.', 0);
  }
  if (result.response.ok) return result.data as T;
  throw await toApiError(result.response);
}

export const idempotencyHeader = (key: string) => ({ 'Idempotency-Key': key });

export const errorMessage = (e: unknown): string =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Something went wrong. Try again.';
