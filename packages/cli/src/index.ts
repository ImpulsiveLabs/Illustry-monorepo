#!/usr/bin/env node
import { promises as fs } from 'fs';
import {
  IllustryApiClient,
  IllustryError,
  LocalIllustryStore,
  createLocalExportBundle,
  importVisualizationSource,
  parseExportFormats,
  toIllustryError,
  type IllustryChartPayload,
  type ServerResource,
} from '@illustry/core';

type CliIo = {
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
};

type ParsedArgs = {
  command?: string;
  subject?: string;
  flags: Record<string, string | boolean>;
};

const helpText = `Illustry CLI

Usage:
  illustry status [--workspace .illustry] [--server http://localhost:7001] [--cookie "..."] [--csrf "..."] [--json]
  illustry import visualization --file data.csv [--name Name] [--type bar-chart] [--workspace .illustry] [--json]
  illustry import visualization --server http://localhost:7001 --file data.csv [--name Name] [--type bar-chart] [--project Project] [--cookie "..."] [--csrf "..."] [--json]
  illustry list [--workspace .illustry] [--json]
  illustry list --server http://localhost:7001 [--resource visualizations|dashboards|projects] [--cookie "..."] [--csrf "..."] [--json]
  illustry export --asset AssetName --format svg,png,excel --out exports [--workspace .illustry] [--json]
  illustry export --server http://localhost:7001 --resource visualization|dashboard --asset AssetName --format svg,png --out exports [--type bar-chart] [--chart-file chart.json] [--workspace .illustry] [--cookie "..."] [--csrf "..."] [--json]

Local commands do not require the Illustry server, UI, or database. Add --server when you want the API adapter. For authenticated backend mutations, pass an Illustry session cookie and CSRF token.`;

const parseArgs = (argv: string[]): ParsedArgs => {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      positional.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return {
    command: positional[0],
    subject: positional[1],
    flags
  };
};

const getStringFlag = (flags: ParsedArgs['flags'], name: string) => {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
};

const getStore = (flags: ParsedArgs['flags']) => new LocalIllustryStore({
  rootDir: getStringFlag(flags, 'workspace')
});

const getClient = (flags: ParsedArgs['flags']) => {
  const server = getStringFlag(flags, 'server');
  if (!server) {
    throw new IllustryError('Missing --server for server-backed operation.', {
      code: 'ILLUSTRY_CLI_MISSING_SERVER',
      status: 400
    });
  }
  return new IllustryApiClient({
    baseUrl: server,
    token: getStringFlag(flags, 'token'),
    cookie: getStringFlag(flags, 'cookie'),
    csrfToken: getStringFlag(flags, 'csrf')
  });
};

const normalizeServerResource = (value: string | undefined): ServerResource => {
  if (value === undefined || value === 'visualizations') return 'visualizations';
  if (value === 'dashboards' || value === 'projects') return value;
  throw new IllustryError(`Unsupported server resource: ${value}.`, {
    code: 'ILLUSTRY_CLI_UNSUPPORTED_RESOURCE',
    status: 400
  });
};

const normalizeExportResource = (value: string | undefined): 'visualization' | 'dashboard' => {
  if (value === undefined || value === 'visualization' || value === 'visualizations') return 'visualization';
  if (value === 'dashboard' || value === 'dashboards') return 'dashboard';
  throw new IllustryError(`Unsupported export resource: ${value}.`, {
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
  const parsed: unknown = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const charts = normalizeChartPayloads(parsed);
  if (charts.length === 0) {
    throw new IllustryError('The chart file must contain a chart option or charts array.', {
      code: 'ILLUSTRY_CLI_INVALID_CHART_FILE',
      status: 400
    });
  }
  return charts;
};

const loadServerExportCharts = async (flags: ParsedArgs['flags'], assetName: string) => {
  const chartFile = getStringFlag(flags, 'chart-file');
  if (chartFile) {
    return readChartFile(chartFile);
  }
  const asset = await getStore(flags).getAsset(assetName);
  if (asset?.charts?.length) {
    return asset.charts;
  }
  throw new IllustryError('Server export needs chart data. Provide --chart-file or keep a matching local workspace asset.', {
    code: 'ILLUSTRY_CLI_SERVER_EXPORT_MISSING_CHARTS',
    status: 400
  });
};

const print = (value: unknown, flags: ParsedArgs['flags'], io: CliIo) => {
  const output = flags.json
    ? JSON.stringify(value, null, 2)
    : typeof value === 'string'
      ? value
      : JSON.stringify(value, null, 2);
  (io.stdout || console.log)(output);
};

const runStatus = async (flags: ParsedArgs['flags']) => {
  const server = getStringFlag(flags, 'server');
  if (server) {
    const client = getClient(flags);
    return {
      mode: 'server',
      baseUrl: server,
      health: await client.health()
    };
  }
  const store = getStore(flags);
  const assets = await store.readAssets();
  return {
    mode: 'local',
    workspace: store.rootDir,
    assets: assets.length
  };
};

const runImportVisualization = async (flags: ParsedArgs['flags']) => {
  const file = getStringFlag(flags, 'file');
  if (!file) {
    throw new IllustryError('Missing --file for visualization import.', {
      code: 'ILLUSTRY_CLI_MISSING_FILE',
      status: 400
    });
  }
  const server = getStringFlag(flags, 'server');
  if (server) {
    return getClient(flags).uploadVisualizationSource({
      filePath: file,
      visualizationDetails: {
        name: getStringFlag(flags, 'name'),
        type: getStringFlag(flags, 'type'),
        projectName: getStringFlag(flags, 'project')
      },
      fullDetails: flags.fullDetails === true || flags['full-details'] === true
    });
  }

  const asset = await importVisualizationSource({
    filePath: file,
    name: getStringFlag(flags, 'name'),
    type: getStringFlag(flags, 'type')
  });
  return getStore(flags).saveAsset(asset);
};

const runList = async (flags: ParsedArgs['flags']) => {
  const server = getStringFlag(flags, 'server');
  if (server) {
    const resource = normalizeServerResource(getStringFlag(flags, 'resource'));
    return {
      mode: 'server',
      baseUrl: server,
      resource,
      data: await getClient(flags).browse({
        resource,
        query: {
          text: getStringFlag(flags, 'text'),
          page: getStringFlag(flags, 'page'),
          sort: getStringFlag(flags, 'sort'),
          sharedScope: getStringFlag(flags, 'shared-scope')
        }
      })
    };
  }
  const store = getStore(flags);
  return {
    workspace: store.rootDir,
    assets: await store.readAssets()
  };
};

const runExport = async (flags: ParsedArgs['flags']) => {
  const assetName = getStringFlag(flags, 'asset');
  if (!assetName) {
    throw new IllustryError('Missing --asset for export.', {
      code: 'ILLUSTRY_CLI_MISSING_ASSET',
      status: 400
    });
  }
  const server = getStringFlag(flags, 'server');
  const store = getStore(flags);
  if (server) {
    const resource = normalizeExportResource(getStringFlag(flags, 'resource'));
    const formats = parseExportFormats(getStringFlag(flags, 'format'));
    const charts = await loadServerExportCharts(flags, assetName);
    const exported = await getClient(flags).downloadExport({
      resource,
      name: assetName,
      body: {
        name: assetName,
        type: getStringFlag(flags, 'type'),
        formats,
        charts,
        title: getStringFlag(flags, 'title') || assetName
      }
    });
    const filePath = await store.writeExportFile(exported, getStringFlag(flags, 'out'));
    return {
      mode: 'server',
      filePath,
      filename: exported.filename,
      mimeType: exported.mimeType,
      bundled: exported.mimeType === 'application/zip'
    };
  }
  const asset = await store.requireAsset(assetName);
  const bundle = await createLocalExportBundle({
    asset,
    formats: parseExportFormats(getStringFlag(flags, 'format'))
  });
  const filePath = await store.writeExportFile(bundle, getStringFlag(flags, 'out'));
  return {
    filePath,
    filename: bundle.filename,
    mimeType: bundle.mimeType,
    bundled: bundle.bundled
  };
};

const runCli = async (argv: string[], io: CliIo = {}) => {
  const parsed = parseArgs(argv);
  if (!parsed.command || parsed.flags.help || parsed.flags.h) {
    print(helpText, parsed.flags, io);
    return { ok: true, help: true };
  }

  let result: unknown;
  if (parsed.command === 'status') {
    result = await runStatus(parsed.flags);
  } else if (parsed.command === 'import' && parsed.subject === 'visualization') {
    result = await runImportVisualization(parsed.flags);
  } else if (parsed.command === 'list') {
    result = await runList(parsed.flags);
  } else if (parsed.command === 'export') {
    result = await runExport(parsed.flags);
  } else {
    throw new IllustryError(`Unknown command: ${[parsed.command, parsed.subject].filter(Boolean).join(' ')}`, {
      code: 'ILLUSTRY_CLI_UNKNOWN_COMMAND',
      status: 400
    });
  }

  print(result, parsed.flags, io);
  return result;
};

if (require.main === module) {
  runCli(process.argv.slice(2)).catch((error) => {
    const normalized = toIllustryError(error);
    console.error(normalized.message);
    process.exitCode = normalized.status && normalized.status >= 500 ? 2 : 1;
  });
}

export {
  helpText,
  parseArgs,
  runCli
};
