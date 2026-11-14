import { dec } from '@/lib/money';
import type { CachedProduct } from './db';

interface Line {
  productId: string;
  quantity: string;
  unitId?: string | null;
}

/** Base unit quantity of a line, using the factor from the cached product. */
export function baseQuantity(product: CachedProduct, line: Line): ReturnType<typeof dec> {
  const factor = line.unitId ? dec(product.conversions.find((c) => c.id === line.unitId)?.factor ?? 1) : dec(1);
  return dec(line.quantity).mul(factor);
}

/** What stock would be after pending local sales, so a cashier cannot sell the same item twice offline. */
export function applyLines(products: CachedProduct[], lines: Line[], sign: 1 | -1): CachedProduct[] {
  const byId = new Map(products.map((p) => [p.id, { ...p }]));
  for (const line of lines) {
    const p = byId.get(line.productId);
    if (!p) continue;
    const next = dec(p.quantity).add(baseQuantity(p, line).mul(sign));
    p.quantity = next.toFixed(4);
    p.isLowStock = next.lte(dec(p.reorderThreshold));
  }
  return [...byId.values()];
}
