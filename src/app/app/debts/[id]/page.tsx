'use client';

import { useQuery } from '@tanstack/react-query';
import { Printer, ShareNetwork } from '@phosphor-icons/react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader, Stat } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { RepayDialog } from '@/features/customers/repay-dialog';
import { formatDate } from '@/features/shared/format';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { DateTime } from 'luxon';
import { formatNgn } from '@/lib/money';
import { onSynced } from '@/lib/offline/sync-engine';

export default function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tz = useTimezone();
  const businessId = useSession((s) => s.activeBusinessId);
  const canRepay = useCan('receivables.repay');
  const [repay, setRepay] = useState(false);
  const [from, setFrom] = useState(() => DateTime.now().setZone(tz).minus({ days: 29 }).toISODate()!);
  const [to, setTo] = useState(() => DateTime.now().setZone(tz).toISODate()!);

  const customer = useQuery({ queryKey: ['customer', businessId, id], queryFn: () => unwrap(api.GET('/api/v1/customers/{id}', { params: { path: { id } } })) });
  const open = useQuery({ queryKey: ['receivables', businessId, id], queryFn: () => unwrap(api.GET('/api/v1/receivables', { params: { query: { customerId: id, view: 'open', pageSize: 100 } } })) });
  const statement = useQuery({ queryKey: ['statement', businessId, id, from, to], queryFn: () => unwrap(api.GET('/api/v1/customers/{id}/statement', { params: { path: { id }, query: { from, to } } })), enabled: from <= to });
  useEffect(() => {
    const off = onSynced(() => { void customer.refetch(); void open.refetch(); void statement.refetch(); });
    return () => { off(); };
  }, [customer, open, statement]);

  if (customer.isLoading) return <ListSkeleton rows={3} />;
  if (customer.isError || !customer.data) return <ErrorState message={errorMessage(customer.error)} onRetry={() => customer.refetch()} />;
  const c = customer.data;
  const st = statement.data;

  const statementText = st ? [
    `${st.businessName}: statement for ${st.customer.name}`, `${st.fromDate} to ${st.toDate}`, `Opening balance: ${formatNgn(st.openingBalanceKobo)}`,
    ...st.rows.map((r) => `${formatDate(r.date, tz)} ${r.description} ${r.reference}: ${r.chargedKobo ? `+${formatNgn(r.chargedKobo)}` : `-${formatNgn(r.paidKobo)}`}${r.type === 'PENDING_TRANSFER' ? ' (not yet counted)' : ''}`),
    `Closing balance: ${formatNgn(st.closingBalanceKobo)}`,
  ].join('\n') : '';

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/debts" className="no-print button-sm w-fit rounded-lg px-2 py-1 text-royal transition-oja hover:bg-royal-tint">Back to customers</Link>
      <PageHeader title={c.name} subtitle={c.phone ?? 'No phone number'} actions={canRepay && c.outstandingKobo > 0 ? <Button onClick={() => setRepay(true)}>Record repayment</Button> : undefined} />
      <div className="grid grid-cols-2 gap-3"><Stat label="Owes you" value={<Money kobo={c.outstandingKobo} />} tone={c.outstandingKobo > 0 ? 'warn' : 'default'} /><Stat label="Overdue" value={<Money kobo={c.overdueKobo} />} tone={c.overdueKobo > 0 ? 'warn' : 'default'} /></div>

      <Card className="flex flex-col gap-3">
        <h2 className="title-2 text-ink">Open debts</h2>
        {open.isLoading ? <ListSkeleton rows={2} /> : open.data?.items.length === 0 ? <p className="body-6 text-muted">Nothing owed.</p> : (
          <ul className="divide-y divide-line">
            {open.data?.items.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex flex-col gap-1"><Link href={`/app/sales/receipt?id=${r.saleId}`} className="body-4 tabular text-royal underline">{r.receiptNumber}</Link><span className="caption-2 text-muted">{r.dueDate ? `Due ${formatDate(r.dueDate, tz)}` : 'No due date'}</span>{r.isOverdue ? <Badge tone="orange">{r.daysOverdue} days overdue</Badge> : null}</div>
                <div className="flex flex-col items-end"><Money kobo={r.outstandingKobo} className="body-4" /><span className="caption-2 text-muted tabular">of <Money kobo={r.originalKobo} /></span></div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="title-2 text-ink">Statement</h2>
        <div className="no-print grid max-w-md grid-cols-2 gap-3">
          <Field label="From">{(p) => <Input {...p} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
          <Field label="To">{(p) => <Input {...p} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
        </div>
        {statement.isLoading ? <ListSkeleton rows={3} /> : statement.isError ? <ErrorState message={errorMessage(statement.error)} onRetry={() => statement.refetch()} /> : st ? (
          <div className="flex flex-col gap-3">
            <p className="body-5 text-muted">{st.businessName}, {st.customer.name}, {formatDate(st.fromDate, tz)} to {formatDate(st.toDate, tz)}</p>
            <div className="flex justify-between"><span className="body-5 text-muted">Opening balance</span><Money kobo={st.openingBalanceKobo} className="body-4" /></div>
            {st.rows.length === 0 ? <p className="body-6 text-muted">No activity in this period.</p> : (
              <div className="overflow-x-auto"><table className="w-full min-w-96 text-left">
                <thead><tr className="caption-3 text-muted"><th className="py-2">Date</th><th>Details</th><th className="text-right">Charged</th><th className="text-right">Paid</th><th className="text-right">Balance</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {st.rows.map((r, i) => (
                    <tr key={i} className="body-6 tabular"><td className="py-2">{formatDate(r.date, tz)}</td><td>{r.description} {r.reference}{r.type === 'PENDING_TRANSFER' ? <Badge tone="orange" className="ml-1">Awaiting verification</Badge> : null}</td><td className="text-right">{r.chargedKobo ? formatNgn(r.chargedKobo) : ''}</td><td className="text-right">{r.paidKobo ? formatNgn(r.paidKobo) : ''}</td><td className="text-right">{formatNgn(r.balanceKobo)}</td></tr>
                  ))}
                </tbody>
              </table></div>
            )}
            <div className="flex justify-between border-t border-line pt-3"><span className="title-3 text-ink">Closing balance</span><Money kobo={st.closingBalanceKobo} className="heading-6" /></div>
            <div className="no-print flex gap-2">
              <Button variant="secondary" onClick={() => window.print()}><Printer size={20} /> Print</Button>
              <Button variant="secondary" onClick={async () => { try { if (navigator.share) await navigator.share({ title: 'Statement', text: statementText }); else await navigator.clipboard.writeText(statementText); } catch { /* closed */ } }}><ShareNetwork size={20} /> Share</Button>
            </div>
          </div>
        ) : null}
      </Card>
      {repay ? <RepayDialog customerId={id} customerName={c.name} outstandingKobo={c.outstandingKobo} onClose={() => setRepay(false)} /> : null}
    </div>
  );
}
