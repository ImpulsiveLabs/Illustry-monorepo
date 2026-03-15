import { expect, test } from './fixtures';

test('theme page supports switching sections and opening color picker', async ({ page }) => {
  await page.goto('/theme');

  await page.getByText('Default Schemes').click();
  await expect(page.locator('[role="button"]').first()).toBeVisible();

  await page.getByText('Sankey Diagram').click();
  await expect(page.getByRole('tab', { name: 'Light' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Dark' })).toBeVisible();

  await page.getByLabel('Open color picker light 1').click();
  await expect(page.getByLabel('Close color picker')).toBeVisible();
  await page.getByLabel('Close color picker').click();
});
