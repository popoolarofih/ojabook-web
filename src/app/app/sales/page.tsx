'use client';

import { useQuery } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonStyles } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { Badge, Card, EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui/surface';
import { useSession } from '@/features/auth/session-store';
import { formatDateTime } from '@/features/shared/format';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { db } from '@/lib/offline/db';
import { onSynced } from '@/lib/offline/sync-engine';

export default function SalesHistoryPage() {
  const tz = useTimezone();
  const businessId = useSession((s) => s.activeBusinessId);
  const [receipt, setReceipt] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ['sales', businessId, receipt, page],
    queryFn: () => unwrap(api.GET('/api/v1/sales', { params: { query: { receipt: receipt || undefined, page, pageSize: 25 } } })),
    placeholderData: (prev) => prev,
  });
  useEffect(() => {
    const off = onSynced(() => void q.refetch());
    return () => { off(); };
  }, [q]);

  // Sales saved on this device that the server has not accepted yet.
  const waiting = useLiveQuery(async () => (businessId ? (await db.ops.where('businessId').equals(businessId).filter((o) => o.type === 'sale.create' && o.status !== 'SYNCED' && o.status !== 'DISMISSED').toArray()) : []), [businessId]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Sales" subtitle="Every sale you have recorded" actions={<Link href="/app/sales/new" className={buttonStyles()}>New sale</Link>} />
      <Input aria-label="Search by receipt number" type="search" placeholder="Search by receipt number, for example R-000042" value={receipt} onChange={(e) => { setReceipt(e.target.value); setPage(1); }} />

      {waiting?.length ? (
        <section aria-label="Waiting to sync" className="flex flex-col gap-2">
          <h2 className="title-3 text-ink">Saved on this device</h2>
          {waiting.map((o) => (
            <Link key={o.id} href={`/app/sales/receipt?id=${o.entityId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 transition-oja hover:border-royal">
              <div className="flex flex-col gap-1"><span className="body-5 text-ink">{o.summary}</span><span className="caption-2 text-muted">{formatDateTime(o.clientCreatedAt, tz)}</span></div>
              <Badge tone={o.status === 'CONFLICT' || o.status === 'FAILED_FINAL' ? 'red' : 'orange'}>{o.status === 'CONFLICT' || o.status === 'FAILED_FINAL' ? 'Needs attention' : 'Waiting to sync'}</Badge>
            </Link>
          ))}
        </section>
      ) : null}

      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : q.data && q.data.items.length === 0 ? (
        <EmptyState title="No sales yet" body={receipt ? 'No receipt matches that number.' : 'Your first sale appears here the moment you record it.'} action={!receipt ? <Link href="/app/sales/new" className={buttonStyles()}>Record a sale</Link> : undefined} />
      ) : (
        <Card className="p-0 md:p-0">
          <ul className="divide-y divide-line">
            {q.data?.items.map((s) => (
              <li key={s.id}>
                <Link href={`/app/sales/receipt?id=${s.id}`} className="flex items-center justify-between gap-3 p-4 transition-oja hover:bg-soft">
                  <div className="flex flex-col gap-1">
                    <span className="body-4 tabular text-ink">{s.receiptNumber}</span>
                    <span className="caption-2 text-muted">{formatDateTime(s.occurredAt, tz)}{s.customer ? `, ${s.customer.name}` : ''}</span>
                    <span className="flex gap-1">
                      {s.status === 'REVERSED' ? <Badge tone="red">Reversed</Badge> : null}
                      {s.creditKobo > 0 ? <Badge tone="blue">Credit</Badge> : null}
                      {s.payments.some((p) => !p.verified && p.status === 'PENDING') ? <Badge tone="orange">Transfer awaiting verification</Badge> : null}
                    </span>
                  </div>
                  <Money kobo={s.totalKobo} className="body-4 text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {q.data && q.data.total > q.data.pageSize ? (
        <div className="flex items-center justify-between">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="button-sm rounded-lg border border-line bg-white px-3 py-2 disabled:opacity-50">Previous</button>
          <span className="caption-2 text-muted">Page {page} of {Math.ceil(q.data.total / q.data.pageSize)}</span>
          <button type="button" disabled={page * q.data.pageSize >= q.data.total} onClick={() => setPage((p) => p + 1)} className="button-sm rounded-lg border border-line bg-white px-3 py-2 disabled:opacity-50">Next</button>
        </div>
      ) : null}
    </div>
  );
}
