import { APIRequestContext, APIResponse, expect, test } from './fixtures';

const BACKEND_BASE_URL = process.env.BACKEND_E2E_URL || `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || '7011'}`;
const sankeyFixtureBuffer = Buffer.from(
  JSON.stringify({
    nodes: [
      { name: 'Node1', category: '1', properties: 'prop1' },
      { name: 'Node2', category: '2', properties: 'prop2' }
    ],
    links: [
      {
        source: 'Node1',
        target: 'Node2',
        value: 1,
        properties: 'linkprop'
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

const createActiveProject = async (api: APIRequestContext, projectName: string) => {
  await api.delete('/api/project', {
    data: { name: projectName }
  });

  const createProjectResponse = await api.post('/api/project', {
    data: {
      projectName,
      projectDescription: `frontend e2e project ${projectName}`,
      isActive: true
    }
  });

  const createProjectBody = await parseBody(createProjectResponse);
  expect(createProjectResponse.ok()).toBeTruthy();
  const createError = extractError(createProjectBody);
  if (createError.includes('There already is a project named')) {
    const activateProjectResponse = await api.put('/api/project', {
      data: {
        name: projectName,
        isActive: true
      }
    });
    const activateProjectBody = await parseBody(activateProjectResponse);
    expect(activateProjectResponse.ok()).toBeTruthy();
    expectNoApiError(activateProjectBody, 'activate existing project');
    return;
  }
  expectNoApiError(createProjectBody, 'create active project');
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
        name: 'Sankey_PartialDetails.json',
        mimeType: 'application/json',
        buffer: sankeyFixtureBuffer
      }
    }
  });

  const uploadBody = await parseBody(uploadResponse);
  expect(uploadResponse.ok()).toBeTruthy();
  expectNoApiError(uploadBody, 'upload sankey visualization');
  expect(Array.isArray(uploadBody)).toBeTruthy();
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

test.describe('frontend data CRUD e2e', () => {
  test.describe.configure({ mode: 'serial' });

  test('projects: create, update, and delete from the UI', async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile, 'Desktop-only CRUD flow.');

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const projectName = `pw-ui-project-${suffix}`;
    const updatedDescription = `pw-ui-updated-description-${suffix}`;

    await page.goto('/projects/new');

    await page.getByPlaceholder('Type project name here.').fill(projectName);
    await page.getByPlaceholder('Type project description here.').fill(`pw-ui-description-${suffix}`);
    await page.getByRole('checkbox').first().click();
    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page).toHaveURL(/\/projects(\?|$)/);

    const filterInput = page.getByPlaceholder('Filter...');
    await filterInput.fill(projectName);
    await page.waitForTimeout(700);
    await filterInput.press('Enter');

    const createdRow = page.locator('tbody tr', { hasText: projectName }).first();
    await expect(createdRow).toBeVisible();

    await page.goto(`/projects/${projectName}`);
    await expect(page).toHaveURL(new RegExp(`/projects/${projectName}$`));

    await page.getByRole('textbox', { name: 'Description' }).first().fill(updatedDescription);
    await page.getByRole('button', { name: 'Update project' }).click();

    await expect(page).toHaveURL(/\/projects(\?|$)/);
    await filterInput.fill(projectName);
    await page.waitForTimeout(700);
    await filterInput.press('Enter');

    const updatedRow = page.locator('tbody tr', { hasText: projectName }).first();
    await expect(updatedRow).toBeVisible();
    await updatedRow.getByRole('checkbox', { name: 'Select row' }).click();
    await page.getByRole('button', { name: 'Delete selected rows' }).click();

    await expect(page.locator('tbody tr', { hasText: projectName })).toHaveCount(0);
  });

  test('visualizations: view and bulk-delete from the UI', async ({ page, playwright }) => {
    test.skip(!!test.info().project.use.isMobile, 'Desktop-only CRUD flow.');

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const projectName = `pw-ui-project-viz-${suffix}`;
    const visualizationName = `pw-ui-viz-${suffix}`;

    const api = await playwright.request.newContext({ baseURL: BACKEND_BASE_URL });

    try {
      await createActiveProject(api, projectName);
      await uploadSankeyVisualization(api, visualizationName);

      await page.goto(`/visualizations?text=${encodeURIComponent(visualizationName)}&page=1`);

      const row = page.locator('tbody tr', { hasText: visualizationName }).first();
      await expect(row).toBeVisible({ timeout: 15000 });
      await row.getByRole('checkbox', { name: 'Select row' }).click();

      await page.getByRole('button', { name: 'Delete selected rows' }).click();
      await expect(page.locator('tbody tr', { hasText: visualizationName })).toHaveCount(0);
    } finally {
      await deleteVisualizationSilently(api, visualizationName);
      await deleteProjectSilently(api, projectName);
      await api.dispose();
    }
  });

  test('dashboards: create, view, update, and delete from the UI', async ({ page, playwright }) => {
    test.skip(!!test.info().project.use.isMobile, 'Desktop-only CRUD flow.');

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const projectName = `pw-ui-project-dash-${suffix}`;
    const visualizationName = `pw-ui-dashboard-viz-${suffix}`;
    const dashboardName = `pw-ui-dashboard-${suffix}`;

    const api = await playwright.request.newContext({ baseURL: BACKEND_BASE_URL });

    try {
      await createActiveProject(api, projectName);
      await uploadSankeyVisualization(api, visualizationName);

      await page.goto('/dashboards/new');

      await page.getByPlaceholder('Type dashboard name here.').fill(dashboardName);
      await page.getByPlaceholder('Type dashboard description here.').fill(`pw-ui-dashboard-description-${suffix}`);

      await page.getByRole('button', { name: 'Create dashboard' }).click();
      await expect(page).toHaveURL(/\/dashboards(\?|$)/);

      const createdRow = page.locator('tbody tr', { hasText: dashboardName }).first();
      await expect(createdRow).toBeVisible({ timeout: 15000 });

      await page.goto(`/dashboardhub?name=${dashboardName}`);
      await expect(page).toHaveURL(new RegExp(`/dashboardhub\\?name=${dashboardName}$`));

      await page.goto('/dashboards');

      const rowToEdit = page.locator('tbody tr', { hasText: dashboardName }).first();
      await expect(rowToEdit).toBeVisible();

      await page.goto(`/dashboards/${dashboardName}`);
      await expect(page).toHaveURL(new RegExp(`/dashboards/${dashboardName}$`));
      await page.getByRole('textbox', { name: 'Description' }).first().fill(`pw-ui-dashboard-updated-${suffix}`);
      await page.getByRole('button', { name: 'Update dashboard' }).click();

      await expect(page).toHaveURL(/\/dashboards(\?|$)/);

      const rowToDelete = page.locator('tbody tr', { hasText: dashboardName }).first();
      await expect(rowToDelete).toBeVisible();
      await rowToDelete.getByRole('checkbox', { name: 'Select row' }).click();
      await page.getByRole('button', { name: 'Delete selected rows' }).click();

      await expect(page.locator('tbody tr', { hasText: dashboardName })).toHaveCount(0);
    } finally {
      await deleteDashboardSilently(api, dashboardName);
      await deleteVisualizationSilently(api, visualizationName);
      await deleteProjectSilently(api, projectName);
      await api.dispose();
    }
  });
});
