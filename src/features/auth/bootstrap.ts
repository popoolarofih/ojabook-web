'use client';

import { api, refreshSession, unwrap } from '@/lib/api/client';
import { readSnapshot, useSession } from './session-store';

let inflight: Promise<void> | null = null;

async function run(): Promise<void> {
  const result = await refreshSession();
  if (result === 'ok') {
    try {
      useSession.getState().setMe(await unwrap(api.GET('/api/v1/auth/me')));
      const { syncNow } = await import('@/lib/offline/sync-engine');
      void syncNow(); // anything saved while offline goes out now that we have a token
      return;
    } catch {
      /* fall through to the offline snapshot */
    }
  }
  if (result !== 'rejected') {
    // No network (or the server is down): open against what is on this device.
    const snapshot = readSnapshot();
    if (snapshot) return useSession.getState().setMe(snapshot);
  }
  useSession.getState().clear();
}

/** Restore a session from the refresh cookie on page load, or from the device snapshot when offline. */
export function bootstrapSession(): Promise<void> {
  inflight ??= run().finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function refreshMe(): Promise<void> {
  useSession.getState().setMe(await unwrap(api.GET('/api/v1/auth/me')));
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'ojabook-web' },
    });
  } catch {
    /* offline: the cookie expires by itself and the local copy is cleared below */
  }
  const { clearLocalData } = await import('@/lib/offline/db');
  await clearLocalData(); // never leave business data behind on a shared phone
  useSession.getState().clear();
}
