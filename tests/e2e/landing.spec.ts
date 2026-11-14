import { expect, test } from '@playwright/test';

test.describe('landing page', () => {
  test('has no horizontal overflow and shows the primary action in the first screen', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    const cta = page.getByRole('link', { name: /Get started free/ }).first();
    await expect(cta).toBeInViewport();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your business.');
  });

  test('is keyboard friendly: skip link, visible focus, FAQ without a mouse', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    const faq = page.locator('details').first();
    await faq.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(faq).toHaveAttribute('open', '');
  });

  test('tagline words light up one at a time as the section scrolls into view', async ({ page }) => {
    await page.goto('/');
    const words = page.locator('p span[data-i]');
    await expect(words.first()).toBeAttached();
    const lit = () => page.locator('p span[data-i].opacity-100').count();
    await words.first().scrollIntoViewIfNeeded();
    const total = await words.count();
    // Scroll so the section sits just above the trigger line: some words lit, some not.
    await page.evaluate(() => {
      const w = document.querySelector('p span[data-i]')!;
      window.scrollTo(0, w.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45);
    });
    await expect.poll(lit).toBeGreaterThan(0);
    await page.evaluate(() => {
      const all = document.querySelectorAll('p span[data-i]');
      window.scrollTo(0, all[all.length - 1].getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3);
    });
    await expect.poll(lit).toBe(total);
  });

  test('respects reduced motion by showing the tagline at full strength', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    const total = await page.locator('p span[data-i]').count();
    await expect(page.locator('p span[data-i].opacity-100')).toHaveCount(total);
    await context.close();
  });

  test('publishes metadata, a manifest, a branded 404 and legal pages', async ({ page, request }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/OjaBook/);
    expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toContain('/og.png');
    expect(await page.locator('script[type="application/ld+json"]').innerText()).toContain('FAQPage');
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest).toMatchObject({ name: 'OjaBook', display: 'standalone' });
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /could not find/ })).toBeVisible();
    for (const path of ['/privacy', '/terms']) {
      expect((await request.get(path)).status()).toBe(200);
    }
  });
});
