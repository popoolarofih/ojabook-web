import { describe, expect, it } from 'vitest';
import { formatNgn, formatNgnCompact, formatQty, koboToNairaInput, lineTotalKobo, nairaToKobo, parseQtyInput } from './money';

describe('money', () => {
  it('formats kobo as naira', () => {
    expect(formatNgn(150000)).toBe('₦1,500');
    expect(formatNgn(123450)).toBe('₦1,234.50');
    expect(formatNgn(5)).toBe('₦0.05');
    expect(formatNgn(-250000)).toBe('-₦2,500');
    expect(formatNgn(150000, { decimals: 'always' })).toBe('₦1,500.00');
    expect(formatNgn(123456789012)).toBe('₦1,234,567,890.12');
  });

  it('formats compact amounts', () => {
    expect(formatNgnCompact(123_456_700)).toBe('₦1.2M');
    expect(formatNgnCompact(4_530_000)).toBe('₦45.3K');
    expect(formatNgnCompact(99_900)).toBe('₦999');
  });

  it('parses typed amounts into integer kobo without floating point error', () => {
    expect(nairaToKobo('1,234.50')).toBe(123450);
    expect(nairaToKobo('₦500')).toBe(50000);
    expect(nairaToKobo('0.1')).toBe(10);
    expect(nairaToKobo('19.99')).toBe(1999);
    expect(nairaToKobo('1.005')).toBeNull();
    expect(nairaToKobo('abc')).toBeNull();
    expect(nairaToKobo('')).toBeNull();
    expect(nairaToKobo('-5')).toBeNull();
  });

  it('round trips for inputs', () => {
    expect(koboToNairaInput(150000)).toBe('1500');
    expect(koboToNairaInput(150050)).toBe('1500.50');
    expect(koboToNairaInput(5)).toBe('0.05');
  });

  it('previews line totals the same way the API rounds', () => {
    expect(lineTotalKobo('0.3', 10000)).toBe(3000);
    expect(lineTotalKobo('2.5', 3333)).toBe(8333);
    expect(lineTotalKobo('12', 125000)).toBe(1_500_000);
  });

  it('validates quantities', () => {
    expect(parseQtyInput('2.5')).toBe('2.5');
    expect(parseQtyInput('0')).toBeNull();
    expect(parseQtyInput('1.00001')).toBeNull();
    expect(parseQtyInput('-1')).toBeNull();
    expect(formatQty('47.5000')).toBe('47.5');
  });
});
