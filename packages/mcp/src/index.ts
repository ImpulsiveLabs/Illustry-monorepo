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

type JsonObject = Record<string, unknown>;

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: JsonObject;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

type McpToolCall = {
  name?: string;
  arguments?: JsonObject;
};

const isJsonObject = (value: unknown): value is JsonObject => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const normalizeToolCall = (value: unknown): McpToolCall => {
  if (!isJsonObject(value)) {
    return {};
  }
  const args = value.arguments;
  return {
    name: typeof value.name === 'string' ? value.name : undefined,
    arguments: isJsonObject(args) ? args : undefined
  };
};

const normalizeJsonRpcRequest = (value: unknown): JsonRpcRequest => {
  if (!isJsonObject(value) || value.jsonrpc !== '2.0' || typeof value.method !== 'string') {
    throw new IllustryError('Invalid MCP JSON-RPC request.', {
      code: 'ILLUSTRY_MCP_INVALID_REQUEST',
      status: 400
    });
  }
  const id = typeof value.id === 'string' || typeof value.id === 'number' || value.id === null
    ? value.id
    : undefined;
  return {
    jsonrpc: '2.0',
    id,
    method: value.method,
    params: isJsonObject(value.params) ? value.params : undefined
  };
};

const tools = [
  {
    name: 'illustry_status',
    description: 'Check local Illustry workspace status or optional server health.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string' },
        server: { type: 'string' },
        token: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_login',
    description: 'Sign in to an Illustry backend and return the user plus persisted cookie/CSRF session snapshot for later MCP calls.',
    inputSchema: {
      type: 'object',
      required: ['server', 'email', 'password'],
      properties: {
        server: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        locale: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_signup',
    description: 'Create an Illustry account and return the user plus cookie/CSRF session snapshot.',
    inputSchema: {
      type: 'object',
      required: ['server', 'email', 'password', 'name'],
      properties: {
        server: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        name: { type: 'string' },
        locale: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_logout',
    description: 'Log out of an Illustry backend session using cookie and CSRF token.',
    inputSchema: {
      type: 'object',
      required: ['server'],
      properties: {
        server: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_session',
    description: 'Inspect the current Illustry backend session.',
    inputSchema: {
      type: 'object',
      required: ['server'],
      properties: {
        server: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_verify_email',
    description: 'Verify email by token, or by email plus confirmation code.',
    inputSchema: {
      type: 'object',
      required: ['server'],
      properties: {
        server: { type: 'string' },
        token: { type: 'string' },
        email: { type: 'string' },
        code: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_resend_verification',
    description: 'Request another verification email.',
    inputSchema: {
      type: 'object',
      required: ['server'],
      properties: {
        server: { type: 'string' },
        email: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_forgot_password',
    description: 'Request a password reset email.',
    inputSchema: {
      type: 'object',
      required: ['server', 'email'],
      properties: {
        server: { type: 'string' },
        email: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_auth_reset_password',
    description: 'Reset password using a backend reset token.',
    inputSchema: {
      type: 'object',
      required: ['server', 'token', 'password'],
      properties: {
        server: { type: 'string' },
        token: { type: 'string' },
        password: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_import_visualization',
    description: 'Import a visualization source file into a local workspace, or upload it to an Illustry server when server is provided.',
    inputSchema: {
      type: 'object',
      required: ['filePath'],
      properties: {
        filePath: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        project: { type: 'string' },
        workspace: { type: 'string' },
        server: { type: 'string' },
        token: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_delete_resource',
    description: 'Delete a local asset, or delete a server project/dashboard/visualization when server is provided.',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        resource: { type: 'string', enum: ['assets', 'visualizations', 'dashboards', 'projects'] },
        type: { type: 'string' },
        project: { type: 'string' },
        workspace: { type: 'string' },
        server: { type: 'string' },
        token: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_list_assets',
    description: 'List local Illustry assets, or browse server projects, dashboards, or visualizations when server is provided.',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string' },
        server: { type: 'string' },
        token: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' },
        resource: { type: 'string', enum: ['visualizations', 'dashboards', 'projects'] },
        text: { type: 'string' },
        page: { type: 'string' },
        sort: { type: 'string' },
        sharedScope: { type: 'string' }
      }
    }
  },
  {
    name: 'illustry_export_asset',
    description: 'Export a local Illustry asset, or ask an Illustry server to export when server is provided. Server export needs chartFile or a matching local workspace asset for chart data.',
    inputSchema: {
      type: 'object',
      required: ['asset'],
      properties: {
        asset: { type: 'string' },
        format: { type: 'string', description: 'Comma-separated formats, for example svg,png,excel.' },
        outputDir: { type: 'string' },
        workspace: { type: 'string' },
        server: { type: 'string' },
        token: { type: 'string' },
        cookie: { type: 'string' },
        csrfToken: { type: 'string' },
        resource: { type: 'string', enum: ['visualization', 'dashboard'] },
        type: { type: 'string' },
        chartFile: { type: 'string' },
        title: { type: 'string' }
      }
    }
  }
];

const asString = (value: unknown) => typeof value === 'string' ? value : undefined;
const requireString = (value: unknown, label: string) => {
  const normalized = asString(value);
  if (!normalized) {
    throw new IllustryError(`Missing ${label}.`, {
      code: 'ILLUSTRY_MCP_MISSING_ARGUMENT',
      status: 400
    });
  }
  return normalized;
};

const getStore = (args: JsonObject = {}) => new LocalIllustryStore({
  rootDir: asString(args.workspace)
});

const getClient = (args: JsonObject = {}) => {
  const server = asString(args.server);
  if (!server) {
    throw new IllustryError('Missing server for server-backed operation.', {
      code: 'ILLUSTRY_MCP_MISSING_SERVER',
      status: 400
    });
  }
  return new IllustryApiClient({
    baseUrl: server,
    token: asString(args.token),
    cookie: asString(args.cookie),
    csrfToken: asString(args.csrfToken),
    locale: asString(args.locale)
  });
};

const withSession = (client: IllustryApiClient, result: unknown) => ({
  result,
  session: client.getSessionSnapshot()
});

const normalizeServerResource = (value: unknown): ServerResource => {
  if (value === undefined || value === 'visualizations') return 'visualizations';
  if (value === 'dashboards' || value === 'projects') return value;
  throw new IllustryError(`Unsupported server resource: ${String(value)}.`, {
    code: 'ILLUSTRY_MCP_UNSUPPORTED_RESOURCE',
    status: 400
  });
};

const normalizeDeleteResource = (value: unknown): 'assets' | ServerResource => {
  if (value === undefined || value === 'assets') return 'assets';
  if (value === 'visualization') return 'visualizations';
  if (value === 'dashboard') return 'dashboards';
  if (value === 'project') return 'projects';
  if (value === 'visualizations' || value === 'dashboards' || value === 'projects') return value;
  throw new IllustryError(`Unsupported delete resource: ${String(value)}.`, {
    code: 'ILLUSTRY_MCP_UNSUPPORTED_RESOURCE',
    status: 400
  });
};

const normalizeExportResource = (value: unknown): 'visualization' | 'dashboard' => {
  if (value === undefined || value === 'visualization' || value === 'visualizations') return 'visualization';
  if (value === 'dashboard' || value === 'dashboards') return 'dashboard';
  throw new IllustryError(`Unsupported export resource: ${String(value)}.`, {
    code: 'ILLUSTRY_MCP_UNSUPPORTED_EXPORT_RESOURCE',
    status: 400
  });
};

const normalizeChartPayloads = (value: unknown): IllustryChartPayload[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is IllustryChartPayload => isJsonObject(item) && isJsonObject(item.option));
  }
  if (isJsonObject(value)) {
    if (Array.isArray(value.charts)) {
      return normalizeChartPayloads(value.charts);
    }
    if (isJsonObject(value.option)) {
      return [{
        title: asString(value.title),
        option: value.option
      }];
    }
  }
  return [];
};

const readChartFile = async (filePath: string) => {
  const parsed: unknown = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const charts = normalizeChartPayloads(parsed);
  if (charts.length === 0) {
    throw new IllustryError('The chart file must contain a chart option or charts array.', {
      code: 'ILLUSTRY_MCP_INVALID_CHART_FILE',
      status: 400
    });
  }
  return charts;
};

const loadServerExportCharts = async (args: JsonObject, assetName: string) => {
  const chartFile = asString(args.chartFile);
  if (chartFile) {
    return readChartFile(chartFile);
  }
  const asset = await getStore(args).getAsset(assetName);
  if (asset?.charts?.length) {
    return asset.charts;
  }
  throw new IllustryError('Server export needs chart data. Provide chartFile or keep a matching local workspace asset.', {
    code: 'ILLUSTRY_MCP_SERVER_EXPORT_MISSING_CHARTS',
    status: 400
  });
};

const textResult = (value: unknown) => ({
  content: [{
    type: 'text',
    text: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }]
});

const callTool = async ({ name, arguments: args = {} }: McpToolCall) => {
  if (name === 'illustry_status') {
    const server = asString(args.server);
    if (server) {
      const client = getClient(args);
      return textResult({ mode: 'server', baseUrl: server, health: await client.health() });
    }
    const store = getStore(args);
    const assets = await store.readAssets();
    return textResult({ mode: 'local', workspace: store.rootDir, assets: assets.length });
  }

  if (name === 'illustry_auth_login') {
    const client = getClient(args);
    return textResult(withSession(client, await client.login({
      email: requireString(args.email, 'email'),
      password: requireString(args.password, 'password')
    })));
  }

  if (name === 'illustry_auth_signup') {
    const client = getClient(args);
    return textResult(withSession(client, await client.signup({
      email: requireString(args.email, 'email'),
      password: requireString(args.password, 'password'),
      name: requireString(args.name, 'name')
    })));
  }

  if (name === 'illustry_auth_logout') {
    const client = getClient(args);
    return textResult(withSession(client, await client.logout()));
  }

  if (name === 'illustry_auth_session') {
    const client = getClient(args);
    return textResult(withSession(client, await client.me()));
  }

  if (name === 'illustry_auth_verify_email') {
    const client = getClient(args);
    const result = asString(args.token)
      ? await client.verifyEmail(requireString(args.token, 'token'))
      : await client.verifyEmailCode(requireString(args.email, 'email'), requireString(args.code, 'code'));
    return textResult(withSession(client, result));
  }

  if (name === 'illustry_auth_resend_verification') {
    const client = getClient(args);
    return textResult(withSession(client, await client.resendVerification(asString(args.email))));
  }

  if (name === 'illustry_auth_forgot_password') {
    const client = getClient(args);
    return textResult(await client.requestPasswordReset(requireString(args.email, 'email')));
  }

  if (name === 'illustry_auth_reset_password') {
    const client = getClient(args);
    return textResult(await client.resetPassword(
      requireString(args.token, 'token'),
      requireString(args.password, 'password')
    ));
  }

  if (name === 'illustry_import_visualization') {
    const filePath = asString(args.filePath);
    if (!filePath) {
      throw new IllustryError('Missing filePath.', { code: 'ILLUSTRY_MCP_MISSING_FILE', status: 400 });
    }
    if (asString(args.server)) {
      return textResult(await getClient(args).uploadVisualizationSource({
        filePath,
        visualizationDetails: {
          name: asString(args.name),
          type: asString(args.type),
          projectName: asString(args.project)
        },
        fullDetails: args.fullDetails === true
      }));
    }
    const asset = await importVisualizationSource({
      filePath,
      name: asString(args.name),
      type: asString(args.type)
    });
    return textResult(await getStore(args).saveAsset(asset));
  }

  if (name === 'illustry_delete_resource') {
    const resourceName = requireString(args.name, 'name');
    const resource = normalizeDeleteResource(args.resource);
    const server = asString(args.server);
    if (server && resource !== 'assets') {
      const client = getClient(args);
      let result: unknown;
      if (resource === 'projects') {
        result = await client.deleteProject(resourceName);
      } else if (resource === 'dashboards') {
        result = await client.deleteDashboard(resourceName);
      } else {
        result = await client.deleteVisualization({
          name: resourceName,
          type: asString(args.type),
          projectName: asString(args.project)
        });
      }
      return textResult(withSession(client, result));
    }
    const deleted = await getStore(args).deleteAsset(resourceName);
    if (!deleted) {
      throw new IllustryError(`Illustry asset "${resourceName}" was not found.`, {
        code: 'ILLUSTRY_MCP_ASSET_NOT_FOUND',
        status: 404
      });
    }
    return textResult({ ok: true, deleted: resourceName });
  }

  if (name === 'illustry_list_assets') {
    const server = asString(args.server);
    if (server) {
      const resource = normalizeServerResource(args.resource);
      return textResult({
        mode: 'server',
        baseUrl: server,
        resource,
        data: await getClient(args).browse({
          resource,
          query: {
            text: asString(args.text),
            page: asString(args.page),
            sort: asString(args.sort),
            sharedScope: asString(args.sharedScope)
          }
        })
      });
    }
    const store = getStore(args);
    return textResult({ workspace: store.rootDir, assets: await store.readAssets() });
  }

  if (name === 'illustry_export_asset') {
    const assetName = asString(args.asset);
    if (!assetName) {
      throw new IllustryError('Missing asset.', { code: 'ILLUSTRY_MCP_MISSING_ASSET', status: 400 });
    }
    const store = getStore(args);
    const server = asString(args.server);
    if (server) {
      const resource = normalizeExportResource(args.resource);
      const formats = parseExportFormats(asString(args.format));
      const charts = await loadServerExportCharts(args, assetName);
      const exported = await getClient(args).downloadExport({
        resource,
        name: assetName,
        body: {
          name: assetName,
          type: asString(args.type),
          formats,
          charts,
          title: asString(args.title) || assetName
        }
      });
      const filePath = await store.writeExportFile(exported, asString(args.outputDir));
      return textResult({
        mode: 'server',
        filePath,
        filename: exported.filename,
        mimeType: exported.mimeType,
        bundled: exported.mimeType === 'application/zip'
      });
    }
    const asset = await store.requireAsset(assetName);
    const bundle = await createLocalExportBundle({
      asset,
      formats: parseExportFormats(asString(args.format))
    });
    const filePath = await store.writeExportFile(bundle, asString(args.outputDir));
    return textResult({
      filePath,
      filename: bundle.filename,
      mimeType: bundle.mimeType,
      bundled: bundle.bundled
    });
  }

  throw new IllustryError(`Unknown Illustry MCP tool: ${name || 'missing'}.`, {
    code: 'ILLUSTRY_MCP_UNKNOWN_TOOL',
    status: 400
  });
};

const handleMcpRequest = async (request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> => {
  try {
    if (request.method === 'notifications/initialized') {
      return undefined;
    }
    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: '@illustry/mcp',
            version: '0.1.0'
          }
        }
      };
    }
    if (request.method === 'tools/list') {
      return { jsonrpc: '2.0', id: request.id, result: { tools } };
    }
    if (request.method === 'tools/call') {
      const result = await callTool(normalizeToolCall(request.params));
      return { jsonrpc: '2.0', id: request.id, result };
    }
    if (request.method === 'resources/list') {
      return { jsonrpc: '2.0', id: request.id, result: { resources: [] } };
    }
    if (request.method === 'prompts/list') {
      return { jsonrpc: '2.0', id: request.id, result: { prompts: [] } };
    }
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32601, message: `Method not found: ${request.method}` }
    };
  } catch (error) {
    const normalized = toIllustryError(error);
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: normalized.status && normalized.status < 500 ? -32602 : -32603,
        message: normalized.message,
        data: { code: normalized.code, details: normalized.details }
      }
    };
  }
};

const encodeMcpMessage = (message: JsonRpcResponse | JsonRpcRequest) => {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  return Buffer.concat([
    Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8'),
    body
  ]);
};

class McpStdioFramer {
  private buffer = Buffer.alloc(0);

  push(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages: JsonRpcRequest[] = [];
    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;
      const header = this.buffer.subarray(0, headerEnd).toString('utf8');
      const length = Number(header.match(/Content-Length:\s*(\d+)/i)?.[1]);
      if (!Number.isFinite(length)) {
        throw new IllustryError('Invalid MCP frame: missing Content-Length.', {
          code: 'ILLUSTRY_MCP_INVALID_FRAME'
        });
      }
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (this.buffer.length < bodyEnd) break;
      const body = this.buffer.subarray(bodyStart, bodyEnd).toString('utf8');
      this.buffer = this.buffer.subarray(bodyEnd);
      messages.push(normalizeJsonRpcRequest(JSON.parse(body)));
    }
    return messages;
  }
}

const startMcpStdioServer = (
  input: NodeJS.ReadableStream = process.stdin,
  output: NodeJS.WritableStream = process.stdout,
  errorOutput: NodeJS.WritableStream = process.stderr
) => {
  const framer = new McpStdioFramer();
  const onData = (chunk: Buffer) => {
    void (async () => {
      const messages = framer.push(chunk);
      for (const message of messages) {
        const response = await handleMcpRequest(message);
        if (response) {
          output.write(encodeMcpMessage(response));
        }
      }
    })().catch((error) => {
      const normalized = toIllustryError(error);
      errorOutput.write(`${normalized.message}\n`);
    });
  };
  input.on('data', onData);
  return () => input.off('data', onData);
};

/* istanbul ignore next */
if (require.main === module) {
  startMcpStdioServer();
}

export {
  McpStdioFramer,
  callTool,
  encodeMcpMessage,
  handleMcpRequest,
  startMcpStdioServer,
  tools
};
export type {
  JsonRpcRequest,
  JsonRpcResponse
};
