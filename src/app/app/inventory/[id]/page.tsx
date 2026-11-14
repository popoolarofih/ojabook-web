'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { Badge, Card, ErrorState, ListSkeleton, PageHeader, Stat } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { AddUnitDialog, EditProductDialog } from '@/features/inventory/edit-dialogs';
import { AdjustStockDialog, ReceiveStockDialog } from '@/features/inventory/stock-dialogs';
import { formatDateTime, humanize } from '@/features/shared/format';
import { useTimezone } from '@/features/shared/use-timezone';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { formatQty } from '@/lib/money';
import { refreshLocalCaches } from '@/lib/offline/sync-engine';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const tz = useTimezone();
  const businessId = useSession((s) => s.activeBusinessId);
  const canWrite = useCan('products.write');
  const canReceive = useCan('inventory.receive');
  const canAdjust = useCan('inventory.adjust');
  const [dialog, setDialog] = useState<'receive' | 'adjust' | 'edit' | 'unit' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const product = useQuery({ queryKey: ['product', businessId, id], queryFn: () => unwrap(api.GET('/api/v1/products/{id}', { params: { path: { id } } })) });
  const moves = useQuery({ queryKey: ['movements', businessId, id], queryFn: () => unwrap(api.GET('/api/v1/stock-movements', { params: { query: { productId: id, pageSize: 20 } } })) });

  async function toggleArchive(archive: boolean) {
    setActionError(null);
    try {
      await unwrap(archive ? api.POST('/api/v1/products/{id}/archive', { params: { path: { id } } }) : api.POST('/api/v1/products/{id}/unarchive', { params: { path: { id } } }));
      await qc.invalidateQueries();
      await refreshLocalCaches();
    } catch (e) { setActionError(errorMessage(e)); }
  }

  if (product.isLoading) return <ListSkeleton rows={3} />;
  if (product.isError || !product.data) return <ErrorState message={errorMessage(product.error)} onRetry={() => product.refetch()} />;
  const p = product.data;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/inventory" className="button-sm w-fit rounded-lg px-2 py-1 text-royal transition-oja hover:bg-royal-tint">Back to inventory</Link>
      <PageHeader title={p.name} subtitle={[p.categoryName, p.sku && `SKU ${p.sku}`].filter(Boolean).join(', ') || undefined}
        actions={<>
          {canReceive ? <Button onClick={() => setDialog('receive')}>Receive stock</Button> : null}
          {canAdjust ? <Button variant="secondary" onClick={() => setDialog('adjust')}>Adjust stock</Button> : null}
          {canWrite ? <Button variant="secondary" onClick={() => setDialog('edit')}>Edit</Button> : null}
        </>} />
      {p.status === 'ARCHIVED' ? <Badge tone="neutral">Archived. It cannot be sold.</Badge> : null}
      {actionError ? <p role="alert" className="body-5 text-danger">{actionError}</p> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="On hand" value={`${formatQty(p.quantity)} ${p.baseUnit}`} hint={p.isLowStock ? 'At or below reorder level' : undefined} tone={p.isLowStock ? 'warn' : 'default'} />
        <Stat label="Selling price" value={<Money kobo={p.sellingPriceKobo} />} hint={`Per ${p.baseUnit}`} />
        {p.avgCostKobo !== undefined ? <Stat label="Average cost" value={<Money kobo={Math.round(Number(p.avgCostKobo))} decimals="always" />} hint={`Per ${p.baseUnit}, weighted`} /> : null}
        {p.stockValueKobo !== undefined ? <Stat label="Stock value" value={<Money kobo={p.stockValueKobo} />} /> : null}
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3"><h2 className="title-2 text-ink">Units</h2>{canWrite ? <Button size="sm" variant="secondary" onClick={() => setDialog('unit')}>Add a unit</Button> : null}</div>
        <ul className="divide-y divide-line">
          <li className="flex justify-between py-3"><span className="body-5 text-ink">{p.baseUnit} <Badge>Base unit</Badge></span><Money kobo={p.sellingPriceKobo} className="body-5" /></li>
          {p.conversions.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <span className="body-5 text-ink">{c.name} <span className="caption-2 text-muted">holds {c.factor} {p.baseUnit}</span></span>
              {c.sellingPriceKobo !== null ? <Money kobo={c.sellingPriceKobo} className="body-5" /> : <span className="caption-2 text-muted">Price follows the base price</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="title-2 text-ink">Stock history</h2>
        {moves.isLoading ? <ListSkeleton rows={3} /> : moves.data?.items.length === 0 ? <p className="body-6 text-muted">No movements yet.</p> : (
          <ul className="divide-y divide-line">
            {moves.data?.items.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                <div className="flex flex-col"><span className="body-5 text-ink">{humanize(m.type)}{m.reasonCode ? `: ${humanize(m.reasonCode)}` : ''}</span><span className="caption-2 text-muted">{formatDateTime(m.occurredAt, tz)}{m.note ? `, ${m.note}` : ''}</span></div>
                <div className="flex flex-col items-end"><span className={`body-4 tabular ${Number(m.quantityDelta) < 0 ? 'text-danger' : 'text-success-ink'}`}>{Number(m.quantityDelta) > 0 ? '+' : ''}{formatQty(m.quantityDelta)}</span><span className="caption-2 text-muted tabular">Balance {formatQty(m.balanceAfter)}</span></div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canWrite ? <Button variant="ghost" className="self-start text-danger" onClick={() => toggleArchive(p.status === 'ACTIVE')}>{p.status === 'ACTIVE' ? 'Archive product' : 'Restore product'}</Button> : null}
      {dialog === 'receive' ? <ReceiveStockDialog product={p} onClose={() => setDialog(null)} /> : null}
      {dialog === 'adjust' ? <AdjustStockDialog product={p} onClose={() => setDialog(null)} /> : null}
      {dialog === 'edit' ? <EditProductDialog product={p} onClose={() => setDialog(null)} /> : null}
      {dialog === 'unit' ? <AddUnitDialog product={p} onClose={() => setDialog(null)} /> : null}
    </div>
  );
}
