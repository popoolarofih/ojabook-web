'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/form';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui/surface';
import { useSession } from '@/features/auth/session-store';
import { formatDateTime } from '@/features/shared/format';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { db, type LocalOp, type OpStatus } from '@/lib/offline/db';
import { refreshLocalCaches, syncNow } from '@/lib/offline/sync-engine';
import { useOnline } from '@/components/app/sync-status';

const LABEL: Record<OpStatus, { text: string; tone: 'neutral' | 'blue' | 'orange' | 'green' | 'red' }> = {
  LOCAL_PENDING: { text: 'Saved on this device', tone: 'orange' }, SYNCING: { text: 'Syncing', tone: 'blue' }, SYNCED: { text: 'Synced', tone: 'green' },
  CONFLICT: { text: 'Needs attention', tone: 'red' }, FAILED_RETRYABLE: { text: 'Will retry', tone: 'orange' }, FAILED_FINAL: { text: 'Rejected', tone: 'red' }, DISMISSED: { text: 'Dismissed', tone: 'neutral' },
};

/**
 * Saved items, sync progress and conflicts (guide 9.3 and 9.4). A conflict is never discarded
 * automatically. The person decides: try again once the cause is fixed, or dismiss with a reason.
 */
export default function SyncPage() {
  const tz = useTimezone();
  const online = useOnline();
  const businessId = useSession((s) => s.activeBusinessId);
  const ops = useLiveQuery(async () => (businessId ? (await db.ops.where('businessId').equals(businessId).toArray()).sort((a, b) => b.clientCreatedAt.localeCompare(a.clientCreatedAt)).slice(0, 100) : []), [businessId]);
  const [dismissing, setDismissing] = useState<LocalOp | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const attention = ops?.filter((o) => o.status === 'CONFLICT' || o.status === 'FAILED_FINAL') ?? [];
  const rest = ops?.filter((o) => o.status !== 'CONFLICT' && o.status !== 'FAILED_FINAL') ?? [];

  async function resolve(op: LocalOp, action: 'EDIT_AND_POST' | 'DISMISS', why: string) {
    setBusy(op.id); setError(null);
    try {
      const res = await unwrap(api.POST('/api/v1/sync/operations/{id}/resolve', { params: { path: { id: op.id } }, body: { action, reason: why, payload: action === 'EDIT_AND_POST' ? (op.payload as Record<string, unknown>) : undefined } }));
      await db.ops.update(op.id, { status: res.status, errorCode: res.errorCode, message: res.message, result: res.result });
      await refreshLocalCaches();
      setDismissing(null); setReason('');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(null); }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Sync and saved items" subtitle={online ? 'Everything you record is saved on this device first.' : 'You are offline. Everything you record is kept on this device.'} actions={<Button variant="secondary" onClick={() => void syncNow()} disabled={!online}>Sync now</Button>} />
      {error ? <p role="alert" className="body-5 rounded-lg bg-danger-tint p-3 text-danger">{error}</p> : null}

      {attention.length > 0 ? (
        <section aria-label="Needs attention" className="flex flex-col gap-3">
          <h2 className="title-2 text-ink">Needs your decision</h2>
          {attention.map((o) => (
            <Card key={o.id} className="flex flex-col gap-3 border-danger">
              <div className="flex items-start justify-between gap-3"><div className="flex flex-col gap-1"><span className="body-4 text-ink">{o.summary}</span><span className="caption-2 text-muted">{formatDateTime(o.clientCreatedAt, tz)}</span></div><Badge tone="red">{LABEL[o.status].text}</Badge></div>
              <p className="body-5 text-danger">{o.message ?? 'The server could not accept this.'}</p>
              {o.errorCode === 'INSUFFICIENT_STOCK' ? <p className="body-6 text-muted">Not enough stock was left when this synced, often because another phone sold it first. Add stock and try again, or dismiss it if the sale did not go ahead. The record is kept either way.</p> : null}
              <div className="flex flex-wrap gap-2">
                {o.type === 'sale.create' ? <Link href={`/app/sales/receipt?id=${o.entityId}`} className="button-sm inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-3 py-2 text-ink transition-oja hover:bg-soft">View sale</Link> : null}
                <Button size="sm" loading={busy === o.id} loadingText="Trying" onClick={() => resolve(o, 'EDIT_AND_POST', 'Tried again after fixing the cause')} disabled={!online || o.status === 'FAILED_FINAL'}>Try again</Button>
                <Button size="sm" variant="secondary" onClick={() => { setDismissing(o); setError(null); }} disabled={!online}>Dismiss with a reason</Button>
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      <section aria-label="Saved items" className="flex flex-col gap-3">
        <h2 className="title-2 text-ink">Recent activity</h2>
        {ops === undefined ? null : rest.length === 0 && attention.length === 0 ? (
          <EmptyState title="Nothing saved yet" body="Sales, customers, repayments and expenses you record appear here with their sync status." />
        ) : (
          <Card className="p-0 md:p-0"><ul className="divide-y divide-line">
            {rest.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-1"><span className="body-5 text-ink">{o.summary}</span><span className="caption-2 text-muted">{formatDateTime(o.clientCreatedAt, tz)}{o.attempts > 1 ? `, tried ${o.attempts} times` : ''}</span></div>
                <Badge tone={LABEL[o.status].tone}>{LABEL[o.status].text}</Badge>
              </li>
            ))}
          </ul></Card>
        )}
      </section>

      <Dialog open={dismissing !== null} onOpenChange={(o) => !o && setDismissing(null)} title="Dismiss this item" description="It will not be added to your records. The saved copy and your reason are kept for the audit trail.">
        <Field label="Why is it being dismissed">{(p) => <Textarea {...p} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="The customer left without the goods" />}</Field>
        <Button variant="danger" size="lg" block disabled={reason.trim().length < 3} loading={busy === dismissing?.id} loadingText="Dismissing" onClick={() => dismissing && resolve(dismissing, 'DISMISS', reason.trim())}>Dismiss</Button>
      </Dialog>
    </div>
  );
}
