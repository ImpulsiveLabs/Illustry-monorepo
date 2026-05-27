import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { EventEmitter } from 'events';
import { Writable } from 'stream';
import {
  McpStdioFramer,
  callTool,
  encodeMcpMessage,
  handleMcpRequest,
  startMcpStdioServer
} from '../src';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-mcp-'));

describe('@illustry/mcp', () => {
  let tempDir: string;
  let originalFetch: typeof fetch;

  beforeEach(async () => {
    tempDir = await makeTempDir();
    originalFetch = global.fetch;
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const parseToolText = (response: Awaited<ReturnType<typeof handleMcpRequest>>) => {
    const result = response?.result as { content?: Array<{ text?: string }> } | undefined;
    return JSON.parse(result?.content?.[0]?.text || '{}') as Record<string, unknown>;
  };

  it('responds to MCP initialize and tool discovery', async () => {
    const initialize = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {}
    });
    expect(initialize?.result).toMatchObject({
      serverInfo: { name: '@illustry/mcp' }
    });

    const tools = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    expect(JSON.stringify(tools?.result)).toContain('illustry_import_visualization');
    expect(JSON.stringify(tools?.result)).toContain('illustry_auth_login');
    expect(JSON.stringify(tools?.result)).toContain('illustry_delete_resource');

    await expect(handleMcpRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'notifications/initialized',
      params: {}
    })).resolves.toBeUndefined();

    await expect(handleMcpRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'resources/list',
      params: {}
    })).resolves.toMatchObject({ result: { resources: [] } });

    await expect(handleMcpRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'prompts/list',
      params: {}
    })).resolves.toMatchObject({ result: { prompts: [] } });

    await expect(handleMcpRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'nope',
      params: {}
    })).resolves.toMatchObject({ error: { code: -32601 } });
  });

  it('imports assets through a tool call and parses stdio frames', async () => {
    const source = path.join(tempDir, 'source.csv');
    await fs.writeFile(source, 'name,value\nA,1\n', 'utf8');

    const response = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'import',
      method: 'tools/call',
      params: {
        name: 'illustry_import_visualization',
        arguments: {
          workspace: tempDir,
          filePath: source,
          name: 'MCP Chart'
        }
      }
    });
    expect(JSON.stringify(response?.result)).toContain('MCP Chart');

    const encoded = encodeMcpMessage({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/list',
      params: {}
    });
    const framer = new McpStdioFramer();
    expect(framer.push(encoded)).toHaveLength(1);
    expect(framer.push(encoded.subarray(0, 5))).toHaveLength(0);
    expect(framer.push(encoded.subarray(5))).toHaveLength(1);
    expect(() => framer.push(Buffer.from('Broken: 1\r\n\r\n{}'))).toThrow('Content-Length');
  });

  it('covers local status, local list, local export, and direct text tool results', async () => {
    const source = path.join(tempDir, 'local.csv');
    const outputDir = path.join(tempDir, 'exports');
    await fs.writeFile(source, 'name,value\nA,1\n', 'utf8');

    const status = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'status',
      method: 'tools/call',
      params: {
        name: 'illustry_status',
        arguments: { workspace: tempDir }
      }
    });
    expect(JSON.stringify(status?.result)).toContain('"mode\\": \\"local');

    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'import-local',
      method: 'tools/call',
      params: {
        name: 'illustry_import_visualization',
        arguments: { workspace: tempDir, filePath: source, name: 'Local MCP Chart' }
      }
    });

    const listed = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'list-local',
      method: 'tools/call',
      params: {
        name: 'illustry_list_assets',
        arguments: { workspace: tempDir }
      }
    });
    expect(JSON.stringify(listed?.result)).toContain('Local MCP Chart');

    const exported = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'export-local',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          workspace: tempDir,
          asset: 'Local MCP Chart',
          format: 'json',
          outputDir
        }
      }
    });
    expect(JSON.stringify(exported?.result)).toContain('Local-MCP-Chart.json');
    await expect(fs.access(path.join(outputDir, 'Local-MCP-Chart.json'))).resolves.toBeUndefined();

    await expect(callTool({ name: 'illustry_status', arguments: { workspace: tempDir } }))
      .resolves.toMatchObject({ content: [{ type: 'text' }] });
  });

  it('routes list, import, and export tools through the server adapter when requested', async () => {
    const source = path.join(tempDir, 'server.csv');
    const outputDir = path.join(tempDir, 'out');
    await fs.writeFile(source, 'name,value\nA,1\n', 'utf8');

    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'local-import',
      method: 'tools/call',
      params: {
        name: 'illustry_import_visualization',
        arguments: {
          workspace: tempDir,
          filePath: source,
          name: 'MCP Server Chart'
        }
      }
    });

    const calls: Array<{ pathname: string; body?: BodyInit | null }> = [];
    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      calls.push({ pathname: url.pathname, body: init?.body });
      if (url.pathname === '/api/visualizations') {
        return new Response(JSON.stringify({ items: [{ name: 'MCP Server Chart' }] }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/visualization') {
        return new Response(JSON.stringify({ name: 'MCP Server Chart' }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/visualization/export/bundle') {
        return new Response(Buffer.from('<svg></svg>'), {
          headers: {
            'content-type': 'image/svg+xml;charset=utf-8',
            'content-disposition': 'attachment; filename="MCP-Server-Chart.svg"'
          }
        });
      }
      return new Response('not found', { status: 404 });
    };

    const listed = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'server-list',
      method: 'tools/call',
      params: {
        name: 'illustry_list_assets',
        arguments: {
          server: 'http://illustry.local',
          resource: 'visualizations',
          cookie: 'illustry_session=session; illustry_csrf=csrf-token',
          csrfToken: 'csrf-token'
        }
      }
    });
    expect(JSON.stringify(listed?.result)).toContain('MCP Server Chart');

    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'server-import',
      method: 'tools/call',
      params: {
        name: 'illustry_import_visualization',
        arguments: {
          server: 'http://illustry.local',
          filePath: source,
          name: 'MCP Server Chart',
          type: 'bar-chart',
          project: 'Default',
          cookie: 'illustry_session=session; illustry_csrf=csrf-token',
          csrfToken: 'csrf-token'
        }
      }
    });

    const exported = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'server-export',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          server: 'http://illustry.local',
          workspace: tempDir,
          asset: 'MCP Server Chart',
          format: 'svg',
          outputDir,
          cookie: 'illustry_session=session; illustry_csrf=csrf-token',
          csrfToken: 'csrf-token'
        }
      }
    });
    expect(JSON.stringify(exported?.result)).toContain('MCP-Server-Chart.svg');
    await expect(fs.access(path.join(outputDir, 'MCP-Server-Chart.svg'))).resolves.toBeUndefined();
    expect(calls.map((call) => call.pathname)).toEqual([
      '/api/visualizations',
      '/api/visualization',
      '/api/visualization/export/bundle'
    ]);
    expect(calls[1].body).toBeInstanceOf(FormData);
  });

  it('covers server status, dashboard aliases, chart-file shapes, and zip exports', async () => {
    const chartOptionFile = path.join(tempDir, 'option-chart.json');
    const chartArrayFile = path.join(tempDir, 'array-chart.json');
    const chartObjectFile = path.join(tempDir, 'object-chart.json');
    const outputDir = path.join(tempDir, 'server-out');
    await fs.writeFile(chartOptionFile, JSON.stringify({
      title: 'Option chart',
      option: {
        xAxis: { type: 'category', data: ['A'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [1] }]
      }
    }), 'utf8');
    await fs.writeFile(chartArrayFile, JSON.stringify([{
      title: 'Array chart',
      option: {
        xAxis: { type: 'category', data: ['B'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [2] }]
      }
    }]), 'utf8');
    await fs.writeFile(chartObjectFile, JSON.stringify({
      charts: [{
        title: 'Nested chart',
        option: {
          xAxis: { type: 'category', data: ['C'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [3] }]
        }
      }]
    }), 'utf8');

    global.fetch = async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/dashboards') {
        return new Response(JSON.stringify({ items: [{ name: 'Dashboard A' }] }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/dashboard/export/bundle') {
        return new Response(Buffer.from('zip'), {
          headers: {
            'content-type': 'application/zip',
            'content-disposition': 'attachment; filename="Dashboard-A.zip"'
          }
        });
      }
      return new Response('not found', { status: 404 });
    };

    const status = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'server-status',
      method: 'tools/call',
      params: {
        name: 'illustry_status',
        arguments: { server: 'http://illustry.local' }
      }
    });
    expect(JSON.stringify(status?.result)).toContain('"mode\\": \\"server');

    const dashboards = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'dashboards',
      method: 'tools/call',
      params: {
        name: 'illustry_list_assets',
        arguments: { server: 'http://illustry.local', resource: 'dashboards' }
      }
    });
    expect(JSON.stringify(dashboards?.result)).toContain('Dashboard A');

    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'dashboard-export',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          server: 'http://illustry.local',
          resource: 'dashboards',
          asset: 'Dashboard A',
          chartFile: chartOptionFile,
          outputDir
        }
      }
    });
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'dashboard-export-array',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          server: 'http://illustry.local',
          resource: 'dashboard',
          asset: 'Dashboard A',
          chartFile: chartArrayFile,
          outputDir
        }
      }
    });
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'dashboard-export-object',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          server: 'http://illustry.local',
          resource: 'dashboard',
          asset: 'Dashboard A',
          chartFile: chartObjectFile,
          outputDir
        }
      }
    });
    await expect(fs.access(path.join(outputDir, 'Dashboard-A.zip'))).resolves.toBeUndefined();
  });

  it('supports auth/session/email/password tools and returns session snapshots', async () => {
    const calls: Array<{ pathname: string; method?: string; headers?: Headers; body?: BodyInit | null }> = [];
    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      calls.push({ pathname: url.pathname, method: init?.method, headers: new Headers(init?.headers), body: init?.body });
      if (url.pathname === '/api/auth/login' || url.pathname === '/api/auth/register') {
        return new Response(JSON.stringify({
          user: {
            id: 'user_1',
            email: 'mcp@illustry.local',
            name: 'MCP User',
            isEmailVerified: true,
            roles: [],
            hasAvatar: false
          }
        }), {
          status: url.pathname === '/api/auth/register' ? 201 : 200,
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'illustry_sid=sid; Path=/; HttpOnly, illustry_csrf=csrf; Path=/'
          }
        });
      }
      if (url.pathname === '/api/auth/me') {
        expect(new Headers(init?.headers).get('cookie')).toContain('illustry_sid=sid');
        return new Response(JSON.stringify({
          id: 'user_1',
          email: 'mcp@illustry.local',
          name: 'MCP User',
          isEmailVerified: true,
          roles: [],
          hasAvatar: false
        }), { headers: { 'content-type': 'application/json' } });
      }
      if (url.pathname === '/api/auth/logout') {
        expect(new Headers(init?.headers).get('x-csrf-token')).toBe('csrf');
        return new Response(JSON.stringify({ ok: true }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'illustry_sid=; Max-Age=0; Path=/, illustry_csrf=; Max-Age=0; Path=/'
          }
        });
      }
      return new Response(JSON.stringify({ ok: true, message: 'sent' }), {
        headers: { 'content-type': 'application/json' }
      });
    };

    const login = parseToolText(await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'login',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_login',
        arguments: {
          server: 'http://illustry.local',
          email: 'mcp@illustry.local',
          password: 'secret'
        }
      }
    }));
    expect(JSON.stringify(login)).toContain('mcp@illustry.local');
    expect(JSON.stringify(login)).toContain('illustry_sid=sid');

    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'signup',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_signup',
        arguments: {
          server: 'http://illustry.local',
          email: 'mcp@illustry.local',
          password: 'secret',
          name: 'MCP User'
        }
      }
    });

    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'session',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_session',
        arguments: {
          server: 'http://illustry.local',
          cookie: 'illustry_sid=sid; illustry_csrf=csrf',
          csrfToken: 'csrf'
        }
      }
    });

    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'verify-token',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_verify_email',
        arguments: { server: 'http://illustry.local', token: 'verify-token' }
      }
    });
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'verify-code',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_verify_email',
        arguments: { server: 'http://illustry.local', email: 'mcp@illustry.local', code: '123456' }
      }
    });
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'resend',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_resend_verification',
        arguments: { server: 'http://illustry.local', email: 'mcp@illustry.local' }
      }
    });
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'forgot',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_forgot_password',
        arguments: { server: 'http://illustry.local', email: 'mcp@illustry.local' }
      }
    });
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'reset',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_reset_password',
        arguments: { server: 'http://illustry.local', token: 'reset-token', password: 'new-secret' }
      }
    });
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'logout',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_logout',
        arguments: {
          server: 'http://illustry.local',
          cookie: 'illustry_sid=sid; illustry_csrf=csrf',
          csrfToken: 'csrf'
        }
      }
    });

    expect(calls.map((call) => call.pathname)).toEqual([
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/me',
      '/api/auth/verify-email',
      '/api/auth/verify-email-code',
      '/api/auth/resend-verification',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/logout'
    ]);
  });

  it('supports delete tools locally and on the server', async () => {
    const source = path.join(tempDir, 'delete.csv');
    await fs.writeFile(source, 'name,value\nA,1\n', 'utf8');
    await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'local-import',
      method: 'tools/call',
      params: {
        name: 'illustry_import_visualization',
        arguments: { workspace: tempDir, filePath: source, name: 'Delete Me' }
      }
    });

    const localDelete = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'local-delete',
      method: 'tools/call',
      params: {
        name: 'illustry_delete_resource',
        arguments: { workspace: tempDir, resource: 'assets', name: 'Delete Me' }
      }
    });
    expect(JSON.stringify(localDelete?.result)).toContain('\\"ok\\": true');

    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      return new Response(JSON.stringify({
        ok: true,
        route: url.pathname,
        method: init?.method
      }), { headers: { 'content-type': 'application/json' } });
    };

    const projectDelete = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'project-delete',
      method: 'tools/call',
      params: {
        name: 'illustry_delete_resource',
        arguments: { server: 'http://illustry.local', resource: 'projects', name: 'Project A' }
      }
    });
    const dashboardDelete = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'dashboard-delete',
      method: 'tools/call',
      params: {
        name: 'illustry_delete_resource',
        arguments: { server: 'http://illustry.local', resource: 'dashboards', name: 'Dashboard A' }
      }
    });
    const visualizationDelete = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'visualization-delete',
      method: 'tools/call',
      params: {
        name: 'illustry_delete_resource',
        arguments: {
          server: 'http://illustry.local',
          resource: 'visualizations',
          name: 'Visualization A',
          type: 'bar-chart',
          project: 'Project A'
        }
      }
    });
    expect(JSON.stringify(projectDelete?.result)).toContain('/api/project');
    expect(JSON.stringify(dashboardDelete?.result)).toContain('/api/dashboard');
    expect(JSON.stringify(visualizationDelete?.result)).toContain('/api/visualization');
  });

  it('returns structured MCP errors for invalid requests, tools, arguments, resources, chart files, and backend failures', async () => {
    await expect(Promise.resolve().then(() => new McpStdioFramer().push(encodeMcpMessage({
      jsonrpc: '1.0',
      id: 1,
      method: 'tools/list'
    } as any)))).rejects.toThrow('Invalid MCP JSON-RPC request');

    const unknown = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'unknown-tool',
      method: 'tools/call',
      params: { name: 'missing_tool', arguments: {} }
    });
    expect(unknown?.error).toMatchObject({ code: -32602 });

    const missingFile = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'missing-file',
      method: 'tools/call',
      params: { name: 'illustry_import_visualization', arguments: {} }
    });
    expect(missingFile?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_MISSING_FILE' });

    const unsupportedList = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'unsupported-list',
      method: 'tools/call',
      params: {
        name: 'illustry_list_assets',
        arguments: { server: 'http://illustry.local', resource: 'widgets' }
      }
    });
    expect(unsupportedList?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_UNSUPPORTED_RESOURCE' });

    const unsupportedExport = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'unsupported-export',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          server: 'http://illustry.local',
          resource: 'report',
          asset: 'Nope'
        }
      }
    });
    expect(unsupportedExport?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_UNSUPPORTED_EXPORT_RESOURCE' });

    const invalidChart = path.join(tempDir, 'invalid-chart.json');
    await fs.writeFile(invalidChart, JSON.stringify({ nope: true }), 'utf8');
    const chartError = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'invalid-chart',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          server: 'http://illustry.local',
          asset: 'Nope',
          chartFile: invalidChart
        }
      }
    });
    expect(chartError?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_INVALID_CHART_FILE' });

    const missingCharts = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'missing-charts',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: {
          server: 'http://illustry.local',
          workspace: tempDir,
          asset: 'Missing Charts'
        }
      }
    });
    expect(missingCharts?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_SERVER_EXPORT_MISSING_CHARTS' });

    const deleteMissing = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'delete-missing',
      method: 'tools/call',
      params: {
        name: 'illustry_delete_resource',
        arguments: { workspace: tempDir, name: 'Missing' }
      }
    });
    expect(deleteMissing?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_ASSET_NOT_FOUND' });

    const unsupportedDelete = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'unsupported-delete',
      method: 'tools/call',
      params: {
        name: 'illustry_delete_resource',
        arguments: { workspace: tempDir, resource: 'widgets', name: 'Missing' }
      }
    });
    expect(unsupportedDelete?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_UNSUPPORTED_RESOURCE' });

    const missingAsset = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'missing-asset',
      method: 'tools/call',
      params: {
        name: 'illustry_export_asset',
        arguments: { workspace: tempDir }
      }
    });
    expect(missingAsset?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_MISSING_ASSET' });

    const missingServer = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'missing-server',
      method: 'tools/call',
      params: { name: 'illustry_auth_login', arguments: { email: 'a', password: 'b' } }
    });
    expect(missingServer?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_MISSING_SERVER' });

    global.fetch = async () => new Response(JSON.stringify({ error: 'Backend failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
    const backendFailure = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'backend-failure',
      method: 'tools/call',
      params: {
        name: 'illustry_auth_forgot_password',
        arguments: { server: 'http://illustry.local', email: 'mcp@illustry.local' }
      }
    });
    expect(backendFailure?.error).toMatchObject({ code: -32603, message: 'Backend failed' });

    await expect(callTool({ name: 'illustry_auth_forgot_password', arguments: { server: 'http://illustry.local' } }))
      .rejects.toMatchObject({ code: 'ILLUSTRY_MCP_MISSING_ARGUMENT' });

    const malformedToolCall = await handleMcpRequest({
      jsonrpc: '2.0',
      id: 'malformed-tool-call',
      method: 'tools/call',
      params: undefined
    });
    expect(malformedToolCall?.error?.data).toMatchObject({ code: 'ILLUSTRY_MCP_UNKNOWN_TOOL' });
  });

  it('runs the stdio server with injectable streams and writes protocol and parse errors', async () => {
    const input = new EventEmitter() as NodeJS.ReadableStream;
    const outputChunks: Buffer[] = [];
    const errorChunks: string[] = [];
    const output = new Writable({
      write(chunk, _encoding, callback) {
        outputChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      }
    });
    const errorOutput = new Writable({
      write(chunk, _encoding, callback) {
        errorChunks.push(chunk.toString());
        callback();
      }
    });

    const stop = startMcpStdioServer(input, output, errorOutput);
    input.emit('data', encodeMcpMessage({
      jsonrpc: '2.0',
      id: 'tools',
      method: 'tools/list',
      params: {}
    }));
    await new Promise((resolve) => setImmediate(resolve));
    expect(Buffer.concat(outputChunks).toString('utf8')).toContain('illustry_status');

    input.emit('data', Buffer.from('Content-Length: 2\r\n\r\n{}'));
    await new Promise((resolve) => setImmediate(resolve));
    expect(errorChunks.join('')).toContain('Invalid MCP JSON-RPC request');
    stop();
  });
});
