import { promises as fs } from 'fs';
import {
  IllustryError,
  createLocalExportBundle,
  importVisualizationSource,
  parseExportFormats,
  type IllustryChartPayload,
  type ServerResource
} from '@illustry/core';
import { CliContext } from '../context';
import type { ResourceName } from '../types';

type ImportOptions = {
  file?: string;
  name?: string;
  type?: string;
  project?: string;
  fullDetails?: boolean;
};

type ListOptions = {
  resource?: string;
  text?: string;
  page?: string;
  sort?: string;
  sharedScope?: string;
};

type ExportOptions = {
  asset?: string;
  resource?: string;
  format?: string;
  out?: string;
  type?: string;
  title?: string;
  chartFile?: string;
};

type DeleteOptions = {
  resource?: string;
  name?: string;
  type?: string;
  project?: string;
};

const normalizeListResource = (value?: string): ResourceName => {
  if (!value || value === 'assets') return 'assets';
  if (value === 'project') return 'projects';
  if (value === 'visualization') return 'visualizations';
  if (value === 'dashboard') return 'dashboards';
  if (value === 'projects' || value === 'visualizations' || value === 'dashboards') return value;
  throw new IllustryError(`Unsupported resource "${value}".`, {
    code: 'ILLUSTRY_CLI_UNSUPPORTED_RESOURCE',
    status: 400
  });
};

const normalizeServerResource = (value: ResourceName): ServerResource => {
  if (value === 'assets') {
    return 'visualizations';
  }
  return value;
};

const normalizeExportResource = (value?: string): 'visualization' | 'dashboard' => {
  if (!value || value === 'visualization' || value === 'visualizations') return 'visualization';
  if (value === 'dashboard' || value === 'dashboards') return 'dashboard';
  throw new IllustryError(`Unsupported export resource "${value}".`, {
    code: 'ILLUSTRY_CLI_UNSUPPORTED_EXPORT_RESOURCE',
    status: 400
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const normalizeChartPayloads = (value: unknown): IllustryChartPayload[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is IllustryChartPayload => isRecord(item) && isRecord(item.option));
  }
  if (isRecord(value)) {
    if (Array.isArray(value.charts)) {
      return normalizeChartPayloads(value.charts);
    }
    if (isRecord(value.option)) {
      return [{
        title: typeof value.title === 'string' ? value.title : undefined,
        option: value.option
      }];
    }
  }
  return [];
};

const readChartFile = async (filePath: string): Promise<IllustryChartPayload[]> => {
  const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
  const charts = normalizeChartPayloads(parsed);
  if (charts.length === 0) {
    throw new IllustryError('The chart file must contain a chart option or charts array.', {
      code: 'ILLUSTRY_CLI_INVALID_CHART_FILE',
      status: 400
    });
  }
  return charts;
};

const loadExportCharts = async (context: CliContext, assetName: string, chartFile?: string) => {
  if (chartFile) {
    return readChartFile(chartFile);
  }
  const store = await context.store();
  const asset = await store.getAsset(assetName);
  if (asset?.charts?.length) {
    return asset.charts;
  }
  throw new IllustryError('Live export needs chart data. Provide --chart-file or keep a matching local workspace asset.', {
    code: 'ILLUSTRY_CLI_SERVER_EXPORT_MISSING_CHARTS',
    status: 400
  });
};

const importVisualization = async (context: CliContext, options: ImportOptions) => {
  if (!options.file) {
    throw new IllustryError('Missing file path. Use `illustry import <file>` or `--file <path>`.', {
      code: 'ILLUSTRY_CLI_MISSING_FILE',
      status: 400
    });
  }

  const profile = await context.profile();
  if (profile.mode === 'live') {
    const client = await context.client();
    const result = await client.uploadVisualizationSource({
      filePath: options.file,
      visualizationDetails: {
        name: options.name,
        type: options.type,
        projectName: options.project
      },
      fullDetails: options.fullDetails === true
    });
    await context.saveClientSession(client.getSessionSnapshot());
    return result;
  }

  const asset = await importVisualizationSource({
    filePath: options.file,
    name: options.name,
    type: options.type
  });
  const store = await context.store();
  return store.saveAsset(asset);
};

const listResources = async (context: CliContext, options: ListOptions) => {
  const profile = await context.profile();
  const resource = normalizeListResource(options.resource);
  if (profile.mode === 'live' && resource !== 'assets') {
    const client = await context.client();
    const data = await client.browse({
      resource: normalizeServerResource(resource),
      query: {
        text: options.text,
        page: options.page,
        sort: options.sort,
        sharedScope: options.sharedScope
      }
    });
    await context.saveClientSession(client.getSessionSnapshot());
    return {
      mode: 'live',
      server: profile.serverUrl,
      resource,
      data
    };
  }
  const store = await context.store();
  return {
    mode: 'offline',
    workspace: store.rootDir,
    resource: 'assets',
    data: await store.readAssets()
  };
};

const exportAsset = async (context: CliContext, options: ExportOptions) => {
  const assetName = options.asset;
  if (!assetName) {
    throw new IllustryError('Missing --asset for export.', {
      code: 'ILLUSTRY_CLI_MISSING_ASSET',
      status: 400
    });
  }
  const profile = await context.profile();
  const store = await context.store();
  const formats = parseExportFormats(options.format);

  if (profile.mode === 'live') {
    const client = await context.client();
    const resource = normalizeExportResource(options.resource);
    const charts = await loadExportCharts(context, assetName, options.chartFile);
    const exported = await client.downloadExport({
      resource,
      name: assetName,
      body: {
        name: assetName,
        type: options.type,
        formats,
        charts,
        title: options.title || assetName
      }
    });
    await context.saveClientSession(client.getSessionSnapshot());
    const filePath = await store.writeExportFile(exported, options.out);
    return {
      mode: 'live',
      filePath,
      filename: exported.filename,
      mimeType: exported.mimeType,
      bundled: exported.mimeType === 'application/zip'
    };
  }

  const asset = await store.requireAsset(assetName);
  const bundle = await createLocalExportBundle({ asset, formats });
  const filePath = await store.writeExportFile(bundle, options.out);
  return {
    mode: 'offline',
    filePath,
    filename: bundle.filename,
    mimeType: bundle.mimeType,
    bundled: bundle.bundled
  };
};

const deleteResource = async (context: CliContext, options: DeleteOptions) => {
  const name = options.name;
  if (!name) {
    throw new IllustryError('Missing resource name.', {
      code: 'ILLUSTRY_CLI_MISSING_RESOURCE_NAME',
      status: 400
    });
  }
  const profile = await context.profile();
  const resource = normalizeListResource(options.resource);
  if (profile.mode === 'live' && resource !== 'assets') {
    const client = await context.client();
    let result: unknown;
    if (resource === 'projects') {
      result = await client.deleteProject(name);
    } else if (resource === 'dashboards') {
      result = await client.deleteDashboard(name);
    } else {
      result = await client.deleteVisualization({ name, type: options.type, projectName: options.project });
    }
    await context.saveClientSession(client.getSessionSnapshot());
    return result;
  }
  const store = await context.store();
  const deleted = await store.deleteAsset(name);
  if (!deleted) {
    throw new IllustryError(`Illustry asset "${name}" was not found.`, {
      code: 'ILLUSTRY_ASSET_NOT_FOUND',
      status: 404
    });
  }
  return { ok: true, deleted: name };
};

export {
  deleteResource,
  exportAsset,
  importVisualization,
  listResources,
  normalizeExportResource,
  normalizeListResource
};
export type {
  DeleteOptions,
  ExportOptions,
  ImportOptions,
  ListOptions
};
