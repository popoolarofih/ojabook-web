'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Card } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { api, errorMessage, unwrap } from '@/lib/api/client';
import { nairaToKobo, parseQtyInput } from '@/lib/money';
import { refreshLocalCaches } from '@/lib/offline/sync-engine';

interface Conv { name: string; factor: string; price: string }
const UNIT_SUGGESTIONS = ['piece', 'kg', 'pack', 'bottle', 'tin', 'sachet', 'litre', 'yard'];

export function ProductForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const businessId = useSession((s) => s.activeBusinessId);
  const canOpening = useCan('inventory.receive');
  const categories = useQuery({ queryKey: ['categories', businessId], queryFn: () => unwrap(api.GET('/api/v1/categories')) });
  const [f, setF] = useState({ name: '', sku: '', barcode: '', categoryId: '', baseUnit: 'piece', price: '', threshold: '', openingQty: '', openingCost: '' });
  const [convs, setConvs] = useState<Conv[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [id] = useState(() => crypto.randomUUID()); // a retry after a lost response cannot create a second product
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 1) err.name = 'Enter the product name.';
    if (!f.baseUnit.trim()) err.baseUnit = 'Enter the unit you count stock in.';
    const price = nairaToKobo(f.price);
    if (price === null) err.price = 'Enter the selling price in naira, for example 1500 or 1500.50.';
    if (f.threshold && !parseQtyInput(f.threshold)) err.threshold = 'Use a number such as 5.';
    const cost = f.openingCost ? nairaToKobo(f.openingCost) : 0;
    if (f.openingQty && !parseQtyInput(f.openingQty)) err.openingQty = 'Use a number such as 24.';
    if (f.openingQty && cost === null) err.openingCost = 'Enter the cost in naira.';
    const conversions = [];
    for (const [i, c] of convs.entries()) {
      const factor = parseQtyInput(c.factor);
      const cp = c.price ? nairaToKobo(c.price) : undefined;
      if (!c.name.trim() || !factor || cp === null) { err[`conv${i}`] = 'Give the unit a name and how many base units it holds. Price is optional.'; continue; }
      conversions.push({ name: c.name.trim(), factor, ...(cp !== undefined ? { sellingPriceKobo: cp } : {}) });
    }
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    setFormError(null);
    try {
      await unwrap(api.POST('/api/v1/products', { body: {
        id, name: f.name.trim(), sku: f.sku.trim() || undefined, barcode: f.barcode.trim() || undefined, categoryId: f.categoryId || undefined,
        baseUnit: f.baseUnit.trim(), sellingPriceKobo: price!, reorderThreshold: f.threshold || undefined, conversions: conversions.length ? conversions : undefined,
        openingStock: canOpening && f.openingQty ? { quantity: f.openingQty, unitCostKobo: cost! } : undefined,
      } }));
      await qc.invalidateQueries({ queryKey: ['products'] });
      await refreshLocalCaches();
      router.push('/app/inventory');
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function addCategory() {
    if (newCategory.trim().length < 2) return;
    try {
      const c = await unwrap(api.POST('/api/v1/categories', { body: { name: newCategory.trim() } }));
      await categories.refetch();
      setF((s) => ({ ...s, categoryId: c.id }));
      setNewCategory('');
    } catch (e) { setFormError(errorMessage(e)); }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <Card className="flex flex-col gap-4">
        <h2 className="title-2 text-ink">Product</h2>
        <Field label="Product name" error={errors.name}>{(p) => <Input {...p} value={f.name} onChange={set('name')} autoFocus placeholder="Peak Milk Tin 160g" />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Selling price per base unit (naira)" error={errors.price}>{(p) => <Input {...p} inputMode="decimal" value={f.price} onChange={set('price')} placeholder="1500" />}</Field>
          <Field label="Base unit" hint="The unit you count stock in." error={errors.baseUnit}>
            {(p) => (<><Input {...p} list="units" value={f.baseUnit} onChange={set('baseUnit')} /><datalist id="units">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist></>)}
          </Field>
          <Field label="SKU (optional)">{(p) => <Input {...p} value={f.sku} onChange={set('sku')} />}</Field>
          <Field label="Barcode (optional)">{(p) => <Input {...p} value={f.barcode} onChange={set('barcode')} />}</Field>
          <Field label="Category (optional)">
            {(p) => (<Select {...p} value={f.categoryId} onChange={set('categoryId')}><option value="">No category</option>{categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>)}
          </Field>
          <Field label="Add a category">{(p) => (<div className="flex gap-2"><Input {...p} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Drinks" /><Button variant="secondary" onClick={addCategory}>Add</Button></div>)}</Field>
          <Field label="Reorder level (optional)" hint="You are warned when stock reaches this." error={errors.threshold}>{(p) => <Input {...p} inputMode="decimal" value={f.threshold} onChange={set('threshold')} placeholder="5" />}</Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1"><h2 className="title-2 text-ink">Other units</h2><p className="body-6 text-muted">For example, 1 carton holds 12 pieces. You can sell in any unit. Stock is always counted in the base unit.</p></div>
        {convs.map((c, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Unit name">{(p) => <Input {...p} value={c.name} onChange={(e) => setConvs((a) => a.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="carton" />}</Field>
              <Field label={`How many ${f.baseUnit || 'base units'}`}>{(p) => <Input {...p} inputMode="decimal" value={c.factor} onChange={(e) => setConvs((a) => a.map((x, j) => (j === i ? { ...x, factor: e.target.value } : x)))} placeholder="12" />}</Field>
              <Field label="Price (optional, naira)">{(p) => <Input {...p} inputMode="decimal" value={c.price} onChange={(e) => setConvs((a) => a.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />}</Field>
            </div>
            {errors[`conv${i}`] ? <p role="alert" className="caption-1 text-danger">{errors[`conv${i}`]}</p> : null}
            <Button variant="ghost" size="sm" className="self-start text-danger" onClick={() => setConvs((a) => a.filter((_, j) => j !== i))}><Trash size={16} /> Remove unit</Button>
          </div>
        ))}
        <Button variant="secondary" className="self-start" onClick={() => setConvs((a) => [...a, { name: '', factor: '', price: '' }])}><Plus size={16} weight="bold" /> Add a unit</Button>
      </Card>

      {canOpening ? (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1"><h2 className="title-2 text-ink">Stock you have now (optional)</h2><p className="body-6 text-muted">Counted in the base unit. The cost starts your average cost and your stock value.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Quantity (${f.baseUnit || 'base units'})`} error={errors.openingQty}>{(p) => <Input {...p} inputMode="decimal" value={f.openingQty} onChange={set('openingQty')} placeholder="24" />}</Field>
            <Field label="Cost per base unit (naira)" error={errors.openingCost}>{(p) => <Input {...p} inputMode="decimal" value={f.openingCost} onChange={set('openingCost')} placeholder="1200" />}</Field>
          </div>
        </Card>
      ) : null}

      {formError ? <p role="alert" className="body-5 text-danger">{formError}</p> : null}
      <Button type="submit" size="lg" loading={busy} loadingText="Saving product" className="self-start">Save product</Button>
    </form>
  );
}
