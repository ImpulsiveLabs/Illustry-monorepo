import { APIRequestContext, APIResponse, expect, test } from './fixtures';

const BACKEND_BASE_URL = process.env.BACKEND_E2E_URL || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || '7011'}`;

const parseBody = async (response: APIResponse): Promise<unknown> => {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const extractError = (body: unknown): string => {
  if (body && typeof body === 'object' && 'error' in body) {
    return String((body as { error?: unknown }).error ?? '');
  }
  return '';
};

const expectNoApiError = (body: unknown, context: string) => {
  expect(extractError(body), `${context}: ${JSON.stringify(body)}`).toBe('');
};

const withApiRetry = async <T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;
      const message = String(error);
      const isTransientNetworkError = message.includes('ECONNRESET') || message.includes('socket hang up');
      if (!isTransientNetworkError || attempt >= maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  throw lastError;
};

const createProject = async (api: APIRequestContext, projectName: string, isActive: boolean) => {
  await withApiRetry(() => api.delete('/api/project', { data: { name: projectName } }));
  const response = await withApiRetry(() => api.post('/api/project', {
    data: {
      projectName,
      projectDescription: `frontend e2e project ${projectName}`,
      isActive
    }
  }));
  const body = await parseBody(response);
  expect(response.ok()).toBeTruthy();

  if (extractError(body).includes('There already is a project named')) {
    const activateResponse = await api.put('/api/project', {
      data: {
        name: projectName,
        description: `frontend e2e project ${projectName}`,
        isActive
      }
    });
    const activateBody = await parseBody(activateResponse);
    expect(activateResponse.ok()).toBeTruthy();
    expectNoApiError(activateBody, 'update existing project');
    return;
  }

  expectNoApiError(body, 'create project');
};

const deleteProjectSilently = async (api: APIRequestContext, projectName: string) => {
  await withApiRetry(() => api.delete('/api/project', { data: { name: projectName } }));
};

test.describe('frontend additional main flows', () => {
  test.describe.configure({ mode: 'serial' });

  test('navigation guards reflect active project state', async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile, 'Desktop-only nav guard flow.');
    await page.goto('/');

    await page.evaluate(() => localStorage.setItem('activeProject', 'false'));
    await page.reload();
    await expect(page.getByRole('link', { name: 'Visualizations' }).first()).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('link', { name: 'Dashboards' }).first()).toHaveAttribute('aria-disabled', 'true');

    await page.evaluate(() => localStorage.setItem('activeProject', 'true'));
    await page.reload();
    await expect(page.getByRole('link', { name: 'Visualizations' }).first()).not.toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('link', { name: 'Dashboards' }).first()).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('projects bulk delete from table action removes all selected rows', async ({ page, playwright }) => {
    test.skip(!!test.info().project.use.isMobile, 'Desktop-only table bulk flow.');
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const projectsToDelete = Array.from(
      { length: 3 },
      (_, index) => `pw-ui-bulk-delete-${suffix}-${index}`
    );

    const api = await playwright.request.newContext({ baseURL: BACKEND_BASE_URL });

    try {
      for (const [index, projectName] of projectsToDelete.entries()) {
        await createProject(api, projectName, index === 0);
      }

      await page.goto(`/projects?text=${encodeURIComponent(`pw-ui-bulk-delete-${suffix}`)}&page=1`);

      await expect(page.locator('tbody tr', { hasText: projectsToDelete[0] as string })).toBeVisible({ timeout: 10000 });
      await page.getByRole('checkbox', { name: 'Select all' }).click();
      await page.getByRole('button', { name: 'Delete selected rows' }).click();

      for (const projectName of projectsToDelete) {
        await expect(page.locator('tbody tr', { hasText: projectName })).toHaveCount(0);
      }
    } finally {
      for (const projectName of projectsToDelete) {
        await deleteProjectSilently(api, projectName);
      }
      await api.dispose();
    }
  });

  test('visualization upload flow shows validation toast when no file is selected', async ({ page, playwright }) => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const activeProjectName = `pw-ui-upload-validation-active-${suffix}`;
    const api = await playwright.request.newContext({ baseURL: BACKEND_BASE_URL });

    try {
      await createProject(api, activeProjectName, true);

      await page.goto('/projects');
      await page.goto('/visualizations/new');
      await page.getByRole('tab', { name: 'Mapping' }).click();
      await page.getByRole('button', { name: 'Add Visualizations' }).click();

      await expect(page.getByText('No files selected.')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/visualizations\/new$/);
    } finally {
      await deleteProjectSilently(api, activeProjectName);
      await api.dispose();
    }
  });
});
