'use client';

import { useEffect, type ReactNode } from 'react';
import { AppShell } from '@/components/app/shell';
import { ListSkeleton } from '@/components/ui/surface';
import { useRequireAuth } from '@/features/auth/use-require-auth';
import { requestBackgroundSync, startSyncEngine } from '@/lib/offline/sync-engine';

export default function AppLayout({ children }: { children: ReactNode }) {
  const ready = useRequireAuth();
  useEffect(() => {
    if (!ready) return;
    void requestBackgroundSync();
    return startSyncEngine();
  }, [ready]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-md p-6" aria-busy>
        <ListSkeleton rows={4} />
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
