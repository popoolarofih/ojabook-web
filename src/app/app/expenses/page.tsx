'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { Badge, Card, EmptyState, ErrorState, ListSkeleton, PageHeader, Stat } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { formatDate, todayIso } from '@/features/shared/format';
import { RangePicker, rangeReady, useRange, type RangeValue } from '@/features/shared/range';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { formatNgn, nairaToKobo } from '@/lib/money';
import { enqueueOp, newId, onSynced } from '@/lib/offline/sync-engine';

const toQuery = (r: RangeValue, tz: string) => {
  const t = todayIso(tz);
  if (r.preset === 'custom') return { from: r.from, to: r.to };
  const days = { today: 0, yesterday: 1, last7: 6, last30: 29 }[r.preset];
  const to = r.preset === 'yesterday' ? new Date(Date.parse(t) - 86_400_000).toISOString().slice(0, 10) : t;
  return { from: new Date(Date.parse(to) - days * 86_400_000).toISOString().slice(0, 10), to };
};

export default function ExpensesPage() {
  const qc = useQueryClient();
  const tz = useTimezone();
  const businessId = useSession((s) => s.activeBusinessId);
  const canWrite = useCan('expenses.write');
  const canReverse = useCan('expenses.reverse');
  const [range, setRange] = useRange('last30');
  const [adding, setAdding] = useState(false);
  const [reversing, setReversing] = useState<string | null>(null);

  const list = useQuery({ queryKey: ['expenses', businessId, range], queryFn: () => unwrap(api.GET('/api/v1/expenses', { params: { query: { ...toQuery(range, tz), pageSize: 50 } } })), enabled: rangeReady(range) });
  const categories = useQuery({ queryKey: ['expense-categories', businessId], queryFn: () => unwrap(api.GET('/api/v1/expense-categories')) });
  useEffect(() => {
    const off = onSynced(() => void list.refetch());
    return () => { off(); };
  }, [list]);

  const [f, setF] = useState({ categoryId: '', amount: '', method: 'CASH' as 'CASH' | 'TRANSFER', date: todayIso(tz), description: '' });
  const [error, setError] = useState<string | null>(null);
  async function save() {
    const kobo = nairaToKobo(f.amount);
    if (!f.categoryId) return setError('Choose a category.');
    if (kobo === null || kobo <= 0) return setError('Enter the amount in naira, for example 2500.');
    if (f.description.trim().length < 3) return setError('Describe the expense in a few words.');
    const id = newId();
    await enqueueOp({ type: 'expense.create', entityId: id, amountKobo: kobo, summary: `Expense of ${formatNgn(kobo)}`, payload: { id, categoryId: f.categoryId, amountKobo: kobo, method: f.method, expenseDate: f.date, description: f.description.trim() } });
    setAdding(false); setError(null); setF((s) => ({ ...s, amount: '', description: '' }));
  }

  const [reason, setReason] = useState('');
  const [rKey] = useState(() => crypto.randomUUID());
  async function reverse() {
    if (reason.trim().length < 3) return setError('Give a short reason.');
    try {
      await unwrap(api.POST('/api/v1/expenses/{id}/reversals', { params: { path: { id: reversing! }, header: { 'Idempotency-Key': `${rKey}-${reversing}` } }, body: { reason: reason.trim() } }));
      await qc.invalidateQueries(); setReversing(null); setReason(''); setError(null);
    } catch (e) { setError(errorMessage(e)); }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Expenses" subtitle="Rent, transport, fuel, wages and other costs of running the business" actions={canWrite ? <Button onClick={() => { setError(null); setAdding(true); }}>Add expense</Button> : undefined} />
      <RangePicker value={range} onChange={setRange} />
      {list.data ? <div className="grid grid-cols-2 gap-3"><Stat label="Total in this period" value={<Money kobo={list.data.totalPostedKobo} />} hint="Reversed expenses excluded" /></div> : null}
      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} /> : list.data && list.data.items.length === 0 ? (
        <EmptyState icon={<Receipt size={24} />} title="No expenses in this period" body="Record what you spend so your profit reflects real costs. Buying stock is not an expense. Use Receive stock for that." action={canWrite ? <Button onClick={() => setAdding(true)}>Add an expense</Button> : undefined} />
      ) : (
        <Card className="p-0 md:p-0"><ul className="divide-y divide-line">
          {list.data?.items.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 p-4">
              <div className="flex flex-col gap-1"><span className="body-4 text-ink">{e.categoryName}</span><span className="caption-2 text-muted">{e.description}, {formatDate(e.expenseDate, tz)}, {e.method === 'CASH' ? 'cash' : 'transfer'}</span>
                {e.status === 'REVERSED' ? <Badge tone="red">Reversed: {e.reversalReason}</Badge> : canReverse ? <button type="button" onClick={() => { setError(null); setReversing(e.id); }} className="caption-3 w-fit rounded-lg py-1 text-danger underline">Reverse</button> : null}</div>
              <Money kobo={e.amountKobo} className={e.status === 'REVERSED' ? 'body-4 text-muted line-through' : 'body-4 text-ink'} />
            </li>
          ))}
        </ul></Card>
      )}
      <Dialog open={adding} onOpenChange={setAdding} title="Add an expense" description="Saved on this device first, so it works offline.">
        <Field label="Category">{(p) => (<Select {...p} value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}><option value="">Choose a category</option>{categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>)}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (naira)">{(p) => <Input {...p} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />}</Field>
          <Field label="Paid by">{(p) => (<Select {...p} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as 'CASH' | 'TRANSFER' })}><option value="CASH">Cash</option><option value="TRANSFER">Transfer</option></Select>)}</Field>
        </div>
        <Field label="Date">{(p) => <Input {...p} type="date" max={todayIso(tz)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />}</Field>
        <Field label="What was it for" error={error ?? undefined}>{(p) => <Input {...p} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Diesel for the generator" />}</Field>
        <Button size="lg" block onClick={save}>Save expense</Button>
      </Dialog>
      <Dialog open={reversing !== null} onOpenChange={(o) => !o && setReversing(null)} title="Reverse this expense" description="The original stays in the records. A correcting entry is added with your reason.">
        <Field label="Reason" error={error ?? undefined}>{(p) => <Textarea {...p} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
        <Button variant="danger" size="lg" block onClick={reverse}>Reverse expense</Button>
      </Dialog>
    </div>
  );
}
