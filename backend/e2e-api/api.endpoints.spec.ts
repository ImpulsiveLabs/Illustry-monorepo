import fs from 'fs';
import path from 'path';
import { APIRequestContext, APIResponse, expect, test } from '@playwright/test';

const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const projectName = `pw-project-${id}`;
const secondaryProjectName = `pw-project-secondary-${id}`;
const dashboardName = `pw-dashboard-${id}`;
const jsonVisualizationName = `pw-viz-json-${id}`;
const fullDetailsVisualizationName = 'Sankey_FullDetails';
const visualizationType = 'sankey';

const fixturePath = (relativePath: string) => path.resolve(__dirname, relativePath);

const fixtures = {
  json: fixturePath('../__tests_resources__/json/Sankey_PartialDetails.json'),
  xml: fixturePath('../__tests_resources__/xml/Sankey_FullDetails.xml'),
  csv: fixturePath('../__tests_resources__/csv/Sankey_FullDetails.csv'),
  excel: fixturePath('../__tests_resources__/excel/Sankey_FullDetails.xlsx')
};

const sankeyNodeLinkMapping = {
  nodes: '1',
  categories: '2',
  properties: '3',
  visualizationName: '4',
  visualizationDescription: '5',
  visualizationTags: '6',
  sources: '7',
  targets: '8',
  values: '9'
};

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

const uploadVisualization = async (
  request: APIRequestContext,
  options: {
    fixture: string;
    filename: string;
    mimeType: string;
    fullDetails: boolean;
    fileDetails: Record<string, unknown>;
    visualizationDetails: Record<string, unknown>;
  }
) => {
  const response = await request.post('/api/visualization', {
    multipart: {
      fullDetails: String(options.fullDetails),
      fileDetails: JSON.stringify(options.fileDetails),
      visualizationDetails: JSON.stringify(options.visualizationDetails),
      file: {
        name: options.filename,
        mimeType: options.mimeType,
        buffer: fs.readFileSync(options.fixture)
      }
    }
  });

  const body = await parseBody(response);
  return { response, body };
};

test.describe.serial('API coverage - project/dashboard/visualization', () => {
  test('project endpoints: validation, create, browse, find, update, duplicate, delete', async ({ request }) => {
    const invalidCreate = await request.post('/api/project', {
      data: { projectDescription: 'missing name' }
    });
    const invalidCreateBody = await parseBody(invalidCreate);
    expect(invalidCreate.ok()).toBeTruthy();
    expect(extractError(invalidCreateBody)).toContain('name');

    const createPrimary = await request.post('/api/project', {
      data: {
        projectName,
        projectDescription: 'playwright api primary project',
        isActive: true
      }
    });
    const createPrimaryBody = await parseBody(createPrimary);
    expect(createPrimary.ok()).toBeTruthy();
    expectNoApiError(createPrimaryBody, 'create primary project');
    expect((createPrimaryBody as { name: string }).name).toBe(projectName);

    const createSecondary = await request.post('/api/project', {
      data: {
        projectName: secondaryProjectName,
        projectDescription: 'playwright api secondary project',
        isActive: false
      }
    });
    const createSecondaryBody = await parseBody(createSecondary);
    expect(createSecondary.ok()).toBeTruthy();
    expectNoApiError(createSecondaryBody, 'create secondary project');
    expect((createSecondaryBody as { name: string }).name).toBe(secondaryProjectName);

    const duplicateCreate = await request.post('/api/project', {
      data: {
        projectName,
        projectDescription: 'duplicate project',
        isActive: true
      }
    });
    const duplicateCreateBody = await parseBody(duplicateCreate);
    expect(duplicateCreate.ok()).toBeTruthy();
    expect(extractError(duplicateCreateBody)).toContain('There already is a project named');

    const browse = await request.post('/api/projects', {
      data: {
        text: id,
        page: 1,
        per_page: 5,
        sort: {
          element: 'name',
          sortOrder: 1
        }
      }
    });
    const browseBody = await parseBody(browse) as {
      projects?: Array<{ name: string }>;
      pagination?: { count: number };
    };
    expect(browse.ok()).toBeTruthy();
    expectNoApiError(browseBody, 'browse projects');
    expect(Array.isArray(browseBody.projects)).toBeTruthy();
    expect(browseBody.projects?.some((project) => project.name === projectName)).toBeTruthy();
    expect(browseBody.projects?.some((project) => project.name === secondaryProjectName)).toBeTruthy();
    expect((browseBody.pagination?.count ?? 0) >= 2).toBeTruthy();

    const findPrimary = await request.post(`/api/project/${projectName}`, { data: {} });
    const findPrimaryBody = await parseBody(findPrimary);
    expect(findPrimary.ok()).toBeTruthy();
    expectNoApiError(findPrimaryBody, 'find primary project');
    expect((findPrimaryBody as { name: string }).name).toBe(projectName);

    const deactivatePrimary = await request.put('/api/project', {
      data: {
        name: projectName,
        description: 'updated and deactivated by playwright api',
        isActive: false
      }
    });
    const deactivatePrimaryBody = await parseBody(deactivatePrimary);
    expect(deactivatePrimary.ok()).toBeTruthy();
    expectNoApiError(deactivatePrimaryBody, 'deactivate primary project');
    expect((deactivatePrimaryBody as { name: string }).name).toBe(projectName);

    const reactivatePrimary = await request.put('/api/project', {
      data: {
        name: projectName,
        description: 'reactivated by playwright api',
        isActive: true
      }
    });
    const reactivatePrimaryBody = await parseBody(reactivatePrimary);
    expect(reactivatePrimary.ok()).toBeTruthy();
    expectNoApiError(reactivatePrimaryBody, 'reactivate primary project');
    expect((reactivatePrimaryBody as { isActive?: boolean }).isActive).toBeTruthy();

    const deleteSecondary = await request.delete('/api/project', {
      data: { name: secondaryProjectName }
    });
    const deleteSecondaryBody = await parseBody(deleteSecondary);
    expect(deleteSecondary.ok()).toBeTruthy();
    expectNoApiError(deleteSecondaryBody, 'delete secondary project');
    expect(deleteSecondaryBody).toBe(true);

    const findMissingSecondary = await request.post(`/api/project/${secondaryProjectName}`, { data: {} });
    const findMissingSecondaryBody = await parseBody(findMissingSecondary);
    expect(findMissingSecondary.ok()).toBeTruthy();
    expect(extractError(findMissingSecondaryBody)).toContain('No project was found with name');
  });

  test('visualization endpoints: upload JSON/XML/CSV/EXCEL, browse, find, validation, delete', async ({ request }) => {
    const jsonUpload = await uploadVisualization(request, {
      fixture: fixtures.json,
      filename: 'Sankey_PartialDetails.json',
      mimeType: 'application/json',
      fullDetails: false,
      fileDetails: { fileType: 'JSON' },
      visualizationDetails: {
        name: jsonVisualizationName,
        type: visualizationType,
        description: 'upload from playwright api JSON branch',
        tags: ['e2e', 'api', 'json']
      }
    });
    expect(jsonUpload.response.ok()).toBeTruthy();
    expectNoApiError(jsonUpload.body, 'upload json visualization');
    expect(Array.isArray(jsonUpload.body)).toBeTruthy();
    expect((jsonUpload.body as Array<{ name: string }>)[0]?.name).toBe(jsonVisualizationName);

    const xmlUpload = await uploadVisualization(request, {
      fixture: fixtures.xml,
      filename: 'Sankey_FullDetails.xml',
      mimeType: 'text/xml',
      fullDetails: true,
      fileDetails: { fileType: 'XML' },
      visualizationDetails: {
        type: visualizationType
      }
    });
    expect(xmlUpload.response.ok()).toBeTruthy();
    expectNoApiError(xmlUpload.body, 'upload xml visualization');
    expect(Array.isArray(xmlUpload.body)).toBeTruthy();
    expect((xmlUpload.body as Array<{ name: string }>)[0]?.name).toBe(fullDetailsVisualizationName);

    const csvUpload = await uploadVisualization(request, {
      fixture: fixtures.csv,
      filename: 'Sankey_FullDetails.csv',
      mimeType: 'text/csv',
      fullDetails: true,
      fileDetails: {
        fileType: 'CSV',
        separator: ',',
        includeHeaders: true,
        mapping: sankeyNodeLinkMapping,
        sheets: '1'
      },
      visualizationDetails: {
        type: visualizationType
      }
    });
    expect(csvUpload.response.ok()).toBeTruthy();
    expectNoApiError(csvUpload.body, 'upload csv visualization');
    expect(Array.isArray(csvUpload.body)).toBeTruthy();

    const excelUpload = await uploadVisualization(request, {
      fixture: fixtures.excel,
      filename: 'Sankey_FullDetails.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fullDetails: true,
      fileDetails: {
        fileType: 'EXCEL',
        includeHeaders: true,
        mapping: sankeyNodeLinkMapping,
        sheets: '1'
      },
      visualizationDetails: {
        type: visualizationType
      }
    });
    expect(excelUpload.response.ok()).toBeTruthy();
    expectNoApiError(excelUpload.body, 'upload excel visualization');
    expect(Array.isArray(excelUpload.body)).toBeTruthy();

    const browseJson = await request.post('/api/visualizations', { data: { text: jsonVisualizationName } });
    const browseJsonBody = await parseBody(browseJson) as {
      visualizations?: Array<{ name: string }>;
    };
    expect(browseJson.ok()).toBeTruthy();
    expectNoApiError(browseJsonBody, 'browse json visualization');
    expect(browseJsonBody.visualizations?.some((v) => v.name === jsonVisualizationName)).toBeTruthy();

    const browseFullDetails = await request.post('/api/visualizations', {
      data: {
        text: fullDetailsVisualizationName,
        sort: {
          element: 'name',
          sortOrder: -1
        }
      }
    });
    const browseFullDetailsBody = await parseBody(browseFullDetails) as {
      visualizations?: Array<{ name: string }>;
    };
    expect(browseFullDetails.ok()).toBeTruthy();
    expectNoApiError(browseFullDetailsBody, 'browse full details visualization');
    expect(browseFullDetailsBody.visualizations?.some((v) => v.name === fullDetailsVisualizationName)).toBeTruthy();

    const findJson = await request.post(`/api/visualization/${jsonVisualizationName}`, {
      data: { type: visualizationType }
    });
    const findJsonBody = await parseBody(findJson);
    expect(findJson.ok()).toBeTruthy();
    expectNoApiError(findJsonBody, 'find json visualization');
    expect((findJsonBody as { name: string }).name).toBe(jsonVisualizationName);

    const invalidUpload = await request.post('/api/visualization', {
      data: {
        fullDetails: false
      }
    });
    const invalidUploadBody = await parseBody(invalidUpload);
    expect(invalidUpload.ok()).toBeTruthy();
    expect(extractError(invalidUploadBody)).toContain('No file details were provided');

    const invalidFileTypeUpload = await uploadVisualization(request, {
      fixture: fixtures.json,
      filename: 'Sankey_PartialDetails.json',
      mimeType: 'application/json',
      fullDetails: false,
      fileDetails: { fileType: 'INVALID_FORMAT' },
      visualizationDetails: {
        name: `pw-viz-invalid-${id}`,
        type: visualizationType,
        description: 'invalid file type upload',
        tags: ['invalid']
      }
    });
    expect(invalidFileTypeUpload.response.ok()).toBeTruthy();
    expect(extractError(invalidFileTypeUpload.body)).toContain('Invalid file type provided');

    const deleteJson = await request.delete('/api/visualization', {
      data: {
        name: jsonVisualizationName,
        type: visualizationType,
        projectName
      }
    });
    const deleteJsonBody = await parseBody(deleteJson);
    expect(deleteJson.ok()).toBeTruthy();
    expectNoApiError(deleteJsonBody, 'delete json visualization');
    expect(deleteJsonBody).toBe(true);

    const findDeletedJson = await request.post(`/api/visualization/${jsonVisualizationName}`, {
      data: { type: visualizationType }
    });
    const findDeletedJsonBody = await parseBody(findDeletedJson);
    expect(findDeletedJson.ok()).toBeTruthy();
    expect([null, ''].includes(findDeletedJsonBody as null | string)).toBeTruthy();
  });

  test('dashboard endpoints: create, duplicate, browse, find, update modes, filter, invalid find, delete', async ({ request }) => {
    const create = await request.post('/api/dashboard', {
      data: {
        name: dashboardName,
        description: 'playwright api dashboard',
        visualizations: {
          [`${fullDetailsVisualizationName}_${visualizationType}`]: visualizationType
        }
      }
    });
    const createBody = await parseBody(create) as {
      dashboard?: { name: string };
    };
    expect(create.ok()).toBeTruthy();
    expectNoApiError(createBody, 'create dashboard');
    expect(createBody.dashboard?.name).toBe(dashboardName);

    const duplicate = await request.post('/api/dashboard', {
      data: {
        name: dashboardName,
        description: 'duplicate dashboard',
        visualizations: {
          [`${fullDetailsVisualizationName}_${visualizationType}`]: visualizationType
        }
      }
    });
    const duplicateBody = await parseBody(duplicate);
    expect(duplicate.ok()).toBeTruthy();
    expect(extractError(duplicateBody)).toContain('There already is a Dashboard named');

    const browse = await request.post('/api/dashboards', { data: { text: dashboardName } });
    const browseBody = await parseBody(browse) as {
      dashboards?: Array<{ name: string }>;
    };
    expect(browse.ok()).toBeTruthy();
    expectNoApiError(browseBody, 'browse dashboards');
    expect(browseBody.dashboards?.some((dashboard) => dashboard.name === dashboardName)).toBeTruthy();

    const browseByVisualizationFilter = await request.post('/api/dashboards', {
      data: {
        visualizationName: fullDetailsVisualizationName,
        visualizationType
      }
    });
    const browseByVisualizationFilterBody = await parseBody(browseByVisualizationFilter) as {
      dashboards?: Array<{ name: string }>;
    };
    expect(browseByVisualizationFilter.ok()).toBeTruthy();
    expectNoApiError(browseByVisualizationFilterBody, 'browse dashboards by visualization filter');
    expect(browseByVisualizationFilterBody.dashboards?.some((dashboard) => dashboard.name === dashboardName)).toBeTruthy();

    const find = await request.post(`/api/dashboard/${dashboardName}`, {
      data: { fullVisualizations: false }
    });
    const findBody = await parseBody(find);
    expect(find.ok()).toBeTruthy();
    expectNoApiError(findBody, 'find dashboard without full visualizations');
    expect((findBody as { name: string }).name).toBe(dashboardName);

    const findWithVisualizations = await request.post(`/api/dashboard/${dashboardName}`, {
      data: { fullVisualizations: true }
    });
    const findWithVisualizationsBody = await parseBody(findWithVisualizations) as {
      name?: string;
      visualizations?: Array<{ name: string }>;
    };
    expect(findWithVisualizations.ok()).toBeTruthy();
    expectNoApiError(findWithVisualizationsBody, 'find dashboard with full visualizations');
    expect(findWithVisualizationsBody.name).toBe(dashboardName);
    expect(Array.isArray(findWithVisualizationsBody.visualizations)).toBeTruthy();
    expect(findWithVisualizationsBody.visualizations?.length).toBeGreaterThan(0);

    const updateWithVisualizations = await request.put('/api/dashboard', {
      data: {
        name: dashboardName,
        description: 'updated dashboard with visualizations',
        visualizations: {
          [`${fullDetailsVisualizationName}_${visualizationType}`]: visualizationType
        }
      }
    });
    const updateWithVisualizationsBody = await parseBody(updateWithVisualizations);
    expect(updateWithVisualizations.ok()).toBeTruthy();
    expectNoApiError(updateWithVisualizationsBody, 'update dashboard with visualizations');
    expect((updateWithVisualizationsBody as { name?: string }).name).toBe(dashboardName);

    const updateLayoutsOnly = await request.put('/api/dashboard', {
      data: {
        name: dashboardName,
        layouts: [
          {
            i: '0',
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            minW: 2,
            minH: 2
          }
        ]
      }
    });
    const updateLayoutsOnlyBody = await parseBody(updateLayoutsOnly) as {
      name?: string;
      layouts?: Array<{ i: string }>;
    };
    expect(updateLayoutsOnly.ok()).toBeTruthy();
    expectNoApiError(updateLayoutsOnlyBody, 'update dashboard with layouts only');
    expect(updateLayoutsOnlyBody.name).toBe(dashboardName);
    expect(updateLayoutsOnlyBody.layouts?.length).toBe(1);

    const invalidFind = await request.post('/api/dashboard/does-not-exist', {
      data: {}
    });
    const invalidFindBody = await parseBody(invalidFind);
    expect(invalidFind.ok()).toBeTruthy();
    expect(extractError(invalidFindBody)).toContain('No Dashboard was found with name');

    const del = await request.delete('/api/dashboard', {
      data: { name: dashboardName }
    });
    const delBody = await parseBody(del);
    expect(del.ok()).toBeTruthy();
    expectNoApiError(delBody, 'delete dashboard');
    expect(delBody).toBe(true);
  });

  test('no active project branches: dashboard and visualization APIs return explicit errors', async ({ request }) => {
    const deleteProject = await request.delete('/api/project', {
      data: { name: projectName }
    });
    const deleteProjectBody = await parseBody(deleteProject);
    expect(deleteProject.ok()).toBeTruthy();
    expectNoApiError(deleteProjectBody, 'delete primary project');
    expect(deleteProjectBody).toBe(true);

    const findDeletedProject = await request.post(`/api/project/${projectName}`, { data: {} });
    const findDeletedProjectBody = await parseBody(findDeletedProject);
    expect(findDeletedProject.ok()).toBeTruthy();
    expect(extractError(findDeletedProjectBody)).toContain('No project was found with name');

    const browseVisualizationsWithoutProject = await request.post('/api/visualizations', { data: {} });
    const browseVisualizationsWithoutProjectBody = await parseBody(browseVisualizationsWithoutProject);
    expect(browseVisualizationsWithoutProject.ok()).toBeTruthy();
    expect(extractError(browseVisualizationsWithoutProjectBody)).toContain('No active project');

    const browseDashboardsWithoutProject = await request.post('/api/dashboards', { data: {} });
    const browseDashboardsWithoutProjectBody = await parseBody(browseDashboardsWithoutProject);
    expect(browseDashboardsWithoutProject.ok()).toBeTruthy();
    expect(extractError(browseDashboardsWithoutProjectBody)).toContain('No active project');

    const createDashboardWithoutProject = await request.post('/api/dashboard', {
      data: {
        name: `pw-no-project-dashboard-${id}`,
        description: 'this should fail because no project is active'
      }
    });
    const createDashboardWithoutProjectBody = await parseBody(createDashboardWithoutProject);
    expect(createDashboardWithoutProject.ok()).toBeTruthy();
    expect(extractError(createDashboardWithoutProjectBody)).toContain('No active project');

    const uploadWithoutProject = await uploadVisualization(request, {
      fixture: fixtures.json,
      filename: 'Sankey_PartialDetails.json',
      mimeType: 'application/json',
      fullDetails: false,
      fileDetails: { fileType: 'JSON' },
      visualizationDetails: {
        name: `pw-no-project-viz-${id}`,
        type: visualizationType,
        description: 'this should fail because no project is active'
      }
    });
    expect(uploadWithoutProject.response.ok()).toBeTruthy();
    expect(extractError(uploadWithoutProject.body)).toContain('No active project');

    const deleteVisualizationWithoutProject = await request.delete('/api/visualization', {
      data: {
        name: fullDetailsVisualizationName,
        type: visualizationType
      }
    });
    const deleteVisualizationWithoutProjectBody = await parseBody(deleteVisualizationWithoutProject);
    expect(deleteVisualizationWithoutProject.ok()).toBeTruthy();
    expect(extractError(deleteVisualizationWithoutProjectBody)).toContain('No active project');
  });
});
