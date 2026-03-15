import { expect, test } from './fixtures';

test('mobile navigation drawer opens and routes to theme', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Run this flow on chromium engine only.');
  test.skip(!test.info().project.use.isMobile, 'This scenario is mobile-only.');

  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle Menu' }).click();
  await expect(page.getByRole('link', { name: 'Theme' })).toBeVisible();
  await page.getByRole('link', { name: 'Theme' }).click();
  await expect(page).toHaveURL(/\/theme$/);
});
