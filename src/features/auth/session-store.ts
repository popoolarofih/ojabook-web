'use client';

import { create } from 'zustand';
import type { components } from '@/lib/api/schema';

export type Membership = components['schemas']['MembershipSummary'];
export type UserSummary = components['schemas']['UserSummary'];

const ACTIVE_KEY = 'ojabook.activeBusiness';
const SNAPSHOT_KEY = 'ojabook.sessionSnapshot';

export interface SessionSnapshot { user: UserSummary; memberships: Membership[] }

/**
 * A non secret copy of who is signed in and what they may do. It lets the app open while offline,
 * against the data already on the device. It holds no token and cannot call the server: a real
 * access token still has to be obtained from the HttpOnly cookie once the network is back.
 */
export function readSnapshot(): SessionSnapshot | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
  } catch {
    return null;
  }
}
function writeSnapshot(s: SessionSnapshot | null) {
  try {
    if (s) window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    /* blocked storage: offline restore is simply unavailable */
  }
}

/** Active business is a harmless preference. Tokens are never persisted anywhere. */
function readActive(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
function writeActive(id: string | null) {
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* private mode or blocked storage: the preference simply is not remembered */
  }
}

interface SessionState {
  status: 'loading' | 'authenticated' | 'anonymous';
  /** In memory only. The refresh credential lives in an HttpOnly cookie (guide 6.1). */
  accessToken: string | null;
  user: UserSummary | null;
  memberships: Membership[];
  activeBusinessId: string | null;
  setAccessToken: (token: string) => void;
  setMe: (me: { user: UserSummary; memberships: Membership[] }) => void;
  setActiveBusiness: (id: string) => void;
  clear: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  memberships: [],
  activeBusinessId: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setMe: ({ user, memberships }) => {
    const remembered = readActive();
    const active =
      memberships.find((m) => m.businessId === get().activeBusinessId)?.businessId ??
      memberships.find((m) => m.businessId === remembered)?.businessId ??
      memberships[0]?.businessId ??
      null;
    writeActive(active);
    writeSnapshot({ user, memberships });
    set({ status: 'authenticated', user, memberships, activeBusinessId: active });
  },
  setActiveBusiness: (id) => {
    writeActive(id);
    set({ activeBusinessId: id });
  },
  clear: () => {
    writeActive(null);
    writeSnapshot(null);
    set({ status: 'anonymous', accessToken: null, user: null, memberships: [], activeBusinessId: null });
  },
}));

export const useActiveMembership = (): Membership | undefined =>
  useSession((s) => s.memberships.find((m) => m.businessId === s.activeBusinessId));

/** UI convenience only. The server enforces every permission. */
export function useCan(permission: string): boolean {
  const m = useActiveMembership();
  return !!m?.permissions.includes(permission);
}
