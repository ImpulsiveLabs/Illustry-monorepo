import { expect, test } from './fixtures';

test('playground can load a preset and submit', async ({ page }) => {
  test.skip(!!test.info().project.use.isMobile, 'Playground shell is desktop-only (hidden on mobile).');
  await page.goto('/playground');

  await page.locator('[role="combobox"][aria-label="Load a visualization..."]').click();
  await page.getByText('line-chart').click();

  await expect(page.locator('[role="combobox"][aria-label="Load a visualization..."]')).toContainText(/line-chart/i);

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
});
