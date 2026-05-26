#!/usr/bin/env node
import {
  IllustryApiClient,
  IllustryError,
  LocalIllustryStore,
  createLocalExportBundle,
  importVisualizationSource,
  parseExportFormats,
  toIllustryError,
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
  illustry status [--workspace .illustry] [--server http://localhost:7001] [--json]
  illustry import visualization --file data.csv [--name Name] [--type bar-chart] [--workspace .illustry] [--json]
  illustry list [--workspace .illustry] [--json]
  illustry export --asset AssetName --format svg,png,excel --out exports [--workspace .illustry] [--json]

Local commands do not require the Illustry server, UI, or database. Use --server only when you want the API adapter.`;

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
    const client = new IllustryApiClient({
      baseUrl: server,
      token: getStringFlag(flags, 'token')
    });
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
  const asset = await importVisualizationSource({
    filePath: file,
    name: getStringFlag(flags, 'name'),
    type: getStringFlag(flags, 'type')
  });
  return getStore(flags).saveAsset(asset);
};

const runList = async (flags: ParsedArgs['flags']) => {
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
  const store = getStore(flags);
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
