'use client';

import { useQuery } from '@tanstack/react-query';
import { Info } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Money } from '@/components/ui/money';
import { Badge, Card, EmptyState, ErrorState, ListSkeleton, PageHeader, Stat } from '@/components/ui/surface';
import { useCan } from '@/features/auth/session-store';
import { RangePicker, rangeQuery, rangeReady, useRange } from '@/features/shared/range';
import { formatDate, formatDateTime } from '@/features/shared/format';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { formatNgn, formatNgnCompact } from '@/lib/money';
import { buttonStyles } from '@/components/ui/button';
import { useSession } from '@/features/auth/session-store';
import { onSynced } from '@/lib/offline/sync-engine';

export default function OverviewPage() {
  const router = useRouter();
  const canSee = useCan('reports.sales');
  const canProfit = useCan('reports.financial');
  const [range, setRange] = useRange('today');
  const tz = useTimezone();
  const businessId = useSession((s) => s.activeBusinessId);

  useEffect(() => {
    if (!canSee) router.replace('/app/sales/new'); // cashiers start at Quick Sale
  }, [canSee, router]);

  const q = useQuery({
    queryKey: ['overview', businessId, range],
    queryFn: () => unwrap(api.GET('/api/v1/reports/overview', { params: { query: rangeQuery(range) } })),
    enabled: canSee && rangeReady(range),
  });
  useEffect(() => {
    const off = onSynced(() => void q.refetch());
    return () => {
      off();
    };
  }, [q]);

  if (!canSee) return null;
  const d = q.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" subtitle={d ? `${formatDate(d.range.fromDate, tz)}${d.range.fromDate !== d.range.toDate ? ` to ${formatDate(d.range.toDate, tz)}` : ''}` : 'How your business is doing'}
        actions={<Link href="/app/sales/new" className={buttonStyles({ size: 'md' })}>New sale</Link>} />
      <RangePicker value={range} onChange={setRange} />

      {q.isLoading ? <ListSkeleton rows={4} /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : d ? (
        <>
          <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Sales" value={<Money kobo={d.revenueKobo} />} hint={`${d.salesCount} sale${d.salesCount === 1 ? '' : 's'}, credit included`} />
            <Stat label="Collected" value={<Money kobo={d.collectedKobo} />} hint="Money received" />
            <Stat label="Owed to you" value={<Money kobo={d.outstandingDebtKobo} />} hint="Unpaid credit" tone={d.outstandingDebtKobo > 0 ? 'warn' : 'default'} />
            {canProfit && d.netOperatingProfitKobo !== undefined ? (
              <Stat label="Net operating profit" value={<Money kobo={d.netOperatingProfitKobo} />} hint="After costs and expenses" />
            ) : (
              <Stat label="Low stock items" value={d.lowStockCount} hint="At or below reorder level" tone={d.lowStockCount > 0 ? 'warn' : 'default'} />
            )}
          </section>

          {d.pendingTransfersKobo > 0 ? (
            <div role="note" className="body-5 rounded-2xl border border-warning-ink bg-warning-tint p-4 text-warning-ink">
              <Money kobo={d.pendingTransfersKobo} /> in bank transfers is awaiting verification and is not counted as collected.
            </div>
          ) : null}

          {canProfit && d.grossProfitKobo !== undefined ? (
            <section aria-label="Profit" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Cost of goods sold" value={<Money kobo={d.cogsKobo ?? 0} />} hint="Cost of what you sold" />
              <Stat label="Gross profit" value={<Money kobo={d.grossProfitKobo} />} hint="Sales minus cost of goods" />
              <Stat label="Expenses" value={<Money kobo={d.expensesKobo ?? 0} />} hint="Operating expenses" />
              {d.inventoryValueKobo !== undefined ? <Stat label="Stock value" value={<Money kobo={d.inventoryValueKobo} />} hint="At average cost, now" /> : <Stat label="Low stock items" value={d.lowStockCount} tone={d.lowStockCount > 0 ? 'warn' : 'default'} />}
            </section>
          ) : null}

          <Card className="flex flex-col gap-3">
            <h2 className="title-2 text-ink">Sales by day</h2>
            {d.revenueSeries.every((p) => p.valueKobo === 0) ? (
              <EmptyState title="No sales in this period" body="Record a sale and it appears here straight away." action={<Link href="/app/sales/new" className={buttonStyles({ size: 'md' })}>Record a sale</Link>} />
            ) : (
              <div className="h-64 w-full" role="img" aria-label="Bar chart of net sales for each day in the selected period">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.revenueSeries.map((p) => ({ ...p, label: formatDate(p.date, tz).slice(0, -5) }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#dfe2ea" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#626879' }} interval="preserveStartEnd" />
                    <YAxis tickFormatter={(v: number) => formatNgnCompact(v)} tickLine={false} axisLine={false} width={64} tick={{ fontSize: 12, fill: '#626879' }} />
                    <Tooltip formatter={(v) => [formatNgn(Number(v)), 'Sales']} cursor={{ fill: '#e8efff' }} />
                    <Bar dataKey="valueKobo" fill="#105BFF" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col gap-3">
              <h2 className="title-2 text-ink">Best sellers</h2>
              {d.topProducts.length === 0 ? <p className="body-6 text-muted">Nothing sold in this period yet.</p> : (
                <ul className="flex flex-col divide-y divide-line">
                  {d.topProducts.map((p) => (
                    <li key={p.productId} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex flex-col"><span className="body-5 text-ink">{p.name}</span><span className="caption-2 text-muted">{p.units} units</span></div>
                      <Money kobo={p.salesKobo} className="body-4" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="flex flex-col gap-3">
              <h2 className="title-2 text-ink">Recent activity</h2>
              {d.recent.length === 0 ? <p className="body-6 text-muted">Activity appears here as you record it.</p> : (
                <ul className="flex flex-col divide-y divide-line">
                  {d.recent.map((r) => (
                    <li key={`${r.type}-${r.id}`} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="body-5 text-ink">{r.label}</span>
                        <span className="flex items-center gap-2"><Badge tone={r.type === 'SALE' ? 'blue' : r.type === 'EXPENSE' ? 'orange' : 'green'}>{r.type === 'SALE' ? 'Sale' : r.type === 'EXPENSE' ? 'Expense' : 'Repayment'}</Badge><span className="caption-2 text-muted">{formatDateTime(r.at, tz)}</span></span>
                      </div>
                      <Money kobo={r.amountKobo} className="body-4" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <details className="rounded-2xl border border-line bg-white p-4">
            <summary className="title-4 flex cursor-pointer items-center gap-2 text-ink"><Info size={20} aria-hidden /> What do these figures mean?</summary>
            <dl className="mt-3 flex flex-col gap-3">
              {Object.entries(d.definitions).map(([k, v]) => (
                <div key={k}><dt className="title-4 text-ink">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</dt><dd className="body-6 text-muted">{v}</dd></div>
              ))}
            </dl>
          </details>
        </>
      ) : null}
    </div>
  );
}
