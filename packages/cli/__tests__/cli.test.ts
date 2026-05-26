import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runCli } from '../src';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-cli-'));

describe('@illustry/cli', () => {
  let tempDir: string;
  let originalFetch: typeof fetch;
  const output: string[] = [];

  beforeEach(async () => {
    tempDir = await makeTempDir();
    originalFetch = global.fetch;
    output.length = 0;
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('imports, lists, and exports locally without server access', async () => {
    const source = path.join(tempDir, 'data.csv');
    const exportsDir = path.join(tempDir, 'exports');
    await fs.writeFile(source, 'label,value\nA,5\nB,8\n', 'utf8');

    await runCli([
      'import',
      'visualization',
      '--workspace',
      tempDir,
      '--file',
      source,
      '--name',
      'CLI Chart',
      '--json'
    ], { stdout: (message) => output.push(message) });

    const list = await runCli(['list', '--workspace', tempDir, '--json'], {
      stdout: (message) => output.push(message)
    });
    expect(JSON.stringify(list)).toContain('CLI Chart');

    const exported = await runCli([
      'export',
      '--workspace',
      tempDir,
      '--asset',
      'CLI Chart',
      '--format',
      'json',
      '--out',
      exportsDir,
      '--json'
    ], { stdout: (message) => output.push(message) });
    expect(JSON.stringify(exported)).toContain('CLI-Chart.json');
    await expect(fs.access(path.join(exportsDir, 'CLI-Chart.json'))).resolves.toBeUndefined();
  });

  it('can route list, import, and export through the Illustry server adapter', async () => {
    const source = path.join(tempDir, 'server.csv');
    const exportsDir = path.join(tempDir, 'server-exports');
    await fs.writeFile(source, 'label,value\nA,5\n', 'utf8');

    await runCli([
      'import',
      'visualization',
      '--workspace',
      tempDir,
      '--file',
      source,
      '--name',
      'Server Chart',
      '--json'
    ], { stdout: (message) => output.push(message) });

    const calls: Array<{ pathname: string; method?: string; body?: BodyInit | null }> = [];
    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      calls.push({ pathname: url.pathname, method: init?.method, body: init?.body });
      if (url.pathname === '/api/visualizations') {
        return new Response(JSON.stringify({ items: [{ name: 'Server Chart' }] }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/visualization') {
        return new Response(JSON.stringify({ name: 'Server Chart' }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/visualization/export/bundle') {
        return new Response(Buffer.from('<svg></svg>'), {
          headers: {
            'content-type': 'image/svg+xml;charset=utf-8',
            'content-disposition': 'attachment; filename="Server-Chart.svg"'
          }
        });
      }
      return new Response('not found', { status: 404 });
    };

    const listed = await runCli([
      'list',
      '--server',
      'http://illustry.local',
      '--resource',
      'visualizations',
      '--cookie',
      'illustry_session=session; illustry_csrf=csrf-token',
      '--csrf',
      'csrf-token',
      '--json'
    ], { stdout: (message) => output.push(message) });
    expect(JSON.stringify(listed)).toContain('Server Chart');

    await runCli([
      'import',
      'visualization',
      '--server',
      'http://illustry.local',
      '--file',
      source,
      '--name',
      'Server Chart',
      '--type',
      'bar-chart',
      '--project',
      'Default',
      '--cookie',
      'illustry_session=session; illustry_csrf=csrf-token',
      '--csrf',
      'csrf-token',
      '--json'
    ], { stdout: (message) => output.push(message) });

    const exported = await runCli([
      'export',
      '--server',
      'http://illustry.local',
      '--workspace',
      tempDir,
      '--asset',
      'Server Chart',
      '--type',
      'bar-chart',
      '--format',
      'svg',
      '--out',
      exportsDir,
      '--cookie',
      'illustry_session=session; illustry_csrf=csrf-token',
      '--csrf',
      'csrf-token',
      '--json'
    ], { stdout: (message) => output.push(message) });

    expect(JSON.stringify(exported)).toContain('Server-Chart.svg');
    await expect(fs.access(path.join(exportsDir, 'Server-Chart.svg'))).resolves.toBeUndefined();
    expect(calls.map((call) => call.pathname)).toEqual([
      '/api/visualizations',
      '/api/visualization',
      '/api/visualization/export/bundle'
    ]);
    expect(calls[1].body).toBeInstanceOf(FormData);
  });
});
