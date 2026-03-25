import {
  APIRequestContext,
  APIResponse,
  Page,
  expect,
  test
} from './fixtures';

const BACKEND_BASE_URL = process.env.BACKEND_E2E_URL || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || '7011'}`;
const sankeyFixtureBuffer = Buffer.from(
  JSON.stringify({
    nodes: [
      { name: 'Node1', category: '1', properties: 'a' },
      { name: 'Node2', category: '2', properties: 'b' }
    ],
    links: [
      {
        source: 'Node1',
        target: 'Node2',
        value: 1,
        properties: 'link'
      }
    ]
  })
);

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

const createProject = async (api: APIRequestContext, projectName: string, isActive: boolean) => {
  await api.delete('/api/project', {
    data: { name: projectName }
  });

  const response = await api.post('/api/project', {
    data: {
      projectName,
      projectDescription: `frontend e2e project ${projectName}`,
      isActive
    }
  });

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

const uploadSankeyVisualization = async (api: APIRequestContext, visualizationName: string) => {
  await api.delete('/api/visualization', {
    data: {
      name: visualizationName,
      type: 'sankey'
    }
  });

  const uploadResponse = await api.post('/api/visualization', {
    multipart: {
      fullDetails: 'false',
      fileDetails: JSON.stringify({ fileType: 'JSON' }),
      visualizationDetails: JSON.stringify({
        name: visualizationName,
        type: 'sankey',
        description: `frontend e2e visualization ${visualizationName}`,
        tags: ['frontend', 'e2e']
      }),
      file: {
        name: 'sankey-upload.json',
        mimeType: 'application/json',
        buffer: sankeyFixtureBuffer
      }
    }
  });

  const uploadBody = await parseBody(uploadResponse);
  expect(uploadResponse.ok()).toBeTruthy();
  expectNoApiError(uploadBody, 'upload sankey visualization');
};

const createDashboard = async (
  api: APIRequestContext,
  dashboardName: string,
  visualizationName: string
) => {
  await api.delete('/api/dashboard', {
    data: { name: dashboardName }
  });

  const response = await api.post('/api/dashboard', {
    data: {
      name: dashboardName,
      description: `frontend e2e dashboard ${dashboardName}`,
      visualizations: {
        [`${visualizationName}_sankey`]: 'sankey'
      }
    }
  });

  const body = await parseBody(response);
  expect(response.ok()).toBeTruthy();
  expectNoApiError(body, 'create dashboard');
};

const deleteDashboardSilently = async (api: APIRequestContext, dashboardName: string) => {
  await api.delete('/api/dashboard', {
    data: { name: dashboardName }
  });
};

const deleteVisualizationSilently = async (api: APIRequestContext, visualizationName: string) => {
  await api.delete('/api/visualization', {
    data: {
      name: visualizationName,
      type: 'sankey'
    }
  });
};

const deleteProjectSilently = async (api: APIRequestContext, projectName: string) => {
  await api.delete('/api/project', {
    data: { name: projectName }
  });
};

const clickMenuItem = async (page: Page, label: string) => {
  const menuItem = page.getByRole('menuitem', { name: label }).first();
  await expect(menuItem).toBeVisible();
  await menuItem.evaluate((el) => (el as HTMLElement).click());
};

test.describe('frontend page functionality e2e', () => {
  test.describe.configure({ mode: 'serial' });

  test('table action menus navigate to view/edit pages', async ({ page, playwright }) => {
    test.skip(!!test.info().project.use.isMobile, 'Desktop-only table actions flow.');
    test.setTimeout(90000);

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const projectName = `pw-ui-action-project-${suffix}`;
    const visualizationName = `pw-ui-action-viz-${suffix}`;
    const dashboardName = `pw-ui-action-dashboard-${suffix}`;

    const api = await playwright.request.newContext({ baseURL: BACKEND_BASE_URL });

    try {
      await createProject(api, projectName, true);
      await uploadSankeyVisualization(api, visualizationName);

      await page.goto('/dashboards/new');
      await page.getByPlaceholder('Type dashboard name here.').fill(dashboardName);
      await page.getByPlaceholder('Type dashboard description here.').fill(`frontend e2e dashboard ${dashboardName}`);
      await page.getByRole('button', { name: 'Create dashboard' }).click();
      await expect(page).toHaveURL(/\/dashboards(\?|$)/);

      await page.goto(`/dashboards?text=${encodeURIComponent(dashboardName)}&page=1`);
      const dashboardRow = page.locator('tbody tr', { hasText: dashboardName }).first();
      await expect(dashboardRow).toBeVisible({ timeout: 15000 });

      await dashboardRow.getByRole('button', { name: 'Open row actions' }).click();
      await clickMenuItem(page, 'View');
      await expect(page).toHaveURL(new RegExp(`/dashboardhub\\?name=${dashboardName}$`));

      await page.goto(`/dashboards?text=${encodeURIComponent(dashboardName)}&page=1`);
      const dashboardRowToEdit = page.locator('tbody tr', { hasText: dashboardName }).first();
      await dashboardRowToEdit.getByRole('button', { name: 'Open row actions' }).click();
      await clickMenuItem(page, 'Edit');
      await expect(page).toHaveURL(new RegExp(`/dashboards/${dashboardName}$`));

      await page.goto(`/visualizations?text=${encodeURIComponent(visualizationName)}&page=1`);
      const visualizationRow = page.locator('tbody tr', { hasText: visualizationName }).first();
      await expect(visualizationRow).toBeVisible();

      await visualizationRow.getByRole('button', { name: 'Open row actions' }).click();
      await clickMenuItem(page, 'View');
      await expect(page).toHaveURL(new RegExp(`/visualizationhub\\?name=${visualizationName}&type=sankey$`));

      await page.goto(`/projects?text=${encodeURIComponent(projectName)}&page=1`);
      const projectRow = page.locator('tbody tr', { hasText: projectName }).first();
      await expect(projectRow).toBeVisible({ timeout: 15000 });

      await projectRow.getByRole('button', { name: 'Open row actions' }).click();
      await clickMenuItem(page, 'Edit');
      await expect(page).toHaveURL(new RegExp(`/projects/${projectName}$`));
    } finally {
      await deleteDashboardSilently(api, dashboardName);
      await deleteVisualizationSilently(api, visualizationName);
      await deleteProjectSilently(api, projectName);
      await api.dispose();
    }
  });

  test('projects table supports filter, sort, column toggle and pagination controls', async ({ page, playwright }) => {
    test.skip(!!test.info().project.use.isMobile, 'Desktop-only data table controls flow.');
    test.setTimeout(90000);

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const projectPrefix = `pw-ui-controls-${suffix}`;
    const projectNames = Array.from({ length: 12 }, (_, index) => `${projectPrefix}-${String(index).padStart(2, '0')}`);

    const api = await playwright.request.newContext({ baseURL: BACKEND_BASE_URL });

    try {
      await createProject(api, projectNames[0] as string, true);
      for (const projectName of projectNames.slice(1)) {
        await createProject(api, projectName, false);
      }

      await page.goto('/projects');

      const filterInput = page.getByPlaceholder('Filter...');
      await filterInput.fill(projectPrefix);
      await page.waitForTimeout(700);
      await filterInput.press('Enter');
      await expect(page).toHaveURL(new RegExp(`text=${projectPrefix}`));

      await expect(page.locator('tbody tr', { hasText: projectPrefix }).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Page 1 of 2')).toBeVisible();

      await page.getByRole('button', { name: /Click to sort ascending/ }).first().click();
      await clickMenuItem(page, 'Desc');
      await expect(page).toHaveURL(/sort=name.desc/);

      await page.getByRole('button', { name: 'Toggle columns' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'description' }).click();
      await expect(page.locator('thead')).not.toContainText('Description');

      await page.getByRole('button', { name: 'Toggle columns' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'description' }).click();
      await expect(page.locator('thead')).toContainText('Description');

      await page.getByRole('combobox').filter({ hasText: /^10$/ }).click();
      await page.getByRole('option', { name: '20' }).click();
      await expect(page).toHaveURL(/per_page=20/);
      await expect(page.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
    } finally {
      for (const projectName of projectNames) {
        await deleteProjectSilently(api, projectName);
      }
      await api.dispose();
    }
  });

  test('unknown route renders the global not-found page', async ({ page }) => {
    const missingRoute = `/route-does-not-exist-${Date.now()}`;
    await page.goto(missingRoute);

    await expect(page.getByRole('heading', { name: 'Oops! Not Found' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to Main Page' }).click();
    await expect(page).toHaveURL('/');
  });
});
