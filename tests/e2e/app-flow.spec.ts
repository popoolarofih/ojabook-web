import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * The full vertical slice in a real browser against the real API:
 * sign up, create a business and product, sell, sell offline, sync, sell on credit, take a repayment.
 * Needs the API running with OTP_PROVIDER=console and its output in E2E_API_LOG.
 */
const API_LOG = process.env.E2E_API_LOG ?? '/tmp/claude-0/api.log';

function otpFor(e164: string): string {
  const lines = readFileSync(API_LOG, 'utf8').split('\n').filter((l) => l.includes(`OTP for ${e164}`));
  const m = lines.at(-1)?.match(/OTP for \+\d+: (\d{6})/);
  if (!m) throw new Error(`No code logged for ${e164}`);
  return m[1];
}

async function openCartIfPhone(page: Page) {
  const bar = page.getByRole('button', { name: /View cart/ });
  if (await bar.isVisible().catch(() => false)) await bar.click();
}

async function sell(page: Page, product: RegExp) {
  await page.goto('/app/sales/new');
  const tile = page.getByRole('button', { name: product }).first();
  await expect(tile).toBeVisible({ timeout: 15_000 });
  await tile.click();
  await openCartIfPhone(page);
  await page.getByRole('button', { name: /^Charge/ }).click();
}

test.describe.configure({ mode: 'serial' });

test('register, sell, work offline, sync, credit and repayment', async ({ page, context }, info) => {
  const phone = `080${String(Date.now()).slice(-8)}`;
  const e164 = `+234${phone.slice(1)}`;
  const shop = `Amaka Provisions ${info.project.name}`;

  // 1. Sign in with a phone number and a one time code.
  await page.goto('/login');
  await page.getByLabel('Phone number').fill(phone);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('heading', { name: 'Enter your code' })).toBeVisible();
  await page.getByLabel('One time code').fill(otpFor(e164));
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // 2. Create the business.
  await page.getByLabel('Business name').fill(shop);
  await page.getByLabel('Kind of business').selectOption({ label: 'Provision store or supermarket' });
  await page.getByRole('button', { name: 'Create business' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  // 3. Add a product with a bag conversion and opening stock.
  await page.goto('/app/inventory/new');
  await page.getByLabel('Product name').fill('Rice');
  await page.getByLabel('Selling price per base unit (naira)').fill('1500');
  await page.getByLabel('Base unit', { exact: true }).fill('kg');
  await page.getByRole('button', { name: 'Add a unit' }).click();
  await page.getByLabel('Unit name').fill('bag');
  await page.getByLabel(/How many kg/).fill('50');
  await page.getByLabel(/Quantity \(kg\)/).fill('100');
  await page.getByLabel('Cost per base unit (naira)').fill('1000');
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(page).toHaveURL(/\/app\/inventory$/);
  await expect(page.getByText('Rice')).toBeVisible();
  await expect(page.getByText('100 kg').first()).toBeVisible();

  // 4. An online cash sale. It is saved on the device first, then synced.
  await sell(page, /Rice/);
  await page.getByRole('button', { name: 'Finish sale' }).click();
  await expect(page).toHaveURL(/sales\/receipt\?id=/);
  await expect(page.getByText('Receipt R-000001')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Saved and synced.')).toBeVisible();

  // 5. Offline: the sale is kept on the device and the receipt still opens.
  await page.goto('/app/sales/new');
  await expect(page.getByRole('button', { name: /Rice/ }).first()).toBeVisible({ timeout: 15_000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.getByRole('button', { name: /Rice/ }).first().click();
  await openCartIfPhone(page);
  await page.getByRole('button', { name: /^Charge/ }).click();
  await page.getByRole('button', { name: 'Finish sale' }).click();
  await expect(page.getByText('Saved on this device. Waiting to sync.').or(page.getByText('Sync will retry shortly.'))).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Receipt number is given when this syncs')).toBeVisible();

  // 6. Back online: it syncs once, with no duplicate.
  await context.setOffline(false);
  await expect(page.getByText('Saved and synced.')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText('Receipt R-000002')).toBeVisible();

  // 7. Dashboard: two cash sales of N1,500 are N3,000 of revenue and collections.
  await page.goto('/app');
  await expect(page.getByText('₦3,000').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('2 sales, credit included')).toBeVisible();

  // 8. A credit sale to a new customer.
  await sell(page, /Rice/);
  await page.getByRole('radio', { name: 'Credit' }).click();
  await page.getByRole('button', { name: 'Add a new customer' }).click();
  await page.getByLabel('Customer name').fill('Mama Tunde');
  await page.getByRole('button', { name: 'Save customer' }).click();
  await page.getByRole('button', { name: 'Finish sale' }).click();
  await expect(page.getByText('Receipt R-000003')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Still owed')).toBeVisible();

  // 9. The debt shows up, and a part repayment reduces it. Overpayment is refused.
  await page.goto('/app/debts');
  await page.getByRole('link', { name: /Mama Tunde/ }).click();
  await expect(page.getByText('Owes you').first()).toBeVisible();
  await page.getByRole('button', { name: 'Record repayment' }).click();
  await page.getByLabel('Amount received (naira)').fill('2000');
  await page.getByRole('button', { name: 'Record repayment' }).last().click();
  await expect(page.getByText(/more than the ₦1,500 owed/)).toBeVisible();
  await page.getByLabel('Amount received (naira)').fill('500');
  await page.getByRole('button', { name: 'Record repayment' }).last().click();
  await expect(page.getByText('₦1,000').first()).toBeVisible({ timeout: 20_000 });
});
