'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/form';
import { api, errorMessage, unwrap, type Schemas } from '@/lib/api/client';
import { koboToNairaInput, nairaToKobo, parseQtyInput } from '@/lib/money';
import { refreshLocalCaches } from '@/lib/offline/sync-engine';

type Product = Schemas['ProductDto'];

async function afterSave(qc: ReturnType<typeof useQueryClient>) {
  await qc.invalidateQueries();
  await refreshLocalCaches();
}

/** Price and name edits never change past sales: every sale keeps the name, unit, price and cost it had. */
export function EditProductDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: product.name, sku: product.sku ?? '', price: koboToNairaInput(product.sellingPriceKobo), threshold: String(Number(product.reorderThreshold)) });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const price = nairaToKobo(f.price);
    if (!f.name.trim()) return setError('Enter the product name.');
    if (price === null) return setError('Enter the price in naira, for example 1500 or 1500.50.');
    if (f.threshold && f.threshold !== '0' && !parseQtyInput(f.threshold)) return setError('The reorder level must be a number such as 5.');
    setBusy(true); setError(null);
    try {
      await unwrap(api.PATCH('/api/v1/products/{id}', { params: { path: { id: product.id } }, body: { name: f.name.trim(), sku: f.sku.trim() || undefined, sellingPriceKobo: price, reorderThreshold: f.threshold && f.threshold !== '0' ? f.threshold : '0' } }));
      await afterSave(qc);
      onClose();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="Edit product" description="Past sales keep the price and name they were sold at.">
      <Field label="Product name">{(p) => <Input {...p} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
      <Field label={`Selling price per ${product.baseUnit} (naira)`}>{(p) => <Input {...p} inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SKU">{(p) => <Input {...p} value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} />}</Field>
        <Field label="Reorder level">{(p) => <Input {...p} inputMode="decimal" value={f.threshold} onChange={(e) => setF({ ...f, threshold: e.target.value })} />}</Field>
      </div>
      {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
      <Button size="lg" block loading={busy} loadingText="Saving" onClick={save}>Save changes</Button>
    </Dialog>
  );
}

export function AddUnitDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [factor, setFactor] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const f = parseQtyInput(factor);
    const p = price ? nairaToKobo(price) : undefined;
    if (!name.trim()) return setError('Give the unit a name, for example carton.');
    if (!f) return setError(`Enter how many ${product.baseUnit} it holds, for example 12.`);
    if (p === null) return setError('Enter the price in naira, or leave it empty.');
    setBusy(true); setError(null);
    try {
      await unwrap(api.POST('/api/v1/products/{id}/conversions', { params: { path: { id: product.id } }, body: { name: name.trim(), factor: f, ...(p !== undefined ? { sellingPriceKobo: p } : {}) } }));
      await afterSave(qc);
      onClose();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="Add a unit" description={`Stock stays counted in ${product.baseUnit}. Existing sales keep the unit they used.`}>
      <Field label="Unit name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="carton" autoFocus />}</Field>
      <Field label={`How many ${product.baseUnit} it holds`}>{(p) => <Input {...p} inputMode="decimal" value={factor} onChange={(e) => setFactor(e.target.value)} placeholder="12" />}</Field>
      <Field label="Price (optional, naira)" hint="Leave empty to follow the base price.">{(p) => <Input {...p} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />}</Field>
      {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
      <Button size="lg" block loading={busy} loadingText="Saving" onClick={save}>Add unit</Button>
    </Dialog>
  );
}
