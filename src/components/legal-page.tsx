import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-line px-4 py-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Link href="/" aria-label="OjaBook home"><Logo /></Link>
          <Link href="/" className="button-sm rounded-lg px-3 py-2 text-royal transition-oja hover:bg-royal-tint">Back to home</Link>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 md:px-8">
        <div role="note" className="body-5 rounded-2xl border border-warning-ink bg-warning-tint p-4 text-warning-ink">
          This is a draft written for the product team. It has not been reviewed by a lawyer. Items in double curly brackets are not decided yet and must be filled in before launch.
        </div>
        <h1 className="heading-3 text-ink">{title}</h1>
        <p className="caption-2 text-muted">Last updated {updated}</p>
        <div className="flex flex-col gap-6 [&_h2]:heading-6 [&_h2]:text-ink [&_p]:body-3 [&_p]:text-muted [&_li]:body-3 [&_li]:text-muted [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6 [&_ul]:list-disc">{children}</div>
      </main>
    </div>
  );
}
