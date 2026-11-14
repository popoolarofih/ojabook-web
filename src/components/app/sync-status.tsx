'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { ArrowsClockwise, CheckCircle, Warning, WifiSlash } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useSession } from '@/features/auth/session-store';
import { db } from '@/lib/offline/db';
import { syncNow } from '@/lib/offline/sync-engine';
import { cn } from '@/lib/utils';

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Sync state is always an icon plus words, never colour alone (guide 5.6). */
export function SyncStatus({ className }: { className?: string }) {
  const businessId = useSession((s) => s.activeBusinessId);
  const online = useOnline();
  const counts = useLiveQuery(async () => {
    if (!businessId) return null;
    const ops = await db.ops.where('businessId').equals(businessId).toArray();
    const c = { waiting: 0, syncing: 0, attention: 0 };
    for (const o of ops) {
      if (o.status === 'LOCAL_PENDING' || o.status === 'FAILED_RETRYABLE') c.waiting += 1;
      else if (o.status === 'SYNCING') c.syncing += 1;
      else if (o.status === 'CONFLICT' || o.status === 'FAILED_FINAL') c.attention += 1;
    }
    return c;
  }, [businessId]);

  let Icon = CheckCircle;
  let label = 'All saved';
  let tone = 'bg-success-tint text-success-ink';
  if (counts?.attention) {
    Icon = Warning;
    label = `${counts.attention} need${counts.attention === 1 ? 's' : ''} attention`;
    tone = 'bg-danger-tint text-danger';
  } else if (!online) {
    Icon = WifiSlash;
    label = counts?.waiting ? `Offline, ${counts.waiting} saved on this device` : 'Offline';
    tone = 'bg-warning-tint text-warning-ink';
  } else if (counts?.syncing) {
    Icon = ArrowsClockwise;
    label = 'Syncing';
    tone = 'bg-royal-tint text-royal-deep';
  } else if (counts?.waiting) {
    Icon = ArrowsClockwise;
    label = `${counts.waiting} waiting to sync`;
    tone = 'bg-royal-tint text-royal-deep';
  }

  return (
    <Link
      href="/app/sync"
      onClick={() => void syncNow()}
      className={cn('caption-1 inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 transition-oja hover:opacity-80', tone, className)}
      aria-live="polite"
    >
      <Icon size={16} weight="bold" aria-hidden />
      {label}
    </Link>
  );
}
