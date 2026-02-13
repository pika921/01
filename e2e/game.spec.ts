import { expect, test } from '@playwright/test';

test('launch, score update, flipper reaction and restart work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Neon Orbit Pinball' })).toBeVisible();
  await expect(page.locator('#hud-phase')).toHaveText('READY');
  await expect(page.locator('#hud-score')).toHaveText('SCORE 0');

  await page.keyboard.down('ArrowLeft');
  await expect(page.locator('#left-indicator')).toHaveClass(/active/);
  await page.keyboard.up('ArrowLeft');

  await page.keyboard.down('Space');
  await page.waitForTimeout(450);
  await page.keyboard.up('Space');

  await expect(page.locator('#hud-phase')).toHaveText('PLAYING');
  await expect.poll(async () => {
    const text = (await page.locator('#hud-score').innerText()).replace('SCORE ', '');
    return Number(text);
  }).toBeGreaterThan(0);

  page.once('dialog', async (dialog) => dialog.accept());
  await page.keyboard.press('KeyR');
  await expect(page.locator('#hud-phase')).toHaveText('READY');
});
