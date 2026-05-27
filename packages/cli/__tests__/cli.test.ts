import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { IllustryError } from '@illustry/core';
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

  it('switches modes and persists live server configuration', async () => {
    const configDir = path.join(tempDir, 'config');

    await runCli(['mode', 'offline', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    const offline = await runCli(['status', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    expect(JSON.stringify(offline)).toContain('"mode":"offline"');

    await runCli([
      'connect',
      '--server',
      'http://illustry.local',
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir });

    const live = await runCli(['status', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    expect(JSON.stringify(live)).toContain('"mode":"live"');
    expect(JSON.stringify(live)).toContain('http://illustry.local');

    await runCli(['disconnect', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    const disconnected = await runCli(['status', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    expect(JSON.stringify(disconnected)).toContain('"mode":"offline"');
  });

  it('starts interactively and lets users choose offline or live mode', async () => {
    const offlineConfig = path.join(tempDir, 'offline-config');
    await runCli(['shell', '--once', '--mode', 'offline'], {
      stdout: (message) => output.push(message)
    }, { configDir: offlineConfig });
    const offline = await runCli(['status', '--json'], { stdout: (message) => output.push(message) }, { configDir: offlineConfig });
    expect(JSON.stringify(offline)).toContain('"mode":"offline"');

    const liveConfig = path.join(tempDir, 'live-config');
    await runCli(['shell', '--once', '--mode', 'live', '--url', 'http://illustry.local'], {
      stdout: (message) => output.push(message)
    }, { configDir: liveConfig });
    const live = await runCli(['status', '--json'], { stdout: (message) => output.push(message) }, { configDir: liveConfig });
    expect(JSON.stringify(live)).toContain('"mode":"live"');
    expect(JSON.stringify(live)).toContain('http://illustry.local');
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
      '--map',
      'label=label,value=value',
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
      '--label-column',
      'label',
      '--value-column',
      'value',
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
    expect((calls[1].body as FormData).get('fileDetails')).toBe(JSON.stringify({
      importMapping: { label: 'label', value: 'value' }
    }));
  });

  it('persists login sessions, supports signup/logout, and reports expired sessions', async () => {
    const configDir = path.join(tempDir, 'auth-config');
    await runCli(['connect', '--server', 'http://illustry.local', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });

    const calls: string[] = [];
    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      calls.push(`${init?.method || 'GET'} ${url.pathname}`);
      if (url.pathname === '/api/auth/login') {
        return new Response(JSON.stringify({
          user: {
            id: 'user_1',
            email: 'dev@illustry.local',
            name: 'Dev',
            isEmailVerified: true,
            roles: [],
            hasAvatar: false
          }
        }), {
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
          email: 'dev@illustry.local',
          name: 'Dev',
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
      return new Response('not found', { status: 404 });
    };

    await runCli([
      'login',
      '--email',
      'dev@illustry.local',
      '--password',
      'secret',
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir });

    const current = await runCli(['session', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    expect(JSON.stringify(current)).toContain('dev@illustry.local');

    await runCli(['logout', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    expect(calls).toEqual([
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/logout'
    ]);

    global.fetch = async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === '/api/auth/register') {
        return new Response(JSON.stringify({
          user: {
            id: 'user_2',
            email: 'new@illustry.local',
            name: 'New User',
            isEmailVerified: false,
            roles: [],
            hasAvatar: false
          }
        }), {
          status: 201,
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'illustry_sid=sid2; Path=/; HttpOnly, illustry_csrf=csrf2; Path=/'
          }
        });
      }
      if (url.pathname === '/api/auth/me') {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not found', { status: 404 });
    };

    await runCli([
      'signup',
      '--email',
      'new@illustry.local',
      '--password',
      'secret',
      '--name',
      'New User',
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir });

    await expect(runCli(['session', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir })).rejects.toMatchObject({
      code: 'ILLUSTRY_SESSION_EXPIRED'
    } satisfies Partial<IllustryError>);
  });

  it('imports JSON, CSV, XLSX, and XML locally and rejects malformed JSON', async () => {
    const workspace = path.join(tempDir, 'imports');
    const json = path.join(tempDir, 'sales.json');
    const csv = path.join(tempDir, 'sales.csv');
    const xml = path.join(tempDir, 'sales.xml');
    const xlsx = path.join(tempDir, 'sales.xlsx');
    const malformed = path.join(tempDir, 'bad.json');

    await fs.writeFile(json, JSON.stringify({ rows: [{ label: 'A', value: 1 }] }), 'utf8');
    await fs.writeFile(csv, 'label,value\nA,1\n', 'utf8');
    await fs.writeFile(xml, '<rows><row><label>A</label><value>1</value></row></rows>', 'utf8');
    await fs.writeFile(malformed, '{"broken"', 'utf8');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    sheet.addRows([['label', 'value'], ['A', 1]]);
    await workbook.xlsx.writeFile(xlsx);

    for (const [file, name] of [[json, 'JSON'], [csv, 'CSV'], [xlsx, 'XLSX'], [xml, 'XML']]) {
      await runCli([
        'import',
        file,
        '--workspace',
        workspace,
        '--name',
        name,
        '--json'
      ], { stdout: (message) => output.push(message) });
    }

    const listed = await runCli(['list', 'assets', '--workspace', workspace, '--json'], {
      stdout: (message) => output.push(message)
    });
    expect(JSON.stringify(listed)).toContain('JSON');
    expect(JSON.stringify(listed)).toContain('CSV');
    expect(JSON.stringify(listed)).toContain('XLSX');
    expect(JSON.stringify(listed)).toContain('XML');

    await expect(runCli([
      'import',
      malformed,
      '--workspace',
      workspace,
      '--json'
    ], { stdout: (message) => output.push(message) })).rejects.toBeInstanceOf(Error);
  });

  it('exports every local format and bundles multiple assets into a zip', async () => {
    const workspace = path.join(tempDir, 'export-workspace');
    const exportsDir = path.join(tempDir, 'all-exports');
    const source = path.join(tempDir, 'chart.csv');
    await fs.writeFile(source, 'label,value\nA,5\nB,8\n', 'utf8');
    await runCli([
      'import',
      source,
      '--workspace',
      workspace,
      '--name',
      'All Formats',
      '--json'
    ], { stdout: (message) => output.push(message) });

    for (const format of ['json', 'svg', 'png', 'jpg', 'webp', 'web-component', 'excel', 'pdf', 'word', 'ppt']) {
      const exported = await runCli([
        'export',
        '--workspace',
        workspace,
        '--asset',
        'All Formats',
        '--format',
        format,
        '--out',
        path.join(exportsDir, format),
        '--json'
      ], { stdout: (message) => output.push(message) });
      expect(JSON.stringify(exported)).toContain('All-Formats');
    }

    const excelPath = path.join(exportsDir, 'excel', 'All-Formats.xlsx');
    const excelZip = await JSZip.loadAsync(await fs.readFile(excelPath));
    expect(excelZip.file('xl/workbook.xml')).toBeTruthy();
    expect(Object.keys(excelZip.files).some((name) => name.startsWith('xl/media/'))).toBe(true);

    const bundle = await runCli([
      'export',
      '--workspace',
      workspace,
      '--asset',
      'All Formats',
      '--format',
      'svg,png,excel',
      '--out',
      exportsDir,
      '--json'
    ], { stdout: (message) => output.push(message) });
    expect(JSON.stringify(bundle)).toContain('"bundled":true');
    const bundleZip = await JSZip.loadAsync(await fs.readFile(path.join(exportsDir, 'All-Formats.zip')));
    expect(bundleZip.file('All-Formats.svg')).toBeTruthy();
    expect(bundleZip.file('All-Formats.png')).toBeTruthy();
    expect(bundleZip.file('All-Formats.xlsx')).toBeTruthy();
  });

  it('covers help, mode-aware plain output, inactive sessions, and invalid command inputs', async () => {
    const configDir = path.join(tempDir, 'edge-config');

    const help = await runCli([], { stdout: (message) => output.push(message) }, { configDir });
    expect(help).toEqual({ ok: true, help: true });
    expect(output.join('\n')).toContain('Illustry CLI');

    await expect(runCli(['--help'], { stdout: (message) => output.push(message) }, { configDir }))
      .resolves.toEqual({ ok: true, help: true });

    output.length = 0;
    const status = await runCli(['status'], { stdout: (message) => output.push(message) }, { configDir });
    expect(JSON.stringify(status)).toContain('"mode":"offline"');
    expect(output.join('\n')).toContain('[offline]');

    const inactiveSession = await runCli(['session', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    expect(JSON.stringify(inactiveSession)).toContain('"authenticated":false');

    const noSessionLogout = await runCli(['logout', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    expect(JSON.stringify(noSessionLogout)).toContain('No live session was active');

    await expect(runCli(['mode', 'space'], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toThrow('Unsupported mode');
    await expect(runCli(['connect'], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toThrow('Missing server URL');
    await expect(runCli(['connect', 'http://positional.local', '--json'], { stdout: (message) => output.push(message) }, { configDir }))
      .resolves.toMatchObject({ mode: 'live', server: 'http://positional.local' });
    await expect(runCli(['connect', '--url', 'http://option.local', '--json'], { stdout: (message) => output.push(message) }, { configDir }))
      .resolves.toMatchObject({ mode: 'live', server: 'http://option.local' });
    await expect(runCli(['shell', '--once', '--mode', 'live'], { stdout: (message) => output.push(message) }, { configDir }))
      .resolves.toEqual({ ok: true });
    await expect(runCli(['import', '--json'], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_MISSING_FILE' });
    await expect(runCli(['list', 'widgets', '--json'], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_UNSUPPORTED_RESOURCE' });
    await expect(runCli([
      'export',
      '--asset',
      'Missing',
      '--resource',
      'report',
      '--server',
      'http://illustry.local',
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_UNSUPPORTED_EXPORT_RESOURCE' });

    global.fetch = async () => new Response('down', { status: 503 });
    const doctor = await runCli(['doctor', '--server', 'http://down.local', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    expect(JSON.stringify(doctor)).toContain('"reachable":false');
  });

  it('covers auth utility commands: verification, reset, and backend errors', async () => {
    const configDir = path.join(tempDir, 'auth-utility-config');
    await runCli(['connect', '--server', 'http://illustry.local', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });

    const calls: Array<{ pathname: string; body?: string }> = [];
    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      calls.push({
        pathname: url.pathname,
        body: typeof init?.body === 'string' ? init.body : undefined
      });
      if (url.pathname === '/api/auth/forgot-password' && String(init?.body).includes('fail@illustry.local')) {
        return new Response(JSON.stringify({ error: 'No reset for you' }), {
          status: 400,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok: true, message: 'queued' }), {
        headers: {
          'content-type': 'application/json',
          'set-cookie': 'illustry_sid=sid; Path=/; HttpOnly, illustry_csrf=csrf; Path=/'
        }
      });
    };

    await runCli(['verify-email', '--token', 'verify-token', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    await runCli(['verify-email', '--email', 'dev@illustry.local', '--code', '123456', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    await runCli(['resend-verification', '--email', 'dev@illustry.local', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    await runCli(['forgot-password', '--email', 'dev@illustry.local', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    await runCli(['reset-password', '--token', 'reset-token', '--password', 'new-secret', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });

    expect(calls.map((call) => call.pathname)).toEqual([
      '/api/auth/verify-email',
      '/api/auth/verify-email-code',
      '/api/auth/resend-verification',
      '/api/auth/forgot-password',
      '/api/auth/reset-password'
    ]);
    expect(calls[0].body).toContain('verify-token');
    expect(calls[1].body).toContain('123456');

    await expect(runCli(['verify-email', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir })).rejects.toMatchObject({ code: 'ILLUSTRY_CLI_MISSING_AUTH_FIELD' });

    await expect(runCli(['forgot-password', '--email', 'fail@illustry.local', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir })).rejects.toMatchObject({ status: 400 });
  });

  it('covers live listing queries, delete routes, doctor, and live dashboard export with chart files', async () => {
    const configDir = path.join(tempDir, 'live-coverage-config');
    const workspace = path.join(tempDir, 'live-workspace');
    const exportsDir = path.join(tempDir, 'live-exports');
    const chartFile = path.join(tempDir, 'chart.json');
    await fs.writeFile(chartFile, JSON.stringify({
      charts: [{
        title: 'Server chart',
        option: {
          xAxis: { type: 'category', data: ['A'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [1] }]
        }
      }]
    }), 'utf8');

    const calls: Array<{ pathname: string; method?: string; body?: BodyInit | null; search?: string }> = [];
    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      calls.push({
        pathname: url.pathname,
        method: init?.method,
        body: init?.body,
        search: url.search
      });
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/projects') {
        return new Response(JSON.stringify({ items: [{ name: 'Project A', isActive: true }] }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/dashboards') {
        return new Response(JSON.stringify({ items: [{ name: 'Dashboard A' }] }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/visualizations') {
        return new Response(JSON.stringify({ items: [{ name: 'Visualization A', type: 'bar-chart' }] }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/project' || url.pathname === '/api/dashboard' || url.pathname === '/api/visualization') {
        return new Response(JSON.stringify({ ok: true, deleted: true }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.pathname === '/api/dashboard/export/bundle') {
        return new Response(Buffer.from('dashboard export'), {
          headers: {
            'content-type': 'application/zip',
            'content-disposition': 'attachment; filename="Dashboard-A.zip"'
          }
        });
      }
      return new Response('not found', { status: 404 });
    };

    await runCli(['connect', '--server', 'http://illustry.local', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });

    const projects = await runCli([
      'list',
      'projects',
      '--text',
      'Project',
      '--page',
      '2',
      '--sort',
      'name',
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir, cwd: tempDir });
    expect(JSON.stringify(projects)).toContain('Project A');

    const dashboards = await runCli(['list', 'dashboards', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });
    expect(JSON.stringify(dashboards)).toContain('Dashboard A');

    const visualizations = await runCli(['list', 'visualizations', '--shared-scope', 'external', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });
    expect(JSON.stringify(visualizations)).toContain('Visualization A');

    await runCli(['delete', 'projects', 'Project A', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });
    await runCli(['delete', 'dashboards', 'Dashboard A', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });
    await runCli(['delete', 'visualizations', 'Visualization A', '--type', 'bar-chart', '--project', 'Project A', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });

    const exported = await runCli([
      'export',
      '--workspace',
      workspace,
      '--asset',
      'Dashboard A',
      '--resource',
      'dashboard',
      '--format',
      'svg,png',
      '--chart-file',
      chartFile,
      '--out',
      exportsDir,
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir, cwd: tempDir });
    expect(JSON.stringify(exported)).toContain('Dashboard-A.zip');
    await expect(fs.access(path.join(exportsDir, 'Dashboard-A.zip'))).resolves.toBeUndefined();

    const doctor = await runCli(['doctor', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });
    expect(JSON.stringify(doctor)).toContain('"reachable":true');

    const browseBodies = calls
      .filter((call) => call.pathname === '/api/projects' || call.pathname === '/api/visualizations')
      .map((call) => String(call.body));
    expect(browseBodies.join('\n')).toContain('"text":"Project"');
    expect(browseBodies.join('\n')).toContain('"sharedScope":"external"');
    expect(calls.some((call) => call.pathname === '/api/dashboard/export/bundle')).toBe(true);
    expect(calls.some((call) => call.pathname === '/api/project' && call.method === 'DELETE')).toBe(true);
    expect(calls.some((call) => call.pathname === '/api/dashboard' && call.method === 'DELETE')).toBe(true);
    expect(calls.some((call) => call.pathname === '/api/visualization' && call.method === 'DELETE')).toBe(true);
  });

  it('covers local delete behavior and server export validation failures', async () => {
    const workspace = path.join(tempDir, 'delete-workspace');
    const source = path.join(tempDir, 'delete.csv');
    const invalidChartFile = path.join(tempDir, 'invalid-chart.json');
    await fs.writeFile(source, 'label,value\nA,1\n', 'utf8');
    await fs.writeFile(invalidChartFile, JSON.stringify({ nope: true }), 'utf8');

    await runCli(['import', source, '--workspace', workspace, '--name', 'Delete Me', '--json'], {
      stdout: (message) => output.push(message)
    });

    const deleted = await runCli(['delete', 'assets', 'Delete Me', '--workspace', workspace, '--json'], {
      stdout: (message) => output.push(message)
    });
    expect(JSON.stringify(deleted)).toContain('"ok":true');

    await expect(runCli(['delete', 'assets', 'Delete Me', '--workspace', workspace, '--json'], {
      stdout: (message) => output.push(message)
    })).rejects.toMatchObject({ code: 'ILLUSTRY_ASSET_NOT_FOUND' });

    await expect(runCli([
      'export',
      '--server',
      'http://illustry.local',
      '--asset',
      'Missing Charts',
      '--format',
      'svg',
      '--json'
    ], { stdout: (message) => output.push(message) })).rejects.toMatchObject({
      code: 'ILLUSTRY_CLI_SERVER_EXPORT_MISSING_CHARTS'
    });

    await expect(runCli([
      'export',
      '--server',
      'http://illustry.local',
      '--asset',
      'Invalid Charts',
      '--chart-file',
      invalidChartFile,
      '--json'
    ], { stdout: (message) => output.push(message) })).rejects.toMatchObject({
      code: 'ILLUSTRY_CLI_INVALID_CHART_FILE'
    });
  });
});
