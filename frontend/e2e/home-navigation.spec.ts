import { expect, test } from './fixtures';

test('home page renders and navigates to theme + playground', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('your data!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible();

  if (test.info().project.use.isMobile) {
    await page.getByRole('button', { name: 'Toggle Menu' }).click();
  }

  await page.getByRole('link', { name: 'Theme' }).first().click();
  await expect(page).toHaveURL(/\/theme$/);
  await expect(page.getByText('Default Schemes')).toBeVisible();

  if (test.info().project.use.isMobile) {
    await page.getByRole('button', { name: 'Toggle Menu' }).click();
  }
  const playgroundLink = page.getByRole('link', { name: 'Playground' }).first();
  if ((await playgroundLink.getAttribute('aria-disabled')) !== 'true') {
    await page.keyboard.press('Escape');
    await playgroundLink.scrollIntoViewIfNeeded();
    await playgroundLink.click();
    await expect(page).toHaveURL(/\/playground$/);
    if (!test.info().project.use.isMobile) {
      await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    }
  }
});
