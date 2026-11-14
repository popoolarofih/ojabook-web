'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { formatNgn, koboToNairaInput, nairaToKobo } from '@/lib/money';
import { cn } from '@/lib/utils';
import { CustomerPicker } from './customer-picker';

export type PaymentMode = 'CASH' | 'TRANSFER' | 'CREDIT' | 'SPLIT';
export interface PaymentChoice {
  payments: { method: 'CASH' | 'TRANSFER' | 'CREDIT'; amountKobo: number }[];
  customerId: string | null;
  dueDate?: string;
}

const MODES: { id: PaymentMode; label: string }[] = [
  { id: 'CASH', label: 'Cash' },
  { id: 'TRANSFER', label: 'Transfer' },
  { id: 'CREDIT', label: 'Credit' },
  { id: 'SPLIT', label: 'Split' },
];

/**
 * Payment allocations must add up to the total before the sale can be finished (guide 4.3).
 * Transfers are labelled as unverified here and everywhere they appear afterwards.
 */
export function PaymentDialog({ open, onOpenChange, total, customerId, onCustomer, onConfirm, busy }: {
  open: boolean; onOpenChange: (o: boolean) => void; total: number; customerId: string | null;
  onCustomer: (id: string | null) => void; onConfirm: (c: PaymentChoice) => void; busy: boolean;
}) {
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [split, setSplit] = useState({ CASH: '', TRANSFER: '', CREDIT: '' });
  const [dueDate, setDueDate] = useState('');

  const splitKobo = useMemo(() => ({
    CASH: nairaToKobo(split.CASH || '0') ?? NaN,
    TRANSFER: nairaToKobo(split.TRANSFER || '0') ?? NaN,
    CREDIT: nairaToKobo(split.CREDIT || '0') ?? NaN,
  }), [split]);
  const splitSum = splitKobo.CASH + splitKobo.TRANSFER + splitKobo.CREDIT;
  const remaining = total - (Number.isNaN(splitSum) ? 0 : splitSum);

  const payments = useMemo(() => {
    if (mode === 'SPLIT') {
      return (['CASH', 'TRANSFER', 'CREDIT'] as const).filter((m) => splitKobo[m] > 0).map((m) => ({ method: m, amountKobo: splitKobo[m] }));
    }
    return [{ method: mode, amountKobo: total }];
  }, [mode, splitKobo, total]);

  const hasCredit = payments.some((p) => p.method === 'CREDIT');
  let problem: string | null = null;
  if (mode === 'SPLIT' && (Number.isNaN(splitSum) || remaining !== 0)) problem = Number.isNaN(splitSum) ? 'Enter amounts in naira, for example 2500.50.' : remaining > 0 ? `${formatNgn(remaining)} still to allocate.` : `${formatNgn(-remaining)} too much.`;
  else if (hasCredit && !customerId) problem = 'Choose a customer to sell on credit.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Take payment" description="Choose how the customer is paying.">
      <div className="flex items-center justify-between rounded-2xl bg-soft p-4">
        <span className="body-5 text-muted">Total to pay</span>
        <Money kobo={total} className="heading-5 text-ink" />
      </div>
      <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-4 gap-2">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)}
            className={cn('button-sm min-h-12 rounded-lg border px-2 py-2 transition-oja', mode === m.id ? 'border-royal bg-royal text-white' : 'border-line bg-white text-ink hover:bg-soft')}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'TRANSFER' || (mode === 'SPLIT' && splitKobo.TRANSFER > 0) ? (
        <p role="note" className="body-6 rounded-lg bg-warning-tint p-3 text-warning-ink">
          A transfer stays marked as awaiting verification. It is not counted as money collected until it can be confirmed. A screenshot or message is not proof.
        </p>
      ) : null}

      {mode === 'SPLIT' ? (
        <div className="grid gap-3">
          {(['CASH', 'TRANSFER', 'CREDIT'] as const).map((m) => (
            <Field key={m} label={m === 'CASH' ? 'Cash' : m === 'TRANSFER' ? 'Transfer' : 'Credit (customer owes)'}>
              {(p) => (
                <div className="flex gap-2">
                  <Input {...p} inputMode="decimal" placeholder="0" value={split[m]} onChange={(e) => setSplit((s) => ({ ...s, [m]: e.target.value }))} />
                  <Button variant="secondary" aria-label={`Put the rest in ${m.toLowerCase()}`} onClick={() => setSplit((s) => ({ ...s, [m]: koboToNairaInput(Math.max(0, (Number.isNaN(splitKobo[m]) ? 0 : splitKobo[m]) + remaining)) }))}>Rest</Button>
                </div>
              )}
            </Field>
          ))}
        </div>
      ) : null}

      {hasCredit ? (
        <div className="flex flex-col gap-3">
          <h3 className="title-3 text-ink">Who owes this?</h3>
          <CustomerPicker value={customerId} onChange={onCustomer} />
          <Field label="Due date (optional)" hint="Shown on the debt and used to flag it when overdue.">
            {(p) => <Input {...p} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
          </Field>
        </div>
      ) : null}

      {problem ? <p role="alert" className="body-5 text-danger">{problem}</p> : null}
      <Button size="lg" block disabled={problem !== null || total <= 0} loading={busy} loadingText="Saving" onClick={() => onConfirm({ payments, customerId, dueDate: hasCredit && dueDate ? dueDate : undefined })}>
        Finish sale
      </Button>
    </Dialog>
  );
}
