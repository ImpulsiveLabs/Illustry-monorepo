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

  beforeEach(async () => {
    tempDir = await makeTempDir();
  });

  afterEach(async () => {
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
});
