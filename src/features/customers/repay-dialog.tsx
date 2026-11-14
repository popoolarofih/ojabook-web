'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/form';
import { formatNgn, nairaToKobo } from '@/lib/money';
import { enqueueOp, newId } from '@/lib/offline/sync-engine';

/** Records a repayment through the offline queue. The server refuses anything above what is owed. */
export function RepayDialog({ customerId, customerName, outstandingKobo, onClose }: { customerId: string; customerName: string; outstandingKobo: number; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const kobo = nairaToKobo(amount);
    if (kobo === null || kobo <= 0) return setError('Enter the amount in naira, for example 5000.');
    if (kobo > outstandingKobo) return setError(`That is more than the ${formatNgn(outstandingKobo)} owed.`);
    setBusy(true);
    try {
      const id = newId();
      await enqueueOp({
        type: 'repayment.create', entityId: id, amountKobo: kobo,
        payload: { id, customerId, amountKobo: kobo, method, ...(note.trim() ? { note: note.trim() } : {}) },
        summary: `Repayment of ${formatNgn(kobo)} from ${customerName}`,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Repayment from ${customerName}`} description={`Owed now: ${formatNgn(outstandingKobo)}. The oldest debt is paid first.`}>
      <Field label="Amount received (naira)" error={error ?? undefined}>{(p) => <Input {...p} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />}</Field>
      <Field label="How was it paid">{(p) => (<Select {...p} value={method} onChange={(e) => setMethod(e.target.value as 'CASH' | 'TRANSFER')}><option value="CASH">Cash</option><option value="TRANSFER">Bank transfer</option></Select>)}</Field>
      {method === 'TRANSFER' ? <p role="note" className="body-6 rounded-lg bg-warning-tint p-3 text-warning-ink">A transfer is kept as awaiting verification. It does not reduce the debt until it can be confirmed.</p> : null}
      <Field label="Note (optional)">{(p) => <Input {...p} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      <Button size="lg" block loading={busy} loadingText="Saving" onClick={save}>Record repayment</Button>
    </Dialog>
  );
}
