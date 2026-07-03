import { expect, test } from './fixtures';
import type { Page } from './fixtures';

const openThemeSettings = async (page: Page) => {
  await page.goto('/playground');
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('menuitem', { name: 'Theme settings' }).click();

  const dialog = page.getByRole('dialog', { name: 'Theme settings' });
  await expect(dialog).toBeVisible();
  return dialog;
};

const readStoredSankeyLightColors = async (page: Page) => page.evaluate(() => {
  const storedTheme = window.localStorage.getItem('appTheme:default');
  if (!storedTheme) {
    return null;
  }

  return JSON.parse(storedTheme).themeConfig.visualizations.sankey.light.colors as string[];
});

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
  test.skip(Boolean(test.info().project.use.isMobile), 'Theme settings user menu is desktop-only.');

  const dialog = await openThemeSettings(page);

  await expect(dialog.getByRole('button', { name: 'Default Schemes' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Import / Export' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Sankey Diagram' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Import / Export' }).click();
  await expect(dialog.getByRole('heading', { name: 'Import / Export' })).toBeVisible();
});

test('theme palette edits apply immediately and persist in local cache', async ({ page }) => {
  test.skip(Boolean(test.info().project.use.isMobile), 'Theme settings user menu is desktop-only.');

  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'light');
  });

  const dialog = await openThemeSettings(page);
  await dialog.getByRole('button', { name: 'Sankey Diagram' }).click();

  const lightTab = dialog.getByRole('tabpanel', { name: 'Light' });
  const initialColorCount = await lightTab.getByRole('textbox', { name: '#FFFFFF' }).count();
  await lightTab.getByRole('button', { name: 'Add color Light' }).click();

  await expect.poll(async () => {
    const colors = await readStoredSankeyLightColors(page);
    return colors?.length ?? 0;
  }).toBe(initialColorCount + 1);
  await expect.poll(async () => {
    const colors = await readStoredSankeyLightColors(page);
    return colors?.at(-1) ?? null;
  }).toBe('#FFFFFF');

  await page.reload();
  await expect.poll(async () => {
    const colors = await readStoredSankeyLightColors(page);
    return colors?.length ?? 0;
  }).toBe(initialColorCount + 1);
});
