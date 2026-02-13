import { expect, test } from '@playwright/test';

test('launch and restart flow works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pinball Lab' })).toBeVisible();

  await page.keyboard.down('Space');
  await page.waitForTimeout(300);
  await page.keyboard.up('Space');

  await page.waitForTimeout(1200);
  page.once('dialog', async (dialog) => dialog.accept());
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(250);

  await expect(page.getByText('ターゲット3枚を揃えるとミッションボーナス + 倍率UP')).toBeVisible();
});
