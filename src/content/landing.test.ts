import { describe, expect, it } from 'vitest';
import { allCopy, faq, hero, tagline } from './landing';

const BANNED = [
  'revolutionize', 'supercharge', 'cutting edge', 'effortless', 'transform your workflow', 'take it to the next level',
  'harness the power', 'world class', 'streamline', 'optimize', 'seamless',
];

describe('landing page copy rules (landing page design skill)', () => {
  const copy = allCopy();

  it('has copy to check', () => {
    expect(copy.length).toBeGreaterThan(60);
  });

  it('uses no hyphens in visible text', () => {
    const offenders = copy.filter((s) => s.includes('-') || s.includes('–') || s.includes('—'));
    expect(offenders).toEqual([]);
  });

  it('avoids banned filler words', () => {
    const offenders = copy.filter((s) => BANNED.some((w) => s.toLowerCase().includes(w)));
    expect(offenders).toEqual([]);
  });

  it('uses no exclamation marks and no placeholder text', () => {
    expect(copy.filter((s) => s.includes('!'))).toEqual([]);
    expect(copy.filter((s) => /lorem|your headline here|\{\{/i.test(s))).toEqual([]);
  });

  it('keeps the specified hero wording', () => {
    expect(hero.headline).toBe('Your business. Your numbers. Your control.');
    expect(hero.primaryCta).toBe('Get started free');
    expect(hero.secondaryCta).toBe('Explore OjaBook');
  });

  it('has a tagline of at least two sentences for the reveal section', () => {
    expect(tagline.split('. ').length).toBeGreaterThanOrEqual(2);
  });

  it('has six to twelve FAQ entries', () => {
    expect(faq.length).toBeGreaterThanOrEqual(6);
    expect(faq.length).toBeLessThanOrEqual(12);
  });

  it('does not claim things the product cannot do yet', () => {
    const text = copy.join(' ').toLowerCase();
    for (const claim of ['whatsapp reminder', 'virtual account', 'voice', 'barcode scan', 'bluetooth', 'guaranteed', 'testimonial']) {
      expect(text).not.toContain(claim);
    }
  });

  it('keeps demonstration figures consistent', async () => {
    const { demo } = await import('./landing');
    const n = (s: string) => Number(s.replace(/[₦,]/g, ''));
    expect(n(demo.collected) + n(demo.owed)).toBe(n(demo.revenue));
    expect(n(demo.revenue) - 742_880 - n(demo.expenses)).toBe(n(demo.profit));
  });
});
