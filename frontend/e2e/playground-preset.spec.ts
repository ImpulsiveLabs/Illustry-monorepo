import { expect, test } from './fixtures';

test('playground can load a preset and submit', async ({ page }) => {
  test.skip(!!test.info().project.use.isMobile, 'Playground shell is desktop-only (hidden on mobile).');
  await page.goto('/playground');

  const presetCombobox = page.locator('[role="combobox"][aria-label="Load a visualization..."]');
  await presetCombobox.click();
  await page.getByPlaceholder(/Search/i).fill('line');
  await page.getByRole('option', { name: /line chart/i }).first().click();

  await expect(presetCombobox).toContainText(/line chart/i);

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
});
