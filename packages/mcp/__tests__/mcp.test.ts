import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  McpStdioFramer,
  encodeMcpMessage,
  handleMcpRequest
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
});
