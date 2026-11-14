'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Package } from '@phosphor-icons/react';
import { buttonStyles } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { Badge, Card, EmptyState, ErrorState, ListSkeleton, PageHeader, Stat } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { formatQty } from '@/lib/money';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const businessId = useSession((s) => s.activeBusinessId);
  const canWrite = useCan('products.write');
  const [q, setQ] = useState('');
  const [low, setLow] = useState(false);
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ['products', businessId, q, low, page],
    queryFn: () => unwrap(api.GET('/api/v1/products', { params: { query: { q: q || undefined, lowStock: low ? 'true' : undefined, page, pageSize: 25 } } })),
    placeholderData: (p) => p,
  });
  const summary = useQuery({ queryKey: ['inventory-summary', businessId], queryFn: () => unwrap(api.GET('/api/v1/inventory/summary')) });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Inventory" subtitle="What you have, what is running low" actions={canWrite ? <Link href="/app/inventory/new" className={buttonStyles()}>Add product</Link> : undefined} />
      {summary.data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Products" value={summary.data.activeProducts} />
          <Stat label="Low stock" value={summary.data.lowStockCount} tone={summary.data.lowStockCount > 0 ? 'warn' : 'default'} />
          <Stat label="Out of stock" value={summary.data.outOfStockCount} tone={summary.data.outOfStockCount > 0 ? 'warn' : 'default'} />
          {summary.data.stockValueKobo !== undefined ? <Stat label="Stock value" value={<Money kobo={summary.data.stockValueKobo} />} hint="At average cost" /> : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input aria-label="Search products" type="search" placeholder="Search by name, SKU or barcode" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button type="button" aria-pressed={low} onClick={() => { setLow((v) => !v); setPage(1); }} className={cn('button-sm min-h-12 shrink-0 rounded-lg border px-4 transition-oja', low ? 'border-royal bg-royal text-white' : 'border-line bg-white text-ink hover:bg-soft')}>Low stock only</button>
      </div>
      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} /> : list.data && list.data.items.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title={q || low ? 'No product matches' : 'No products yet'} body={q || low ? 'Try a different search or clear the filter.' : 'Add your first product to start selling and tracking stock.'} action={canWrite && !q && !low ? <Link href="/app/inventory/new" className={buttonStyles()}>Add your first product</Link> : undefined} />
      ) : (
        <Card className="p-0 md:p-0">
          <ul className="divide-y divide-line">
            {list.data?.items.map((p) => (
              <li key={p.id}>
                <Link href={`/app/inventory/${p.id}`} className="flex items-center justify-between gap-3 p-4 transition-oja hover:bg-soft">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="body-4 truncate text-ink">{p.name}</span>
                    <span className="caption-2 text-muted"><Money kobo={p.sellingPriceKobo} /> per {p.baseUnit}{p.categoryName ? `, ${p.categoryName}` : ''}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="body-4 tabular text-ink">{formatQty(p.quantity)} {p.baseUnit}</span>
                    {Number(p.quantity) <= 0 ? <Badge tone="red">Out of stock</Badge> : p.isLowStock ? <Badge tone="orange">Low stock</Badge> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {list.data && list.data.total > list.data.pageSize ? (
        <div className="flex items-center justify-between">
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="button-sm rounded-lg border border-line bg-white px-3 py-2 disabled:opacity-50">Previous</button>
          <span className="caption-2 text-muted">Page {page} of {Math.ceil(list.data.total / list.data.pageSize)}</span>
          <button type="button" disabled={page * list.data.pageSize >= list.data.total} onClick={() => setPage((p) => p + 1)} className="button-sm rounded-lg border border-line bg-white px-3 py-2 disabled:opacity-50">Next</button>
        </div>
      ) : null}
    </div>
  );
}
