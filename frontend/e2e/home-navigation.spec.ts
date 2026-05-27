import { expect, test } from './fixtures';

test('home page renders and theme + playground routes load', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('your data!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible();

  await page.goto('/playground');
  await expect(page).toHaveURL(/\/playground$/);
  if (!test.info().project.use.isMobile) {
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  }

  await page.goto('/theme');
  await expect(page).toHaveURL(/\/theme$/);
  await expect(page.getByRole('heading', { name: 'Default Schemes' })).toBeVisible();
});
