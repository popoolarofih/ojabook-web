import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db, type CachedProduct } from './db';
import { applyLines } from './stock-math';
import { backoffMs } from './sync-engine';

const product = (over: Partial<CachedProduct> = {}): CachedProduct =>
  ({
    id: 'p1', businessId: 'b1', name: 'Rice', sku: null, barcode: null, categoryId: null, categoryName: null, baseUnit: 'kg',
    sellingPriceKobo: 150000, reorderThreshold: '5.0000', status: 'ACTIVE', quantity: '100.0000', isLowStock: false,
    conversions: [{ id: 'bag', name: 'bag', factor: '50', sellingPriceKobo: null }], updatedAt: '', ...over,
  }) as CachedProduct;

describe('backoff', () => {
  it('grows exponentially with jitter and is capped', () => {
    expect(backoffMs(1, 0.5)).toBe(5_000);
    expect(backoffMs(2, 0.5)).toBe(10_000);
    expect(backoffMs(3, 0.5)).toBe(20_000);
    expect(backoffMs(20, 0.5)).toBe(300_000);
    expect(backoffMs(1, 0)).toBeLessThan(backoffMs(1, 1));
  });
});

describe('local stock while offline', () => {
  it('converts units and reduces cached stock so the same item cannot be sold twice', () => {
    const [after] = applyLines([product()], [{ productId: 'p1', quantity: '1', unitId: 'bag' }, { productId: 'p1', quantity: '2.5' }], -1);
    expect(after.quantity).toBe('47.5000');
  });

  it('flags low stock and can undo the change', () => {
    const [low] = applyLines([product({ quantity: '7.0000' })], [{ productId: 'p1', quantity: '3' }], -1);
    expect(low.quantity).toBe('4.0000');
    expect(low.isLowStock).toBe(true);
    const [back] = applyLines([low], [{ productId: 'p1', quantity: '3' }], 1);
    expect(back.quantity).toBe('7.0000');
  });

  it('ignores products that are not cached', () => {
    expect(applyLines([product()], [{ productId: 'other', quantity: '1' }], -1)[0].quantity).toBe('100.0000');
  });
});

describe('local database', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('persists operations and never stores credentials', async () => {
    await db.ops.add({
      id: 'op1', businessId: 'b1', userId: 'u1', type: 'sale.create', entityId: 's1', payload: { id: 's1' }, summary: 'Sale',
      clientCreatedAt: new Date().toISOString(), status: 'LOCAL_PENDING', attempts: 0, nextAttemptAt: 0,
    });
    const stored = await db.ops.get('op1');
    expect(stored?.status).toBe('LOCAL_PENDING');
    expect(JSON.stringify(stored)).not.toMatch(/token|password|secret/i);
    vi.restoreAllMocks();
  });
});
