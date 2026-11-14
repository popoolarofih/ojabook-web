'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from './session-store';

/** Redirects anonymous visitors to sign in, and signed in users without a business to onboarding. */
export function useRequireAuth({ needBusiness = true }: { needBusiness?: boolean } = {}) {
  const router = useRouter();
  const status = useSession((s) => s.status);
  const hasBusiness = useSession((s) => s.memberships.length > 0);
  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
    else if (status === 'authenticated' && needBusiness && !hasBusiness) router.replace('/onboarding');
  }, [status, hasBusiness, needBusiness, router]);
  return status === 'authenticated' && (!needBusiness || hasBusiness);
}
