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

const createActiveProject = async (api: APIRequestContext, projectName: string) => {
  await api.delete('/api/project', { data: { name: projectName } });
  const response = await api.post('/api/project', {
    data: {
      projectName,
      projectDescription: `smoke project ${projectName}`,
      isActive: true
    }
  });
  const body = await parseBody(response);
  expect(response.ok()).toBeTruthy();
  if (extractError(body).includes('There already is a project named')) {
    const activate = await api.put('/api/project', {
      data: { name: projectName, isActive: true }
    });
    const activateBody = await parseBody(activate);
    expect(activate.ok()).toBeTruthy();
    expectNoApiError(activateBody, 'activate existing project');
    return;
  }
  expectNoApiError(body, 'create active project');
};

const uploadVisualization = async (api: APIRequestContext, visualizationName: string) => {
  await api.delete('/api/visualization', {
    data: { name: visualizationName, type: 'sankey' }
  });

  const response = await api.post('/api/visualization', {
    multipart: {
      fullDetails: 'false',
      fileDetails: JSON.stringify({ fileType: 'JSON' }),
      visualizationDetails: JSON.stringify({
        name: visualizationName,
        type: 'sankey',
        description: `smoke visualization ${visualizationName}`,
        tags: ['smoke']
      }),
      file: {
        name: 'sankey-smoke.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({
          nodes: [
            { name: 'Node1', category: '1' },
            { name: 'Node2', category: '2' }
          ],
          links: [
            { source: 'Node1', target: 'Node2', value: 1 }
          ]
        }))
      }
    }
  });

  const body = await parseBody(response);
  expect(response.ok()).toBeTruthy();
  expectNoApiError(body, 'upload visualization');
};

const createDashboard = async (api: APIRequestContext, dashboardName: string, visualizationName: string) => {
  await api.delete('/api/dashboard', { data: { name: dashboardName } });

  const response = await api.post('/api/dashboard', {
    data: {
      name: dashboardName,
      description: `smoke dashboard ${dashboardName}`,
      visualizations: {
        [`${visualizationName}_sankey`]: 'sankey'
      }
    }
  });

  const body = await parseBody(response);
  expect(response.ok()).toBeTruthy();
  expectNoApiError(body, 'create dashboard');
};

test('all major frontend pages render without runtime crash', async ({ page, playwright }) => {
  test.skip(!!test.info().project.use.isMobile, 'Desktop smoke only.');

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const projectName = `pw-smoke-project-${suffix}`;
  const visualizationName = `pw-smoke-viz-${suffix}`;
  const dashboardName = `pw-smoke-dashboard-${suffix}`;
  const api = await playwright.request.newContext({ baseURL: BACKEND_BASE_URL });

  try {
    await createActiveProject(api, projectName);
    await uploadVisualization(api, visualizationName);
    await createDashboard(api, dashboardName, visualizationName);

    const pages = [
      '/',
      '/projects',
      '/projects/new',
      '/visualizations',
      '/visualizations/new',
      '/dashboards',
      '/dashboards/new',
      '/theme',
      '/playground',
      `/visualizationhub?name=${visualizationName}&type=sankey`,
      `/dashboardhub?name=${dashboardName}`
    ];

    for (const route of pages) {
      await page.goto(route);
      await expect(page.getByText('Application error: a client-side exception has occurred')).toHaveCount(0);
      await expect(page.locator('body')).toBeVisible();
    }
  } finally {
    await api.delete('/api/dashboard', { data: { name: dashboardName } });
    await api.delete('/api/visualization', { data: { name: visualizationName, type: 'sankey' } });
    await api.delete('/api/project', { data: { name: projectName } });
    await api.dispose();
  }
});
