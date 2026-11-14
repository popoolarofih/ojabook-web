import { dec, lineTotalKobo } from '@/lib/money';
import type { CachedProduct } from '@/lib/offline/db';

export interface CartLine {
  key: string;
  productId: string;
  unitId: string | null;
  quantity: string;
  /** Set only when the price differs from the list price. Needs permission on the server. */
  unitPriceKobo: number | null;
  discountKobo: number;
}

export const unitOptions = (p: CachedProduct) => [
  { id: null as string | null, name: p.baseUnit, factor: '1' },
  ...p.conversions.map((c) => ({ id: c.id as string | null, name: c.name, factor: c.factor })),
];

/** The list price of one sold unit. Mirrors the server: explicit unit price, else price x factor, rounded half up. */
export function listPriceKobo(p: CachedProduct, unitId: string | null): number {
  if (!unitId) return p.sellingPriceKobo;
  const c = p.conversions.find((x) => x.id === unitId);
  if (!c) return p.sellingPriceKobo;
  if (c.sellingPriceKobo !== null) return c.sellingPriceKobo;
  return dec(p.sellingPriceKobo).mul(c.factor).toDecimalPlaces(0).toNumber();
}

export const unitName = (p: CachedProduct, unitId: string | null) => (unitId ? (p.conversions.find((c) => c.id === unitId)?.name ?? p.baseUnit) : p.baseUnit);

export function lineAmounts(p: CachedProduct, l: CartLine) {
  const price = l.unitPriceKobo ?? listPriceKobo(p, l.unitId);
  const gross = lineTotalKobo(l.quantity, price);
  return { price, gross, net: Math.max(0, gross - l.discountKobo) };
}

export function cartTotals(lines: CartLine[], products: Map<string, CachedProduct>) {
  let subtotal = 0;
  let discount = 0;
  for (const l of lines) {
    const p = products.get(l.productId);
    if (!p) continue;
    const a = lineAmounts(p, l);
    subtotal += a.gross;
    discount += Math.min(l.discountKobo, a.gross);
  }
  return { subtotal, discount, total: subtotal - discount };
}

/** Stock this cart would use, per product, in base units. Used to warn before the server has to refuse. */
export function baseUsage(lines: CartLine[], products: Map<string, CachedProduct>): Map<string, ReturnType<typeof dec>> {
  const out = new Map<string, ReturnType<typeof dec>>();
  for (const l of lines) {
    const p = products.get(l.productId);
    if (!p) continue;
    const factor = l.unitId ? dec(p.conversions.find((c) => c.id === l.unitId)?.factor ?? 1) : dec(1);
    out.set(p.id, (out.get(p.id) ?? dec(0)).add(dec(l.quantity || 0).mul(factor)));
  }
  return out;
}
