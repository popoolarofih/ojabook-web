'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { useSession } from '@/features/auth/session-store';
import { db } from '@/lib/offline/db';
import { cacheLocalCustomer, enqueueOp, newId } from '@/lib/offline/sync-engine';
import { cn } from '@/lib/utils';

/** Searches the local customer list, so it works offline. A new customer is queued like any other record. */
export function CustomerPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const businessId = useSession((s) => s.activeBusinessId);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const customers = useLiveQuery(
    async () => (businessId ? (await db.customers.where('businessId').equals(businessId).toArray()).sort((a, b) => a.name.localeCompare(b.name)) : []),
    [businessId],
  );
  const shown = (customers ?? []).filter((c) => !q.trim() || c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone ?? '').includes(q.replace(/\s/g, ''))).slice(0, 6);

  async function addCustomer() {
    setError(null);
    if (name.trim().length < 2) return setError('Enter the customer name.');
    const id = newId();
    const payload: Record<string, unknown> = { id, name: name.trim() };
    if (phone.trim()) payload.phone = phone.trim();
    await cacheLocalCustomer({ id, name: name.trim(), phone: phone.trim() || null });
    await enqueueOp({ type: 'customer.create', entityId: id, payload, summary: `New customer ${name.trim()}` });
    onChange(id);
    setAdding(false);
    setName('');
    setPhone('');
  }

  if (adding) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-line p-4">
        <Field label="Customer name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoFocus />}</Field>
        <Field label="Phone number (optional)" error={error ?? undefined}>{(p) => <Input {...p} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
        <div className="flex gap-2">
          <Button onClick={addCustomer}>Save customer</Button>
          <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Input aria-label="Search customers" placeholder="Search customers by name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="flex flex-col gap-2">
        {shown.map((c) => (
          <li key={c.id}>
            <button type="button" aria-pressed={value === c.id} onClick={() => onChange(value === c.id ? null : c.id)}
              className={cn('flex min-h-12 w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-oja', value === c.id ? 'border-royal bg-royal-tint' : 'border-line bg-white hover:bg-soft')}>
              <span className="body-5 text-ink">{c.name}</span>
              <span className="caption-2 text-muted">{c.phone ?? ''}</span>
            </button>
          </li>
        ))}
        {shown.length === 0 ? <li className="body-6 text-muted">No matching customer.</li> : null}
      </ul>
      <Button variant="secondary" onClick={() => { setName(q); setAdding(true); }}>Add a new customer</Button>
    </div>
  );
}
