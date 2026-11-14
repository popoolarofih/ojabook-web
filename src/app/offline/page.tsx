import Link from 'next/link';
import { Logo } from '@/components/logo';
import { buttonStyles } from '@/components/ui/button';

export const metadata = { title: 'You are offline' };

/** Shown by the service worker when a page that was never opened before is requested offline. */
export default function OfflinePage() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-soft px-6 text-center">
      <Logo />
      <h1 className="heading-4 max-w-[680px] text-ink">You are offline</h1>
      <p className="body-3 max-w-[680px] text-muted">
        This page has not been saved on your phone yet. Quick Sale, your products and your customers still work, and everything you record is sent when the network returns.
      </p>
      <Link href="/app/sales/new" className={buttonStyles({ size: 'lg' })}>Open Quick Sale</Link>
    </main>
  );
}
