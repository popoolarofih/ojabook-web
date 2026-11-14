'use client';

import { useQuery } from '@tanstack/react-query';
import { Notebook, UserPlus } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { Badge, Card, EmptyState, ErrorState, ListSkeleton, PageHeader, Stat } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { cacheLocalCustomer, enqueueOp, newId, onSynced } from '@/lib/offline/sync-engine';
import { cn } from '@/lib/utils';

export default function DebtsPage() {
  const businessId = useSession((s) => s.activeBusinessId);
  const canWrite = useCan('customers.write');
  const [q, setQ] = useState('');
  const [owing, setOwing] = useState(false);
  const [adding, setAdding] = useState(false);
  const list = useQuery({
    queryKey: ['customers', businessId, q, owing],
    queryFn: () => unwrap(api.GET('/api/v1/customers', { params: { query: { q: q || undefined, hasBalance: owing ? 'true' : undefined, pageSize: 50 } } })),
    placeholderData: (p) => p,
  });
  useEffect(() => {
    const off = onSynced(() => void list.refetch());
    return () => { off(); };
  }, [list]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  async function addCustomer() {
    if (name.trim().length < 2) return setError('Enter the customer name.');
    const id = newId();
    const payload: Record<string, unknown> = { id, name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) };
    await cacheLocalCustomer({ id, name: name.trim(), phone: phone.trim() || null });
    await enqueueOp({ type: 'customer.create', entityId: id, payload, summary: `New customer ${name.trim()}` });
    setAdding(false); setName(''); setPhone(''); setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Customers and Iwe Gbese" subtitle="Who owes you, and how much" actions={canWrite ? <Button onClick={() => setAdding(true)}><UserPlus size={20} /> Add customer</Button> : undefined} />
      {list.data ? <div className="grid grid-cols-2 gap-3"><Stat label="Total owed to you" value={<Money kobo={list.data.totalOutstandingKobo} />} tone={list.data.totalOutstandingKobo > 0 ? 'warn' : 'default'} /><Stat label="Customers" value={list.data.total} /></div> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input aria-label="Search customers" type="search" placeholder="Search by name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" aria-pressed={owing} onClick={() => setOwing((v) => !v)} className={cn('button-sm min-h-12 shrink-0 rounded-lg border px-4 transition-oja', owing ? 'border-royal bg-royal text-white' : 'border-line bg-white text-ink hover:bg-soft')}>Owing only</button>
      </div>
      {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} /> : list.data && list.data.items.length === 0 ? (
        <EmptyState icon={<Notebook size={24} />} title={q || owing ? 'No customer found' : 'No customers yet'} body={q || owing ? 'Try a different search.' : 'Add a customer to sell on credit and keep track of what they owe.'} action={canWrite && !q && !owing ? <Button onClick={() => setAdding(true)}>Add a customer</Button> : undefined} />
      ) : (
        <Card className="p-0 md:p-0">
          <ul className="divide-y divide-line">
            {list.data?.items.map((c) => (
              <li key={c.id}>
                <Link href={`/app/debts/${c.id}`} className="flex items-center justify-between gap-3 p-4 transition-oja hover:bg-soft">
                  <div className="flex flex-col gap-1"><span className="body-4 text-ink">{c.name}</span><span className="caption-2 text-muted">{c.phone ?? 'No phone number'}</span></div>
                  <div className="flex flex-col items-end gap-1">
                    <Money kobo={c.outstandingKobo} className={cn('body-4', c.outstandingKobo > 0 ? 'text-ink' : 'text-muted')} />
                    {c.overdueKobo > 0 ? <Badge tone="orange">Overdue</Badge> : c.outstandingKobo > 0 ? <Badge tone="blue">Owes</Badge> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Dialog open={adding} onOpenChange={setAdding} title="Add a customer" description="Saved on this device first, so it works offline.">
        <Field label="Name" error={error ?? undefined}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoFocus />}</Field>
        <Field label="Phone number (optional)">{(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
        <Button size="lg" block onClick={addCustomer}>Save customer</Button>
      </Dialog>
    </div>
  );
}
