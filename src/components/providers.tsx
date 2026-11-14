'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { bootstrapSession } from '@/features/auth/bootstrap';
import { useSession } from '@/features/auth/session-store';
import { ApiError } from '@/lib/api/client';

/** Marketing and legal pages never need a session, so they skip the session check. */
const needsSession = (path: string) => /^\/(app|login|onboarding|invite)(\/|$)/.test(path);

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            // A client error will not fix itself on retry. Network and server errors may.
            retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
          },
        },
      }),
  );

  useEffect(() => {
    if (needsSession(pathname)) void bootstrapSession();
    // A session opened offline has no token. Get one as soon as the network is back.
    const onOnline = () => {
      if (!useSession.getState().accessToken) void bootstrapSession();
    };
    window.addEventListener('online', onOnline);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    return () => window.removeEventListener('online', onOnline);
    // Navigating between app pages must not re-run this. Only entering or leaving the app matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSession(pathname)]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
