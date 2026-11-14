'use client';

import { Minus, Plus, ShoppingCartSimple, Trash, MagnifyingGlass, SlidersHorizontal } from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/form';
import { Money } from '@/components/ui/money';
import { Badge, EmptyState, ListSkeleton } from '@/components/ui/surface';
import { useCan, useSession } from '@/features/auth/session-store';
import { db, type CachedProduct } from '@/lib/offline/db';
import { describeSale, enqueueOp, newId } from '@/lib/offline/sync-engine';
import { dec, formatQty, koboToNairaInput, nairaToKobo, parseQtyInput } from '@/lib/money';
import { useCart } from './cart-store';
import { PaymentDialog, type PaymentChoice } from './payment-dialog';
import { baseUsage, cartTotals, lineAmounts, listPriceKobo, unitName, unitOptions, type CartLine } from './pricing';

function ProductTile({ p, onAdd }: { p: CachedProduct; onAdd: () => void }) {
  const out = dec(p.quantity).lte(0);
  return (
    <button type="button" onClick={onAdd} disabled={out}
      className="flex min-h-20 flex-col items-start gap-1 rounded-2xl border border-line bg-white p-3 text-left transition-oja hover:border-royal active:scale-[0.98] disabled:opacity-50">
      <span className="body-5 line-clamp-2 text-ink">{p.name}</span>
      <Money kobo={p.sellingPriceKobo} className="body-4 text-royal" />
      <span className="flex items-center gap-2">
        <span className="caption-2 text-muted">{formatQty(p.quantity)} {p.baseUnit}</span>
        {out ? <Badge tone="red">Out of stock</Badge> : p.isLowStock ? <Badge tone="orange">Low stock</Badge> : null}
      </span>
    </button>
  );
}

function AdjustDialog({ line, product, onClose }: { line: CartLine; product: CachedProduct; onClose: () => void }) {
  const update = useCart((s) => s.update);
  const canPrice = useCan('sales.price_override');
  const canDiscount = useCan('sales.discount');
  const [price, setPrice] = useState(koboToNairaInput(line.unitPriceKobo ?? listPriceKobo(product, line.unitId)));
  const [discount, setDiscount] = useState(line.discountKobo ? koboToNairaInput(line.discountKobo) : '');
  const [error, setError] = useState<string | null>(null);

  function save() {
    const p = nairaToKobo(price);
    const d = nairaToKobo(discount || '0');
    if (p === null || d === null) return setError('Enter amounts in naira, for example 1500 or 1500.50.');
    const list = listPriceKobo(product, line.unitId);
    update(line.key, { unitPriceKobo: p === list ? null : p, discountKobo: d });
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Adjust ${product.name}`} description="Price changes and discounts are recorded with your name.">
      {canPrice ? <Field label={`Price per ${unitName(product, line.unitId)} (naira)`}>{(p) => <Input {...p} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />}</Field> : null}
      {canDiscount ? <Field label="Discount on this line (naira)">{(p) => <Input {...p} inputMode="decimal" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />}</Field> : null}
      {error ? <p role="alert" className="body-5 text-danger">{error}</p> : null}
      <Button size="lg" block onClick={save}>Apply</Button>
    </Dialog>
  );
}

function CartLines({ products }: { products: Map<string, CachedProduct> }) {
  const { lines, update, remove } = useCart();
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const canPrice = useCan('sales.price_override');
  const canDiscount = useCan('sales.discount');
  const canAdjust = canPrice || canDiscount;
  const adjLine = lines.find((l) => l.key === adjusting);

  return (
    <>
      <ul className="flex flex-col divide-y divide-line">
        {lines.map((l) => {
          const p = products.get(l.productId);
          if (!p) return null;
          const a = lineAmounts(p, l);
          const units = unitOptions(p);
          const step = (delta: number) => {
            const next = dec(l.quantity || 0).add(delta);
            if (next.lte(0)) remove(l.key);
            else update(l.key, { quantity: next.toString() });
          };
          return (
            <li key={l.key} className="flex flex-col gap-2 py-3">
              <div className="flex items-start justify-between gap-3">
                <span className="body-5 text-ink">{p.name}</span>
                <Money kobo={a.net} className="body-4 shrink-0 text-ink" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-lg border border-line">
                  <button type="button" aria-label={`Reduce ${p.name}`} onClick={() => step(-1)} className="flex size-10 items-center justify-center rounded-l-lg transition-oja hover:bg-soft"><Minus size={16} weight="bold" /></button>
                  <input aria-label={`Quantity of ${p.name}`} inputMode="decimal" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} className="tabular body-4 h-10 w-16 border-x border-line text-center" />
                  <button type="button" aria-label={`Add one ${p.name}`} onClick={() => step(1)} className="flex size-10 items-center justify-center rounded-r-lg transition-oja hover:bg-soft"><Plus size={16} weight="bold" /></button>
                </div>
                {units.length > 1 ? (
                  <Select aria-label={`Unit for ${p.name}`} value={l.unitId ?? ''} onChange={(e) => update(l.key, { unitId: e.target.value || null, unitPriceKobo: null })} className="min-h-10 w-auto py-1">
                    {units.map((u) => <option key={u.id ?? 'base'} value={u.id ?? ''}>{u.name}</option>)}
                  </Select>
                ) : <span className="caption-2 text-muted">{p.baseUnit}</span>}
                <span className="caption-2 text-muted tabular">at <Money kobo={a.price} /></span>
                {l.unitPriceKobo !== null ? <Badge tone="orange">Price changed</Badge> : null}
                {l.discountKobo > 0 ? <Badge tone="orange">Discount</Badge> : null}
                <span className="ml-auto flex items-center gap-1">
                  {canAdjust ? <button type="button" aria-label={`Adjust ${p.name}`} onClick={() => setAdjusting(l.key)} className="flex size-10 items-center justify-center rounded-lg text-muted transition-oja hover:bg-soft"><SlidersHorizontal size={20} /></button> : null}
                  <button type="button" aria-label={`Remove ${p.name}`} onClick={() => remove(l.key)} className="flex size-10 items-center justify-center rounded-lg text-danger transition-oja hover:bg-danger-tint"><Trash size={20} /></button>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {adjLine && products.get(adjLine.productId) ? <AdjustDialog line={adjLine} product={products.get(adjLine.productId)!} onClose={() => setAdjusting(null)} /> : null}
    </>
  );
}

export function QuickSale() {
  const router = useRouter();
  const businessId = useSession((s) => s.activeBusinessId);
  const { lines, add, clear, customerId, setCustomer } = useCart();
  const [q, setQ] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  const products = useLiveQuery(async () => (businessId ? (await db.products.where('businessId').equals(businessId).toArray()).sort((a, b) => a.name.localeCompare(b.name)) : []), [businessId]);
  const byId = useMemo(() => new Map((products ?? []).map((p) => [p.id, p])), [products]);
  const totals = cartTotals(lines, byId);
  const count = lines.length;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (products ?? []).filter((p) => !t || p.name.toLowerCase().includes(t) || (p.sku ?? '').toLowerCase().includes(t) || p.barcode === q.trim());
  }, [products, q]);

  function validate(): string[] {
    const out: string[] = [];
    for (const l of lines) {
      const p = byId.get(l.productId);
      if (p && !parseQtyInput(l.quantity)) out.push(`Check the quantity of ${p.name}. Use a number such as 2 or 1.5.`);
    }
    if (out.length) return out;
    for (const [id, used] of baseUsage(lines, byId)) {
      const p = byId.get(id)!;
      if (used.gt(p.quantity)) out.push(`Not enough ${p.name} on this device: ${formatQty(p.quantity)} ${p.baseUnit} left, ${formatQty(used.toString())} needed.`);
    }
    return out;
  }

  function openPayment() {
    const v = validate();
    setProblems(v);
    if (v.length === 0) { setCartOpen(false); setPayOpen(true); }
  }

  async function confirm(choice: PaymentChoice) {
    setBusy(true);
    try {
      const saleId = newId();
      const payload: Record<string, unknown> = {
        id: saleId,
        occurredAt: new Date().toISOString(),
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          ...(l.unitId ? { unitId: l.unitId } : {}),
          ...(l.unitPriceKobo !== null ? { unitPriceKobo: l.unitPriceKobo } : {}),
          ...(l.discountKobo > 0 ? { discountKobo: l.discountKobo } : {}),
        })),
        payments: choice.payments,
        ...(choice.customerId ? { customerId: choice.customerId } : {}),
        ...(choice.dueDate ? { dueDate: choice.dueDate } : {}),
      };
      // Written to this device first. Only then is the user told it is saved.
      await enqueueOp({ type: 'sale.create', entityId: saleId, payload, summary: describeSale(totals.total), amountKobo: totals.total });
      clear();
      setPayOpen(false);
      router.push(`/app/sales/receipt?id=${saleId}`);
    } catch (e) {
      setProblems([e instanceof Error ? e.message : 'Could not save the sale. Try again.']);
      setPayOpen(false);
      setCartOpen(true);
    } finally {
      setBusy(false);
    }
  }

  const cartPanel = (
    <div className="flex flex-col gap-3">
      {count === 0 ? <EmptyState icon={<ShoppingCartSimple size={24} />} title="Your cart is empty" body="Tap a product to add it to this sale." /> : <CartLines products={byId} />}
      {problems.length ? <ul role="alert" className="flex flex-col gap-1 rounded-lg bg-danger-tint p-3">{problems.map((p) => <li key={p} className="body-5 text-danger">{p}</li>)}</ul> : null}
      {count > 0 ? (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          {totals.discount > 0 ? <div className="flex justify-between"><span className="body-5 text-muted">Discounts</span><Money kobo={-totals.discount} className="body-5 text-ink" /></div> : null}
          <div className="flex items-center justify-between"><span className="title-3 text-ink">Total</span><Money kobo={totals.total} className="heading-5 text-ink" /></div>
          <Button size="lg" block onClick={openPayment} disabled={totals.total <= 0}>Charge <Money kobo={totals.total} /></Button>
          <Button variant="ghost" block onClick={() => { clear(); setProblems([]); }}>Clear cart</Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section aria-label="Products" className="flex min-w-0 flex-col gap-4">
        <div className="relative">
          <MagnifyingGlass size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Search products" type="search" placeholder="Search by name, SKU or barcode" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" autoFocus />
        </div>
        {products === undefined ? <ListSkeleton rows={4} /> : filtered.length === 0 ? (
          <EmptyState title={(products?.length ?? 0) === 0 ? 'No products yet' : 'No product matches'} body={(products?.length ?? 0) === 0 ? 'Add your products in Inventory, then they appear here, even offline.' : 'Try another name or clear the search.'} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
            {filtered.map((p) => <li key={p.id}><ProductTile p={p} onAdd={() => { add(p.id); setProblems([]); }} /></li>)}
          </ul>
        )}
      </section>

      {/* Desktop: the cart stays beside the products. */}
      <aside aria-label="Cart" className="hidden lg:block"><div className="sticky top-20 rounded-2xl border border-line bg-white p-4"><h2 className="title-2 mb-3 text-ink">Cart</h2>{cartPanel}</div></aside>

      {/* Phone: a bar opens the cart as a sheet. */}
      {count > 0 ? (
        <div className="no-print fixed inset-x-0 bottom-16 z-20 px-4 lg:hidden">
          <Button size="lg" block onClick={() => setCartOpen(true)} className="shadow-[0_8px_24px_rgba(33,35,46,0.25)]">
            <ShoppingCartSimple size={20} weight="bold" /> View cart ({count}) <Money kobo={totals.total} />
          </Button>
        </div>
      ) : null}
      <Dialog open={cartOpen} onOpenChange={setCartOpen} title="Cart">{cartPanel}</Dialog>
      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} total={totals.total} customerId={customerId} onCustomer={setCustomer} onConfirm={confirm} busy={busy} />
    </div>
  );
}
