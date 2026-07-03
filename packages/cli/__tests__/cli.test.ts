import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runCli } from '../src';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-cli-'));
describe('@illustry/cli', () => {
  let tempDir: string;
  let originalFetch: typeof fetch;
  const output: string[] = [];
  const mockHealthyBackend = () => {
    global.fetch = async (input) => {
      const pathname = new URL(input.toString()).pathname;
      if (pathname === '/api/health' || pathname === '/health') {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not found', { status: 404 });
    };
  };

  beforeEach(async () => {
    tempDir = await makeTempDir();
    originalFetch = global.fetch;
    output.length = 0;
  });

  it('persists live server configuration', async () => {
    const configDir = path.join(tempDir, 'config');

    await runCli([
      'connect',
      '--server',
      'http://illustry.local',
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir });

    const live = await runCli(['status', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    expect(JSON.stringify(live)).toContain('"mode":"live"');
    expect(JSON.stringify(live)).toContain('http://illustry.local');

    await runCli(['mode', 'live', '--json'], { stdout: (message) => output.push(message) }, { configDir });
    await expect(runCli(['mode', 'offline', '--json'], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toThrow('Unsupported mode');
  });

  it('starts interactively in live mode', async () => {
    const liveConfig = path.join(tempDir, 'live-config');
    mockHealthyBackend();
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

  it('can route list and import through the Illustry server adapter', async () => {
    const configDir = path.join(tempDir, 'server-adapter-config');
    const source = path.join(tempDir, 'server.csv');
    await fs.writeFile(source, 'label,value\nA,5\n', 'utf8');

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
    ], { stdout: (message) => output.push(message) }, { configDir });
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
      '--label-column',
      'label',
      '--value-column',
      'value',
      '--cookie',
      'illustry_session=session; illustry_csrf=csrf-token',
      '--csrf',
      'csrf-token',
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir });

    expect(calls.map((call) => call.pathname)).toEqual([
      '/api/visualizations',
      '/api/visualization'
    ]);
    expect(calls[1].body).toBeInstanceOf(FormData);
    expect((calls[1].body as FormData).get('fileDetails')).toBe(JSON.stringify({
      fileType: 'CSV',
      mapping: { headers: 'label', data: 'value' }
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
          ok: true,
          email: 'new@illustry.local',
          verificationRequired: true
        }), {
          status: 202,
          headers: { 'content-type': 'application/json' }
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

    const pendingSession = await runCli(['session', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir });
    expect(pendingSession).toMatchObject({
      mode: 'live',
      server: 'http://illustry.local',
      authenticated: false,
      user: null
    });
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
    expect(JSON.stringify(status)).toContain('"mode":"live"');
    expect(output.join('\n')).toContain('[live]');

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
    mockHealthyBackend();
    await expect(runCli(['shell', '--once', '--mode', 'live', '--url', 'http://option.local'], { stdout: (message) => output.push(message) }, { configDir }))
      .resolves.toEqual({ ok: true });
    await expect(runCli(['import', '--json'], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_MISSING_FILE' });
    await expect(runCli(['list', 'widgets', '--json'], { stdout: (message) => output.push(message) }, { configDir }))
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_UNSUPPORTED_RESOURCE' });
    await expect(runCli([
      'export',
      '--json'
    ], {
      stdout: (message) => output.push(message),
      stderr: () => undefined
    }, { configDir }))
      .rejects.toMatchObject({ code: 'commander.unknownCommand' });

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

  it('covers live listing queries, delete routes, and doctor', async () => {
    const configDir = path.join(tempDir, 'live-coverage-config');

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
    await runCli(['delete', 'visualizations', 'Visualization A', '--type', 'bar-chart', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });

    const doctor = await runCli(['doctor', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir, cwd: tempDir });
    expect(JSON.stringify(doctor)).toContain('"reachable":true');

    const browseBodies = calls
      .filter((call) => call.pathname === '/api/projects' || call.pathname === '/api/visualizations')
      .map((call) => String(call.body));
    expect(browseBodies.join('\n')).toContain('"text":"Project"');
    expect(browseBodies.join('\n')).toContain('"sharedScope":"external"');
    expect(calls.some((call) => call.pathname === '/api/project' && call.method === 'DELETE')).toBe(true);
    expect(calls.some((call) => call.pathname === '/api/dashboard' && call.method === 'DELETE')).toBe(true);
    expect(calls.some((call) => call.pathname === '/api/visualization' && call.method === 'DELETE')).toBe(true);
  });

  it('requires a live server for import and delete', async () => {
    const configDir = path.join(tempDir, 'delete-config');
    const source = path.join(tempDir, 'delete.csv');
    await fs.writeFile(source, 'label,value\nA,1\n', 'utf8');

    await expect(runCli([
      'import',
      source,
      '--json'
    ], { stdout: (message) => output.push(message) }, { configDir })).rejects.toMatchObject({
      code: 'ILLUSTRY_CLI_MISSING_SERVER'
    });

    await expect(runCli(['delete', 'visualizations', 'Missing', '--json'], {
      stdout: (message) => output.push(message)
    }, { configDir })).rejects.toMatchObject({ code: 'ILLUSTRY_CLI_MISSING_SERVER' });
  });
});
