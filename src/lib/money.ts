import Decimal from 'decimal.js';

/**
 * Money on the client is display and preview only. The API is authoritative (guide 6.1).
 * Amounts are integer kobo. No floating point arithmetic is used for money.
 */
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export const dec = (v: Decimal.Value) => new Decimal(v);

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 123450 -> "₦1,234.50" */
export function formatNgn(kobo: number | bigint, opts: { decimals?: 'auto' | 'always' } = {}): string {
  const value = BigInt(kobo);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const naira = abs / 100n;
  const rest = Number(abs % 100n);
  const showDecimals = opts.decimals === 'always' || rest !== 0;
  return `${negative ? '-' : ''}₦${group(naira.toString())}${showDecimals ? `.${String(rest).padStart(2, '0')}` : ''}`;
}

/** Compact for charts and tight cards: ₦1.2M, ₦45.3K. */
export function formatNgnCompact(kobo: number): string {
  const naira = Math.abs(kobo) / 100;
  const sign = kobo < 0 ? '-' : '';
  if (naira >= 1_000_000) return `${sign}₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 10_000) return `${sign}₦${(naira / 1_000).toFixed(1)}K`;
  return formatNgn(kobo);
}

/**
 * Parse what a person types into kobo: "1,234.50", "1234", "₦500". Returns null when it is not
 * a valid amount. At most two decimal places are accepted so nothing is silently rounded.
 */
export function nairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.');
  const kobo = BigInt(whole) * 100n + BigInt(frac.padEnd(2, '0'));
  return kobo > BigInt(Number.MAX_SAFE_INTEGER) ? null : Number(kobo);
}

/** 150000 -> "1500" or "1500.50", for editing in an input. */
export function koboToNairaInput(kobo: number): string {
  const whole = Math.floor(kobo / 100);
  const rest = kobo % 100;
  return rest === 0 ? String(whole) : `${whole}.${String(rest).padStart(2, '0')}`;
}

/** Quantity (decimal string) times unit price (kobo), rounded half up to a kobo. Mirrors the API. */
export function lineTotalKobo(quantity: string, unitPriceKobo: number): number {
  return dec(quantity).mul(unitPriceKobo).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/** Quantity text for people: "47.5", "12". */
export function formatQty(q: string): string {
  return dec(q).toDecimalPlaces(4).toString();
}

/** A quantity a person typed, valid for the API (positive, at most 4 decimals). */
export function parseQtyInput(input: string): string | null {
  const v = input.trim();
  if (!/^\d{1,10}(\.\d{1,4})?$/.test(v)) return null;
  return dec(v).gt(0) ? v : null;
}
