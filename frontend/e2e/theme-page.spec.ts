import { expect, test } from './fixtures';

test('theme page supports switching sections and opening color picker', async ({ page }) => {
  await page.goto('/theme');

  await page.getByRole('button', { name: 'Default Schemes' }).first().click();
  await expect(page.locator('[role="button"]').first()).toBeVisible();

  await page.getByRole('button', { name: 'Sankey Diagram' }).click();
  await expect(page.getByRole('tab', { name: 'Light' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Dark' })).toBeVisible();

  await page.getByLabel('Open color picker light 1').click();
  await expect(page.getByLabel('Close color picker')).toBeVisible();
  await page.getByLabel('Close color picker').click();
});

test('theme settings open from the user menu modal', async ({ page }) => {
  await page.goto('/playground');

  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('menuitem', { name: 'Theme settings' }).click();

  await expect(page.getByRole('dialog', { name: 'Theme settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Default Schemes' })).toBeVisible();

  await page.getByRole('button', { name: 'Pages' }).click();
  await expect(page.getByRole('button', { name: /^Projects\s+\/projects$/ })).toBeVisible();
});

test('theme edits apply immediately and survive reload from local cache', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'light');
  });
  await page.goto('/playground');

  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('menuitem', { name: 'Theme settings' }).click();
  await page.getByRole('button', { name: 'Global Colors' }).click();
  await page.locator('#global-light-primary').fill('#ff5500');

  await expect.poll(async () => page.evaluate(() => (
    getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  ))).toBe('20 100% 50%');
  await expect.poll(async () => page.evaluate(() => {
    const storedTheme = window.localStorage.getItem('appTheme:default');
    if (!storedTheme) {
      return null;
    }
    return JSON.parse(storedTheme).themeConfig.global.primary;
  })).toBe('#ff5500');

  await page.reload();

  await expect.poll(async () => page.evaluate(() => (
    getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  ))).toBe('20 100% 50%');
});
