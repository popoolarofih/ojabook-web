'use client';

import { create } from 'zustand';
import type { CartLine } from './pricing';

interface CartState {
  lines: CartLine[];
  customerId: string | null;
  add: (productId: string, unitId?: string | null) => void;
  update: (key: string, patch: Partial<CartLine>) => void;
  remove: (key: string) => void;
  setCustomer: (id: string | null) => void;
  clear: () => void;
}

/** The cart is client UI state only (guide 6.1). The server prices and validates the sale. */
export const useCart = create<CartState>((set) => ({
  lines: [],
  customerId: null,
  add: (productId, unitId = null) =>
    set((s) => {
      const existing = s.lines.find((l) => l.productId === productId && l.unitId === unitId && l.unitPriceKobo === null && l.discountKobo === 0);
      if (existing) {
        const next = (Number(existing.quantity) + 1).toString();
        return { lines: s.lines.map((l) => (l.key === existing.key ? { ...l, quantity: next } : l)) };
      }
      return { lines: [...s.lines, { key: crypto.randomUUID(), productId, unitId, quantity: '1', unitPriceKobo: null, discountKobo: 0 }] };
    }),
  update: (key, patch) => set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) })),
  remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
  setCustomer: (customerId) => set({ customerId }),
  clear: () => set({ lines: [], customerId: null }),
}));
