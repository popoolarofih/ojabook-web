'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { refreshMe } from '@/features/auth/bootstrap';
import { useSession } from '@/features/auth/session-store';
import { api, errorMessage, unwrap } from '@/lib/api/client';

function InviteInner() {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const status = useSession((s) => s.status);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true); setError(null);
    try {
      const b = await unwrap(api.POST('/api/v1/invitations/accept', { body: { token } }));
      await refreshMe();
      useSession.getState().setActiveBusiness(b.id);
      router.replace('/app');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <h1 className="heading-5 text-ink">Join a business on OjaBook</h1>
      {!token ? <p role="alert" className="body-5 text-danger">This invitation link is incomplete. Ask for a new one.</p> : status === 'authenticated' ? (
        <>
          <p className="body-6 text-muted">You are signed in. Accept to join. The invitation only works for the phone number it was sent to.</p>
          {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
          <Button size="lg" block loading={busy} loadingText="Joining" onClick={accept}>Accept invitation</Button>
        </>
      ) : status === 'loading' ? <p className="body-6 text-muted">One moment.</p> : (
        <>
          <p className="body-6 text-muted">Sign in with the phone number that received this invitation, then come back to this link.</p>
          <Link href="/login" className="button-lg inline-flex min-h-12 items-center justify-center rounded-lg bg-royal px-4 py-3 text-white">Sign in</Link>
        </>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-soft px-4 py-12">
      <Logo />
      <Suspense fallback={null}><InviteInner /></Suspense>
    </main>
  );
}
