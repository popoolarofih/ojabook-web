'use client';

import { ArrowRight, SignOut } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVisibleNav } from '@/components/app/shell';
import { Card, PageHeader } from '@/components/ui/surface';
import { signOut } from '@/features/auth/bootstrap';

/** The phone's fifth tab: everything that does not fit in the bottom bar. */
export default function MorePage() {
  const nav = useVisibleNav().filter((n) => !n.mobile);
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="More" />
      <Card className="p-0 md:p-0"><ul className="divide-y divide-line">
        {nav.map((n) => (
          <li key={n.href}><Link href={n.href} className="flex min-h-14 items-center justify-between gap-3 px-4 transition-oja hover:bg-soft"><span className="title-3 flex items-center gap-3 text-ink"><n.icon size={24} aria-hidden /> {n.label}</span><ArrowRight size={20} className="text-muted" aria-hidden /></Link></li>
        ))}
        <li><Link href="/app/sync" className="flex min-h-14 items-center justify-between gap-3 px-4 transition-oja hover:bg-soft"><span className="title-3 text-ink">Sync and saved items</span><ArrowRight size={20} className="text-muted" aria-hidden /></Link></li>
      </ul></Card>
      <button type="button" onClick={async () => { await signOut(); router.replace('/'); }} className="title-3 flex min-h-12 items-center gap-3 rounded-lg px-4 text-danger transition-oja hover:bg-danger-tint"><SignOut size={24} aria-hidden /> Sign out</button>
    </div>
  );
}
