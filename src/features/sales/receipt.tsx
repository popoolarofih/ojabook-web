'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowsClockwise, CheckCircle, Printer, ShareNetwork, Warning, WifiSlash } from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonStyles } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { Badge, Card, ErrorState, ListSkeleton } from '@/components/ui/surface';
import { useActiveMembership, useCan, useSession } from '@/features/auth/session-store';
import { formatDateTime } from '@/features/shared/format';
import { api, errorMessage, unwrap, type Schemas } from '@/lib/api/client';
import { db, type LocalOp } from '@/lib/offline/db';
import { dec, formatNgn, formatQty, lineTotalKobo } from '@/lib/money';

type Sale = Schemas['SaleDto'];

interface View {
  receiptNumber: string | null;
  status: 'COMPLETED' | 'REVERSED' | 'LOCAL';
  occurredAt: string;
  customer: string | null;
  items: { name: string; unit: string; quantity: string; unitPriceKobo: number; discountKobo: number; totalKobo: number }[];
  payments: { method: string; status: string; amountKobo: number; verified: boolean }[];
  totalKobo: number;
  discountKobo: number;
  creditKobo: number;
  outstandingKobo: number;
  dueDate: string | null;
  reversalReason: string | null;
}

function fromServer(s: Sale): View {
  return {
    receiptNumber: s.receiptNumber, status: s.status, occurredAt: s.occurredAt, customer: s.customer?.name ?? null,
    items: s.items.map((i) => ({ name: i.productName, unit: i.unitName, quantity: i.quantity, unitPriceKobo: i.unitPriceKobo, discountKobo: i.discountKobo, totalKobo: i.lineTotalKobo })),
    payments: s.payments.map((p) => ({ method: p.method, status: p.status, amountKobo: p.amountKobo, verified: p.verified })),
    totalKobo: s.totalKobo, discountKobo: s.discountKobo, creditKobo: s.creditKobo, outstandingKobo: s.outstandingKobo, dueDate: s.dueDate, reversalReason: s.reversal?.reason ?? null,
  };
}

/** What the sale will look like, built from the local record while it waits to sync. */
async function fromLocal(op: LocalOp): Promise<View> {
  const p = op.payload as Schemas['CreateSaleDto'];
  const products = await db.products.bulkGet(p.items.map((i) => i.productId));
  const customer = p.customerId ? await db.customers.get(p.customerId) : undefined;
  const items = p.items.map((i, idx) => {
    const prod = products[idx];
    const conv = prod?.conversions.find((c) => c.id === i.unitId);
    const list = conv ? (conv.sellingPriceKobo ?? dec(prod!.sellingPriceKobo).mul(conv.factor).toDecimalPlaces(0).toNumber()) : (prod?.sellingPriceKobo ?? 0);
    const price = i.unitPriceKobo ?? list;
    return { name: prod?.name ?? 'Product', unit: conv?.name ?? prod?.baseUnit ?? '', quantity: i.quantity, unitPriceKobo: price, discountKobo: i.discountKobo ?? 0, totalKobo: lineTotalKobo(i.quantity, price) - (i.discountKobo ?? 0) };
  });
  const total = items.reduce((s, i) => s + i.totalKobo, 0);
  return {
    receiptNumber: null, status: 'LOCAL', occurredAt: p.occurredAt ?? op.clientCreatedAt, customer: customer?.name ?? null, items,
    payments: p.payments.map((x) => ({ method: x.method, status: x.method === 'CASH' ? 'PAID' : 'PENDING', amountKobo: x.amountKobo, verified: x.method === 'CASH' })),
    totalKobo: total, discountKobo: items.reduce((s, i) => s + i.discountKobo, 0), creditKobo: p.payments.find((x) => x.method === 'CREDIT')?.amountKobo ?? 0,
    outstandingKobo: p.payments.find((x) => x.method === 'CREDIT')?.amountKobo ?? 0, dueDate: p.dueDate ?? null, reversalReason: null,
  };
}

const methodLabel = (m: string) => (m === 'CASH' ? 'Cash' : m === 'TRANSFER' ? 'Bank transfer' : m === 'CREDIT' ? 'Credit' : m);

function SyncBanner({ op }: { op: LocalOp }) {
  const map: Record<string, { icon: typeof CheckCircle; text: string; tone: string }> = {
    LOCAL_PENDING: { icon: WifiSlash, text: 'Saved on this device. Waiting to sync.', tone: 'bg-warning-tint text-warning-ink' },
    FAILED_RETRYABLE: { icon: WifiSlash, text: 'Saved on this device. Sync will retry shortly.', tone: 'bg-warning-tint text-warning-ink' },
    SYNCING: { icon: ArrowsClockwise, text: 'Syncing now.', tone: 'bg-royal-tint text-royal-deep' },
    SYNCED: { icon: CheckCircle, text: 'Saved and synced.', tone: 'bg-success-tint text-success-ink' },
    CONFLICT: { icon: Warning, text: op.message ?? 'This sale needs your attention.', tone: 'bg-danger-tint text-danger' },
    FAILED_FINAL: { icon: Warning, text: op.message ?? 'The server could not accept this sale.', tone: 'bg-danger-tint text-danger' },
    DISMISSED: { icon: Warning, text: 'This sale was dismissed and is not in your records.', tone: 'bg-soft text-muted' },
  };
  const s = map[op.status] ?? map.LOCAL_PENDING;
  const attention = op.status === 'CONFLICT' || op.status === 'FAILED_FINAL';
  return (
    <div role="status" className={`body-5 flex flex-wrap items-center gap-2 rounded-2xl p-4 ${s.tone}`}>
      <s.icon size={20} weight="bold" aria-hidden />
      <span>{s.text}</span>
      {attention ? <Link href="/app/sync" className="button-sm rounded-lg border border-current px-3 py-1 underline">Review and decide</Link> : null}
    </div>
  );
}

export function ReceiptScreen({ id }: { id: string }) {
  const qc = useQueryClient();
  const tz = useActiveMembership()?.timezone;
  const businessName = useActiveMembership()?.businessName ?? '';
  const businessId = useSession((s) => s.activeBusinessId);
  const canReverse = useCan('sales.reverse');
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reverseKey] = useState(() => crypto.randomUUID());
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [reversing, setReversing] = useState(false);

  const op = useLiveQuery(async () => (await db.ops.where('entityId').equals(id).first()) ?? null, [id]);
  const syncedSale = op?.status === 'SYNCED' ? (op.result as Sale) : undefined;
  const serverQuery = useQuery({
    queryKey: ['sale', businessId, id],
    queryFn: () => unwrap(api.GET('/api/v1/sales/{id}', { params: { path: { id } } })),
    enabled: op === null || op?.status === 'SYNCED',
    initialData: syncedSale,
    staleTime: 0,
  });
  const local = useLiveQuery(async () => (op && op.status !== 'SYNCED' ? await fromLocal(op) : null), [op?.id, op?.status, op?.attempts]);

  const view: View | null = serverQuery.data ? fromServer(serverQuery.data) : (local ?? null);

  async function reverse() {
    if (reason.trim().length < 3) return setReverseError('Give a short reason. It is kept in the audit trail.');
    setReversing(true);
    setReverseError(null);
    try {
      await unwrap(api.POST('/api/v1/sales/{id}/reversals', { params: { path: { id }, header: { 'Idempotency-Key': reverseKey } }, body: { reason: reason.trim() } }));
      await qc.invalidateQueries();
      setReverseOpen(false);
    } catch (e) {
      setReverseError(errorMessage(e));
    } finally {
      setReversing(false);
    }
  }

  if (!view) {
    if (serverQuery.isError) return <ErrorState message={errorMessage(serverQuery.error)} onRetry={() => serverQuery.refetch()} />;
    return <ListSkeleton rows={4} />;
  }

  const summary = [
    `${businessName} receipt ${view.receiptNumber ?? '(number given when synced)'}`,
    ...view.items.map((i) => `${formatQty(i.quantity)} ${i.unit} ${i.name}: ${formatNgn(i.totalKobo)}`),
    `Total: ${formatNgn(view.totalKobo)}`,
    ...view.payments.map((p) => `${methodLabel(p.method)}: ${formatNgn(p.amountKobo)}${p.verified || p.method === 'CREDIT' ? '' : ' (awaiting verification)'}`),
  ].join('\n');

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Receipt', text: summary });
      else await navigator.clipboard.writeText(summary);
    } catch { /* the person closed the share sheet */ }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      {op ? <div className="no-print"><SyncBanner op={op} /></div> : null}
      <Card className="flex flex-col gap-4 p-6" aria-label="Receipt">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="heading-5 text-ink">{businessName}</h1>
          <p className="title-4 text-muted tabular">{view.receiptNumber ? `Receipt ${view.receiptNumber}` : 'Receipt number is given when this syncs'}</p>
          <p className="caption-2 text-muted">{formatDateTime(view.occurredAt, tz)}</p>
          {view.status === 'REVERSED' ? <Badge tone="red">Reversed: {view.reversalReason}</Badge> : null}
          {view.status === 'LOCAL' ? <Badge tone="orange">Not yet synced</Badge> : null}
        </div>
        {view.customer ? <p className="body-5 text-ink">Customer: {view.customer}</p> : null}
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {view.items.map((i, idx) => (
            <li key={idx} className="flex items-start justify-between gap-3 py-3">
              <div className="flex flex-col"><span className="body-5 text-ink">{i.name}</span><span className="caption-2 text-muted tabular">{formatQty(i.quantity)} {i.unit} at {formatNgn(i.unitPriceKobo)}{i.discountKobo ? `, discount ${formatNgn(i.discountKobo)}` : ''}</span></div>
              <Money kobo={i.totalKobo} className="body-4 text-ink" />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between"><span className="title-2 text-ink">Total</span><Money kobo={view.totalKobo} className="heading-5 text-ink" /></div>
        <ul className="flex flex-col gap-2">
          {view.payments.map((p, idx) => (
            <li key={idx} className="flex items-center justify-between gap-3">
              <span className="body-5 text-muted">{methodLabel(p.method)}{!p.verified && p.status !== 'REVERSED' ? <Badge tone="orange" className="ml-2">Awaiting verification</Badge> : null}</span>
              <Money kobo={p.amountKobo} className="body-5 text-ink" />
            </li>
          ))}
          {view.creditKobo > 0 ? (
            <li className="flex items-center justify-between gap-3"><span className="body-5 text-muted">On credit{view.dueDate ? `, due ${formatDateTime(view.dueDate, tz).split(',')[0]}` : ''}</span><Money kobo={view.creditKobo} className="body-5 text-ink" /></li>
          ) : null}
        </ul>
        {view.creditKobo > 0 && view.status !== 'LOCAL' ? <p className="body-5 text-ink">Still owed: <Money kobo={view.outstandingKobo} className="body-4" /></p> : null}
      </Card>

      <div className="no-print flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => window.print()}><Printer size={20} /> Print</Button>
        <Button variant="secondary" onClick={share}><ShareNetwork size={20} /> Share</Button>
        <Link href="/app/sales/new" className={buttonStyles({ size: 'md' })}>New sale</Link>
        {canReverse && view.status === 'COMPLETED' ? <Button variant="ghost" className="text-danger" onClick={() => setReverseOpen(true)}>Reverse sale</Button> : null}
      </div>

      <Dialog open={reverseOpen} onOpenChange={setReverseOpen} title="Reverse this sale" description="Stock returns at its original cost and the books are corrected. The original record stays visible.">
        <Field label="Reason" error={reverseError ?? undefined}>{(p) => <Textarea {...p} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Customer returned the goods" />}</Field>
        <Button variant="danger" size="lg" block loading={reversing} loadingText="Reversing" onClick={reverse}>Reverse sale</Button>
      </Dialog>
    </div>
  );
}
