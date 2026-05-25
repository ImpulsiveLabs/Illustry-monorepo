/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import { DashboardTypes } from '@illustry/types';
import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';


const browseDashboards = async (filter?: DashboardTypes.DashboardFilter) => {
  const BACKEND = getBackendUrl() as string;

  let newFilter: DashboardTypes.DashboardFilter = {};

  if (filter) {
    newFilter = filter;
  }
  const request = new Request(`${BACKEND as string}/api/dashboards`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true }),
    body: JSON.stringify(newFilter)
  });
  try {
    return await makeRequest<DashboardTypes.ExtendedDashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const deleteDashboard = async (dashboardNameOrFilter: string | DashboardTypes.DashboardFilter) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'DELETE',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(typeof dashboardNameOrFilter === 'string'
      ? { name: dashboardNameOrFilter }
      : dashboardNameOrFilter)
  });
  try {
    return await makeRequest<boolean>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const updateDashboard = async (dashboard: DashboardTypes.DashboardUpdate) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'PUT',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(dashboard)
  });
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const shareDashboard = async (shareRequest: DashboardTypes.DashboardShareRequest) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard/share`, {
    method: 'PUT',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(shareRequest)
  });
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const revokeDashboardShare = async (revokeRequest: DashboardTypes.DashboardShareRevokeRequest) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard/share`, {
    method: 'DELETE',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(revokeRequest)
  });
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const respondToDashboardShareInvite = async (decision: DashboardTypes.DashboardShareInviteDecision) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard/share/respond`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(decision)
  });
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const createDashboard = async (dashboard: DashboardTypes.DashboardCreate) => {
  const BACKEND = getBackendUrl() as string;

  const newDashboard = {
    projectName: dashboard.projectName,
    visualizations: dashboard.visualizations,
    description: dashboard.description,
    name: dashboard.name
  };
  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(newDashboard)
  });
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findOneDashboard = async (dashboardName: string, fullVisualizations: boolean = false) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/dashboard/${dashboardName}`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true }),
      body: JSON.stringify({ name: dashboardName, fullVisualizations })
    }
  );
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findSharedDashboard = async (shareId: string, fullVisualizations: boolean = false) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/dashboard/shared/${shareId}?fullVisualizations=${fullVisualizations ? 'true' : 'false'}`,
    {
      method: 'GET',
      headers: await buildBackendHeaders({ asJson: false, withCsrf: false })
    }
  );
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

type DashboardExcelExportRequest = DashboardTypes.DashboardFilter & {
  sheetName?: string;
  cellRange?: string;
  templateWorkbookBase64?: string;
  templateWorkbookFilename?: string;
};

type DashboardExcelExportResponse = {
  filename: string;
  mimeType: string;
  base64: string;
};

type DashboardBundleExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'web-component' | 'excel' | 'pdf' | 'word' | 'ppt';

type DashboardBundleExportChart = {
  title?: string;
  option: unknown;
  width?: number;
  height?: number;
};

type DashboardBundleExportRequest = DashboardTypes.DashboardFilter & {
  sheetName?: string;
  cellRange?: string;
  templateWorkbookBase64?: string;
  templateWorkbookFilename?: string;
  formats: DashboardBundleExportFormat[];
  charts: DashboardBundleExportChart[];
  title?: string;
};

type DashboardBundleExportResponse = DashboardExcelExportResponse & {
  bundled: boolean;
};

const getFilenameFromDisposition = (contentDisposition: string | null, fallback: string) => {
  const matched = contentDisposition?.match(/filename="?([^"]+)"?/);
  return matched?.[1] || fallback;
};

const exportDashboardExcel = async (
  exportRequest: DashboardExcelExportRequest
): Promise<DashboardExcelExportResponse | null> => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard/export/excel`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(exportRequest)
  });

  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      filename: getFilenameFromDisposition(response.headers.get('content-disposition'), 'illustry-dashboard.xlsx'),
      mimeType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: buffer.toString('base64')
    };
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const exportDashboardBundle = async (
  exportRequest: DashboardBundleExportRequest
): Promise<DashboardBundleExportResponse | null> => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard/export/bundle`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(exportRequest)
  });

  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      filename: getFilenameFromDisposition(response.headers.get('content-disposition'), 'illustry-dashboard-export'),
      mimeType: response.headers.get('content-type') || 'application/octet-stream',
      base64: buffer.toString('base64'),
      bundled: response.headers.get('x-illustry-bundled') === 'true'
    };
  } catch (err) {
    console.debug(err);
    return null;
  }
};

export {
  browseDashboards,
  deleteDashboard,
  updateDashboard,
  shareDashboard,
  revokeDashboardShare,
  respondToDashboardShareInvite,
  createDashboard,
  findOneDashboard,
  findSharedDashboard,
  exportDashboardExcel,
  exportDashboardBundle
};
export type {
  DashboardExcelExportRequest,
  DashboardExcelExportResponse,
  DashboardBundleExportChart,
  DashboardBundleExportFormat,
  DashboardBundleExportRequest,
  DashboardBundleExportResponse
};
