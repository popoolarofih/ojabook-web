'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { api, errorMessage, unwrap, type Schemas } from '@/lib/api/client';
import { nairaToKobo, parseQtyInput } from '@/lib/money';
import { refreshLocalCaches } from '@/lib/offline/sync-engine';

type Product = Schemas['ProductDto'];

function useSubmit(onDone: () => void) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One key per dialog session: pressing Save twice, or retrying after a lost reply, cannot post twice.
  const [key] = useState(() => crypto.randomUUID());
  async function run(work: (key: string) => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await work(key);
      await qc.invalidateQueries();
      await refreshLocalCaches();
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { error, setError, busy, run };
}

export function ReceiveStockDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [unitId, setUnitId] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [supplier, setSupplier] = useState('');
  const { error, setError, busy, run } = useSubmit(onClose);
  const unit = product.conversions.find((c) => c.id === unitId)?.name ?? product.baseUnit;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Receive stock: ${product.name}`} description="Record stock you bought. The average cost updates. This is a stock purchase, not an expense.">
      <Field label="Unit">{(p) => (<Select {...p} value={unitId} onChange={(e) => setUnitId(e.target.value)}><option value="">{product.baseUnit}</option>{product.conversions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>)}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Quantity (${unit})`}>{(p) => <Input {...p} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />}</Field>
        <Field label={`Cost of one ${unit} (naira)`}>{(p) => <Input {...p} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />}</Field>
      </div>
      <Field label="Paid by">{(p) => (<Select {...p} value={method} onChange={(e) => setMethod(e.target.value as 'CASH' | 'TRANSFER')}><option value="CASH">Cash</option><option value="TRANSFER">Bank transfer</option></Select>)}</Field>
      <Field label="Supplier (optional)">{(p) => <Input {...p} value={supplier} onChange={(e) => setSupplier(e.target.value)} />}</Field>
      {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
      <Button size="lg" block loading={busy} loadingText="Saving" onClick={() => {
        const q = parseQtyInput(qty); const c = nairaToKobo(cost);
        if (!q) return setError('Enter a quantity, for example 12 or 2.5.');
        if (c === null || c <= 0) return setError('Enter the cost in naira, for example 1200.');
        void run((key) => unwrap(api.POST('/api/v1/stock-receipts', { params: { header: { 'Idempotency-Key': key } }, body: { paymentMethod: method, supplier: supplier.trim() || undefined, lines: [{ productId: product.id, quantity: q, unitId: unitId || undefined, unitCostKobo: c }] } })));
      }}>Save stock</Button>
    </Dialog>
  );
}

const REASONS = [
  { id: 'COUNT_CORRECTION', label: 'Stock count correction', dir: 'both' }, { id: 'DAMAGED', label: 'Damaged', dir: 'OUT' },
  { id: 'EXPIRED', label: 'Expired', dir: 'OUT' }, { id: 'LOST_OR_STOLEN', label: 'Lost or stolen', dir: 'OUT' },
  { id: 'FOUND', label: 'Found stock', dir: 'IN' }, { id: 'OTHER', label: 'Other reason', dir: 'both' },
] as const;

export function AdjustStockDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const [reason, setReason] = useState<(typeof REASONS)[number]['id']>('COUNT_CORRECTION');
  const [direction, setDirection] = useState<'IN' | 'OUT'>('OUT');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const { error, setError, busy, run } = useSubmit(onClose);
  const meta = REASONS.find((r) => r.id === reason)!;
  const dir = meta.dir === 'both' ? direction : meta.dir;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Adjust stock: ${product.name}`} description={`On hand now: ${product.quantity} ${product.baseUnit}. Every adjustment is recorded with your name and reason.`}>
      <Field label="Reason">{(p) => (<Select {...p} value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>{REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</Select>)}</Field>
      {meta.dir === 'both' ? (
        <Field label="Direction">{(p) => (<Select {...p} value={direction} onChange={(e) => setDirection(e.target.value as 'IN' | 'OUT')}><option value="OUT">Take stock out</option><option value="IN">Add stock</option></Select>)}</Field>
      ) : null}
      <Field label={`Quantity (${product.baseUnit})`}>{(p) => <Input {...p} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />}</Field>
      <Field label="Note">{(p) => <Textarea {...p} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened?" />}</Field>
      {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
      <Button size="lg" block loading={busy} loadingText="Saving" onClick={() => {
        const q = parseQtyInput(qty);
        if (!q) return setError('Enter a quantity, for example 3 or 0.5.');
        if (note.trim().length < 3) return setError('Add a short note. It is kept in the audit trail.');
        void run((key) => unwrap(api.POST('/api/v1/stock-adjustments', { params: { header: { 'Idempotency-Key': key } }, body: { productId: product.id, direction: dir, reason, quantity: q, note: note.trim() } })));
      }}>{dir === 'OUT' ? 'Take stock out' : 'Add stock'}</Button>
    </Dialog>
  );
}
