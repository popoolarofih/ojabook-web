'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Money } from '@/components/ui/money';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader, Stat } from '@/components/ui/surface';
import { useActiveMembership, useSession } from '@/features/auth/session-store';
import { formatDate } from '@/features/shared/format';
import { RangePicker, rangeQuery, rangeReady, useRange } from '@/features/shared/range';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { formatNgn, formatQty } from '@/lib/money';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'sales', label: 'Sales', perm: 'reports.sales' }, { id: 'collections', label: 'Collections', perm: 'reports.sales' },
  { id: 'receivables', label: 'Debts', perm: 'receivables.read' }, { id: 'expenses', label: 'Expenses', perm: 'expenses.read' },
  { id: 'profit', label: 'Profit', perm: 'reports.financial' }, { id: 'inventory', label: 'Inventory', perm: 'reports.inventory' },
  { id: 'products', label: 'Products', perm: 'reports.sales' }, { id: 'staff', label: 'Staff', perm: 'reports.staff' },
] as const;
type Tab = (typeof TABS)[number]['id'];

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-3 py-3"><span className={cn('text-muted', strong ? 'title-3 text-ink' : 'body-5')}>{label}</span><span className={cn('tabular', strong ? 'heading-6 text-ink' : 'body-4 text-ink')}>{value}</span></div>;
}

export default function ReportsPage() {
  const m = useActiveMembership();
  const tabs = TABS.filter((t) => m?.permissions.includes(t.perm));
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? 'sales');
  const [range, setRange] = useRange('last7');
  const tz = useTimezone();
  const businessId = useSession((s) => s.activeBusinessId);
  const query = rangeQuery(range);
  const enabled = rangeReady(range) && tabs.some((t) => t.id === tab);

  const q = useQuery({
    queryKey: ['report', tab, businessId, range],
    enabled,
    queryFn: async () => {
      switch (tab) {
        case 'sales': return { tab, d: await unwrap(api.GET('/api/v1/reports/sales', { params: { query } })) } as const;
        case 'collections': return { tab, d: await unwrap(api.GET('/api/v1/reports/collections', { params: { query } })) } as const;
        case 'receivables': return { tab, d: await unwrap(api.GET('/api/v1/reports/receivables', { params: { query } })) } as const;
        case 'expenses': return { tab, d: await unwrap(api.GET('/api/v1/reports/expenses', { params: { query } })) } as const;
        case 'profit': return { tab, d: await unwrap(api.GET('/api/v1/reports/profit', { params: { query } })) } as const;
        case 'inventory': return { tab, d: await unwrap(api.GET('/api/v1/reports/inventory')) } as const;
        case 'products': return { tab, d: await unwrap(api.GET('/api/v1/reports/products', { params: { query } })) } as const;
        case 'staff': return { tab, d: await unwrap(api.GET('/api/v1/reports/staff', { params: { query } })) } as const;
      }
    },
  });
  const r = q.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Reports" subtitle="Figures are calculated on the server from your records" />
      <div role="tablist" aria-label="Report" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)} className={cn('button-sm min-h-10 shrink-0 rounded-full border px-4 transition-oja', tab === t.id ? 'border-charcoal bg-charcoal text-white' : 'border-line bg-white text-ink hover:bg-soft')}>{t.label}</button>
        ))}
      </div>
      {tab !== 'inventory' ? <RangePicker value={range} onChange={setRange} /> : null}
      {q.isLoading ? <ListSkeleton rows={4} /> : q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : r ? (
        <div role="tabpanel" className="flex flex-col gap-4">
          {r.tab === 'sales' ? (<>
            <Card className="divide-y divide-line py-1 md:py-2">
              <Row label="Gross sales" value={<Money kobo={r.d.grossSalesKobo} />} /><Row label="Discounts" value={<Money kobo={-r.d.discountsKobo} />} /><Row label="Reversals" value={<Money kobo={-r.d.reversalsKobo} />} /><Row strong label="Net recognised sales" value={<Money kobo={r.d.netSalesKobo} />} />
            </Card>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Transactions" value={r.d.transactionCount} hint={`${r.d.reversedCount} reversed`} /><Stat label="Paid in cash" value={<Money kobo={r.d.paymentMix.cashKobo} />} /><Stat label="On credit" value={<Money kobo={r.d.paymentMix.creditKobo} />} /></div>
            {r.d.paymentMix.transferKobo > 0 ? <p className="body-6 text-muted">Transfers: {formatNgn(r.d.paymentMix.transferKobo)} entered, awaiting verification.</p> : null}
          </>) : null}
          {r.tab === 'collections' ? (
            <Card className="divide-y divide-line py-1 md:py-2">
              <Row label="Cash from sales" value={<Money kobo={r.d.cashFromSalesKobo} />} /><Row label="Cash from customer repayments" value={<Money kobo={r.d.cashFromRepaymentsKobo} />} /><Row label="Refunds on reversed sales" value={<Money kobo={-r.d.refundsKobo} />} /><Row strong label="Net collected" value={<Money kobo={r.d.netCollectedKobo} />} />
              <Row label="Transfers awaiting verification" value={<Money kobo={r.d.pendingTransfersKobo} />} /><Row label={`Repayment transfers awaiting verification (${r.d.pendingRepayments.count})`} value={<Money kobo={r.d.pendingRepayments.amountKobo} />} />
            </Card>
          ) : null}
          {r.tab === 'receivables' ? (<>
            <div className="grid grid-cols-2 gap-3"><Stat label="Owed to you" value={<Money kobo={r.d.totalOutstandingKobo} />} /><Stat label="Overdue" value={<Money kobo={r.d.overdueKobo} />} tone={r.d.overdueKobo > 0 ? 'warn' : 'default'} /></div>
            <Card className="divide-y divide-line py-1 md:py-2"><p className="caption-2 pb-2 text-muted">Ageing is by due date, or by sale date when no due date is set.</p>
              <Row label="Not yet due" value={<Money kobo={r.d.buckets.current} />} /><Row label="No due date" value={<Money kobo={r.d.buckets.noDueDate} />} /><Row label="1 to 30 days overdue" value={<Money kobo={r.d.buckets.days1to30} />} /><Row label="31 to 60 days overdue" value={<Money kobo={r.d.buckets.days31to60} />} /><Row label="61 to 90 days overdue" value={<Money kobo={r.d.buckets.days61to90} />} /><Row label="Over 90 days overdue" value={<Money kobo={r.d.buckets.days90plus} />} />
            </Card>
            <Card className="flex flex-col gap-2"><h2 className="title-3 text-ink">By customer</h2><ul className="divide-y divide-line">{r.d.customers.map((c) => <li key={c.customerId} className="flex justify-between py-3"><span className="body-5 text-ink">{c.name}<span className="caption-2 block text-muted">{c.openInvoices} open{c.oldestDueDate ? `, oldest due ${formatDate(c.oldestDueDate, tz)}` : ''}</span></span><Money kobo={c.outstandingKobo} className="body-4" /></li>)}{r.d.customers.length === 0 ? <li className="body-6 py-3 text-muted">Nobody owes you anything.</li> : null}</ul></Card>
            <p className="body-6 text-muted">Repayments received in this period: {formatNgn(r.d.repaymentsInPeriodKobo)}</p>
          </>) : null}
          {r.tab === 'expenses' ? (<>
            <Stat label="Total expenses" value={<Money kobo={r.d.totalKobo} />} hint={`${r.d.count} expense${r.d.count === 1 ? '' : 's'}`} />
            <Card className="flex flex-col gap-2"><h2 className="title-3 text-ink">By category</h2><ul className="divide-y divide-line">{r.d.byCategory.map((c) => <li key={c.name} className="flex justify-between py-3"><span className="body-5 text-ink">{c.name}</span><Money kobo={c.totalKobo} className="body-4" /></li>)}{r.d.byCategory.length === 0 ? <li className="body-6 py-3 text-muted">No expenses in this period.</li> : null}</ul></Card>
          </>) : null}
          {r.tab === 'profit' ? (<>
            <Card className="divide-y divide-line py-1 md:py-2">
              <Row label="Revenue" value={<Money kobo={r.d.revenueKobo} />} /><Row label="Cost of goods sold" value={<Money kobo={-r.d.cogsKobo} />} /><Row strong label="Gross profit" value={<Money kobo={r.d.grossProfitKobo} />} />
              <Row label="Operating expenses" value={<Money kobo={-r.d.operatingExpensesKobo} />} /><Row label="Stock written off" value={<Money kobo={-r.d.stockAdjustmentsKobo} />} /><Row strong label="Net operating profit" value={<Money kobo={r.d.netOperatingProfitKobo} />} />
            </Card>
            <p className="body-6 text-muted">{r.d.note}</p>
          </>) : null}
          {r.tab === 'inventory' ? (<>
            <div className="grid grid-cols-2 gap-3"><Stat label="Products" value={r.d.items.length} />{r.d.totalValueKobo !== undefined ? <Stat label="Stock value" value={<Money kobo={r.d.totalValueKobo} />} /> : <Stat label="Low stock" value={r.d.lowStockCount} />}</div>
            <Card className="p-0 md:p-0"><ul className="divide-y divide-line">{r.d.items.map((i) => <li key={i.productId} className="flex items-center justify-between gap-3 p-4"><span className="body-5 text-ink">{i.name}{i.isLowStock ? <Badge tone="orange" className="ml-2">Low stock</Badge> : null}</span><span className="flex flex-col items-end"><span className="body-4 tabular">{formatQty(i.quantity)} {i.baseUnit}</span>{i.valueKobo !== undefined ? <Money kobo={i.valueKobo} className="caption-2 text-muted" /> : null}</span></li>)}</ul></Card>
          </>) : null}
          {r.tab === 'products' ? (
            <Card className="p-0 md:p-0"><ul className="divide-y divide-line">{r.d.items.map((i) => <li key={i.productId} className="flex items-center justify-between gap-3 p-4"><span className="flex flex-col"><span className="body-5 text-ink">{i.name}</span><span className="caption-2 text-muted tabular">{formatQty(i.unitsSold)} units sold</span></span><span className="flex flex-col items-end"><Money kobo={i.salesKobo} className="body-4" />{i.grossProfitKobo !== undefined ? <span className="caption-2 text-muted tabular">Profit {formatNgn(i.grossProfitKobo)}</span> : null}</span></li>)}{r.d.items.length === 0 ? <li className="body-6 p-4 text-muted">Nothing sold in this period.</li> : null}</ul></Card>
          ) : null}
          {r.tab === 'staff' ? (
            <Card className="p-0 md:p-0"><ul className="divide-y divide-line">{r.d.items.map((i) => <li key={i.userId} className="flex items-center justify-between gap-3 p-4"><span className="flex flex-col"><span className="body-5 text-ink">{i.name ?? i.phone}</span><span className="caption-2 text-muted">{i.salesCount} sale{i.salesCount === 1 ? '' : 's'}</span></span><Money kobo={i.salesKobo} className="body-4" /></li>)}{r.d.items.length === 0 ? <li className="body-6 p-4 text-muted">No sales in this period.</li> : null}</ul></Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
