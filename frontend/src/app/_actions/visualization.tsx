/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import {
  VisualizationTypes
} from '@illustry/types';
import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';


const browseVisualizations = async (filter?: VisualizationTypes.VisualizationFilter) => {
  const BACKEND = getBackendUrl() as string;

  let newFilter: VisualizationTypes.VisualizationFilter = {};
  if (filter) {
    newFilter = filter;
  }
  const request = new Request(
    `${BACKEND as string}/api/visualizations`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({
        asJson: true,
        extraHeaders: {
          'Cache-Control': 'no-cache'
        }
      }),
      body: JSON.stringify(newFilter)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.ExtendedVisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const deleteVisualization = async (
  visualizationFilter: VisualizationTypes.VisualizationFilter
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization`,
    {
      method: 'DELETE',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(visualizationFilter)
    }
  );
  try {
    return await makeRequest<boolean>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const createOrUpdateVisualization = async (
  form: FormData
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: false, withCsrf: true }),
      body: form
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findOneVisualization = async (
  visualizationFilter: VisualizationTypes.VisualizationFilter
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/${visualizationFilter.name}`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true }),
      body: JSON.stringify(visualizationFilter)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findSharedVisualization = async (shareId: string) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/shared/${shareId}`,
    {
      method: 'GET',
      headers: await buildBackendHeaders({ asJson: false, withCsrf: false })
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findDashboardSharedVisualization = async (
  dashboardShareId: string,
  visualizationFilter: Pick<VisualizationTypes.VisualizationFilter, 'name' | 'type'>
) => {
  const BACKEND = getBackendUrl() as string;
  const params = new URLSearchParams();
  if (visualizationFilter.name) {
    params.set('name', visualizationFilter.name);
  }
  if (typeof visualizationFilter.type === 'string') {
    params.set('type', visualizationFilter.type);
  }

  const request = new Request(
    `${BACKEND as string}/api/visualization/shared-dashboard/${dashboardShareId}?${params.toString()}`,
    {
      method: 'GET',
      headers: await buildBackendHeaders({ asJson: false, withCsrf: false })
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const shareVisualization = async (
  shareRequest: VisualizationTypes.VisualizationShareRequest
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/share`,
    {
      method: 'PUT',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(shareRequest)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const revokeVisualizationShare = async (
  revokeRequest: VisualizationTypes.VisualizationShareRevokeRequest
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/share`,
    {
      method: 'DELETE',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(revokeRequest)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const updateVisualization = async (
  visualizationUpdate: VisualizationTypes.VisualizationUpdate
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization`,
    {
      method: 'PUT',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(visualizationUpdate)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const respondToVisualizationShareInvite = async (
  decision: VisualizationTypes.VisualizationShareInviteDecision
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/share/respond`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(decision)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const syncVisualizationThemes = async (
  theme: Record<string, unknown>,
  realtimeClientId?: string
) => {
  const BACKEND = getBackendUrl() as string;
  if (!BACKEND) {
    return null;
  }

  const request = new Request(
    `${BACKEND as string}/api/visualizations/theme`,
    {
      method: 'PUT',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify({ theme, realtimeClientId })
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationThemeSyncResult>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

type ExcelExportRequest = VisualizationTypes.VisualizationFilter & {
  dashboardShareId?: string;
  sheetName?: string;
  cellRange?: string;
  templateWorkbookBase64?: string;
  templateWorkbookFilename?: string;
};

type ExcelExportResponse = {
  filename: string;
  mimeType: string;
  base64: string;
};

type VisualizationBundleExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'web-component' | 'excel' | 'pdf' | 'word' | 'ppt';

type VisualizationBundleExportChart = {
  title?: string;
  option: unknown;
  width?: number;
  height?: number;
};

type VisualizationBundleExportRequest = VisualizationTypes.VisualizationFilter & {
  dashboardShareId?: string;
  sheetName?: string;
  cellRange?: string;
  templateWorkbookBase64?: string;
  templateWorkbookFilename?: string;
  formats: VisualizationBundleExportFormat[];
  charts: VisualizationBundleExportChart[];
  title?: string;
};

type VisualizationBundleExportResponse = ExcelExportResponse & {
  bundled: boolean;
};

const getFilenameFromDisposition = (contentDisposition: string | null, fallback: string) => {
  const matched = contentDisposition?.match(/filename="?([^"]+)"?/);
  return matched?.[1] || fallback;
};

const exportVisualizationExcel = async (
  exportRequest: ExcelExportRequest
): Promise<ExcelExportResponse | null> => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/export/excel`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(exportRequest)
    }
  );
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      filename: getFilenameFromDisposition(response.headers.get('content-disposition'), 'illustry-visualization.xlsx'),
      mimeType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      base64: buffer.toString('base64')
    };
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const exportVisualizationBundle = async (
  exportRequest: VisualizationBundleExportRequest
): Promise<VisualizationBundleExportResponse | null> => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/export/bundle`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(exportRequest)
    }
  );
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      filename: getFilenameFromDisposition(response.headers.get('content-disposition'), 'illustry-visualization-export'),
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
  browseVisualizations,
  deleteVisualization,
  createOrUpdateVisualization,
  findOneVisualization,
  findSharedVisualization,
  findDashboardSharedVisualization,
  shareVisualization,
  revokeVisualizationShare,
  updateVisualization,
  respondToVisualizationShareInvite,
  syncVisualizationThemes,
  exportVisualizationExcel,
  exportVisualizationBundle
};
export type {
  ExcelExportRequest,
  ExcelExportResponse,
  VisualizationBundleExportChart,
  VisualizationBundleExportFormat,
  VisualizationBundleExportRequest,
  VisualizationBundleExportResponse
};
