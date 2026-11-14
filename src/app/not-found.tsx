import Link from 'next/link';
import { Logo } from '@/components/logo';
import { buttonStyles } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

/** A branded 404 with a way back (skill B10). */
export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-charcoal px-6 text-center on-dark">
      <Logo tone="light" />
      <p className="caption-3 uppercase tracking-wide text-orange">Error 404</p>
      <h1 className="heading-3 max-w-[680px] text-white">We could not find that page.</h1>
      <p className="body-3 max-w-[680px] text-mist">The link may be old or mistyped. Your records are safe.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonStyles({ variant: 'accent', size: 'lg' })}>Go to the home page</Link>
        <Link href="/app" className={buttonStyles({ variant: 'secondary-dark', size: 'lg' })}>Open the app</Link>
      </div>
    </main>
  );
}
