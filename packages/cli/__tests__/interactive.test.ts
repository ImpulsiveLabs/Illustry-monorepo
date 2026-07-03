import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { PassThrough, Writable } from 'stream';
import { CliContext } from '../src/context';
import {
  buildMenu,
  chooseStartupMode,
  executeMenuAction,
  handleCommand,
  modeAwareResources,
  promptDelete,
  promptImport,
  promptLabel,
  promptList,
  promptLogin,
  promptVisualizationCreateUpdate,
  promptVisualizationDelete,
  promptVisualizationDetails,
  promptVisualizationExport,
  promptVisualizationList,
  renderMenu,
  runInteractive
} from '../src/interactive';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-cli-interactive-'));

const makeRl = (answers: string[]) => ({
  question: jest.fn(async () => answers.shift() || ''),
  close: jest.fn()
}) as any;

describe('@illustry/cli interactive internals', () => {
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
      if (pathname === '/api/auth/me') {
        return new Response(JSON.stringify({
          id: '1',
          email: 'dev@illustry.local',
          name: 'Dev',
          isEmailVerified: true,
          roles: [],
          hasAvatar: false
        }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' }
      });
    };
  };

  beforeEach(async () => {
    tempDir = await makeTempDir();
    originalFetch = global.fetch;
    output.length = 0;
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 25 });
  });

  const context = (extra: Partial<ConstructorParameters<typeof CliContext>[0]> = {}) => new CliContext({
    cwd: tempDir,
    configDir: path.join(tempDir, 'config'),
    io: { stdout: (message) => output.push(message) },
    ...extra
  });

  it('chooses startup modes, renders status/menu, labels prompts, and builds mode-aware menus', async () => {
    mockHealthyBackend();
    const live = context({ configDir: path.join(tempDir, 'live-config'), flags: { startupMode: 'live', server: 'http://illustry.local' } });
    await chooseStartupMode(live, makeRl([]));
    expect((await live.profile()).mode).toBe('live');
    expect(await promptLabel(live)).toContain('live');
    expect(await modeAwareResources(live)).toEqual(['projects', 'visualizations', 'dashboards']);
    expect((await buildMenu(live)).map((item) => item.action)).toContain('login');
    expect((await buildMenu(live)).map((item) => item.action)).not.toContain('import');
    await renderMenu(live, await buildMenu(live), 0);
    expect(output.join('\n')).toContain('Illustry CLI');

    await live.config.saveSession({ cookie: 'sid=1', csrfToken: 'csrf', user: null });
    expect((await buildMenu(live)).map((item) => item.action)).toContain('logout');

    const prompted = context({ configDir: path.join(tempDir, 'prompt-config') });
    await chooseStartupMode(prompted, makeRl(['1', 'http://prompted.local']));
    expect((await prompted.profile()).serverUrl).toBe('http://prompted.local');

    const invalid = context({ configDir: path.join(tempDir, 'invalid-config') });
    await expect(chooseStartupMode(invalid, makeRl(['bad', 'bad', 'bad'])))
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_STARTUP_SELECTION_FAILED' });

    const liveNoServer = context({ configDir: path.join(tempDir, 'live-no-server-config') });
    await expect(chooseStartupMode(liveNoServer, makeRl(['2']))).resolves.toBe(false);
  });

  it('handles shell commands', async () => {
    mockHealthyBackend();
    const ctx = context();

    await expect(handleCommand(ctx, makeRl([]), '')).resolves.toBe(true);
    await expect(handleCommand(ctx, makeRl([]), 'help')).resolves.toBe(true);
    await expect(handleCommand(ctx, makeRl([]), 'status')).resolves.toBe(true);
    await expect(handleCommand(ctx, makeRl([]), `connect http://illustry.local`)).resolves.toBe(true);
    expect((await ctx.profile()).mode).toBe('live');
    await expect(handleCommand(ctx, makeRl(['live', 'http://illustry.local']), 'mode')).resolves.toBe(true);
    await expect(handleCommand(ctx, makeRl(['http://asked.local']), 'connect')).resolves.toBe(true);
    expect(await handleCommand(ctx, makeRl([]), 'exit')).toBe(false);
    expect(await handleCommand(ctx, makeRl([]), 'unknown')).toBe(true);
  });

  it('handles prompt-driven live workflows and menu actions', async () => {
    const ctx = context({ flags: { server: 'http://illustry.local' } });
    await ctx.config.setServer('http://illustry.local');
    global.fetch = async (input, init) => {
      const url = new URL(input.toString());
      if (url.pathname === '/api/auth/login') {
        return new Response(JSON.stringify({
          user: {
            id: '1',
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
        return new Response(JSON.stringify({
          id: '1',
          email: 'dev@illustry.local',
          name: 'Dev',
          isEmailVerified: true,
          roles: [],
          hasAvatar: false
        }), { headers: { 'content-type': 'application/json' } });
      }
      if (url.pathname === '/api/auth/logout') {
        return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
      }
      if (url.pathname === '/api/visualizations') {
        return new Response(JSON.stringify({
          visualizations: [{
            name: 'Live Chart',
            type: 'bar-chart',
            projectName: 'Default',
            data: { headers: ['A'], values: { Value: [1] } }
          }]
        }), { headers: { 'content-type': 'application/json' } });
      }
      if (url.pathname === '/api/visualization/Live%20Chart') {
        return new Response(JSON.stringify({
          name: 'Live Chart',
          type: 'bar-chart',
          projectName: 'Default',
          data: { headers: ['A'], values: { Value: [1] } }
        }), { headers: { 'content-type': 'application/json' } });
      }
      if (url.pathname === '/api/visualization') {
        return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
      }
      if (url.pathname === '/api/visualization/export/bundle') {
        return new Response(Buffer.from('svg'), {
          headers: {
            'content-type': 'image/svg+xml',
            'content-disposition': 'attachment; filename="Live-Chart.svg"'
          }
        });
      }
      return new Response('not found', { status: 404 });
    };

    const source = path.join(tempDir, 'live.csv');
    const chartFile = path.join(tempDir, 'chart.json');
    await fs.writeFile(source, 'label,value\nA,1\n', 'utf8');
    await fs.writeFile(chartFile, JSON.stringify({ option: { series: [] } }), 'utf8');

    await promptLogin(ctx, makeRl(['dev@illustry.local', 'secret']));
    await expect(handleCommand(ctx, makeRl([]), 'session')).resolves.toBe(true);
    await promptImport(ctx, makeRl(['CSV', source, 'bar-chart', 'Live Chart', '', '', ',', 'y', '', '', '', '2', '1']));
    await promptList(ctx, makeRl(['visualizations']));
    await promptVisualizationCreateUpdate(ctx, makeRl(['CSV', source, 'bar-chart', 'Live Chart', '', '', ',', 'y', '', '', '', '2', '1']));
    await promptVisualizationCreateUpdate(ctx, makeRl(['CSV', source, 'bar-chart', 'Live Chart', '', '', ',', 'y', '', '', '', '2', '1']));
    await promptVisualizationList(ctx, makeRl(['']));
    await promptVisualizationDetails(ctx, makeRl(['Live Chart', 'bar-chart']));
    await promptVisualizationExport(ctx, makeRl(['Live Chart', 'bar-chart', path.join(tempDir, 'out')]));
    await promptVisualizationDelete(ctx, makeRl(['Live Chart', 'bar-chart', 'no']));
    await expect(handleCommand(ctx, makeRl([]), 'logout')).resolves.toBe(true);
    await expect(executeMenuAction(ctx, makeRl(['status']), { label: 'Command prompt', action: 'prompt' })).resolves.toBe(true);
    await expect(executeMenuAction(ctx, makeRl([]), { label: 'Exit', action: 'exit' })).resolves.toBe(false);
  });

  it('runs non-tty interactive startup without crashing', async () => {
    mockHealthyBackend();
    const run = runInteractive(context({
      flags: { startupMode: 'live', server: 'http://illustry.local' },
      io: { stdout: (message) => output.push(message) }
    }), { once: true });
    await expect(run).resolves.toEqual({ ok: true });
    expect(output.join('\n')).toContain('Online mode selected');
  });

  it('can select menu items in tty mode with keyboard navigation', async () => {
    mockHealthyBackend();
    const input = new PassThrough() as PassThrough & { isTTY?: boolean; setRawMode?: jest.Mock };
    input.isTTY = true;
    input.setRawMode = jest.fn();
    const writes: string[] = [];
    const outputStream = new Writable({
      write(chunk, _encoding, callback) {
        writes.push(chunk.toString());
        callback();
      }
    });
    const ctx = context({
      flags: { startupMode: 'live', server: 'http://illustry.local' },
      io: {
        stdin: input,
        outputStream,
        stdout: (message) => writes.push(message)
      }
    });

    const run = runInteractive(ctx, {});
    setTimeout(() => {
      input.emit('keypress', '', { name: 'q' });
    }, 50);
    await expect(run).resolves.toEqual({ ok: true });
    expect(input.setRawMode).toHaveBeenCalledWith(true);
    expect(writes.join('\n')).toContain('Use up/down arrows');
  });

  it('handles ctrl-c and escape menu exits in tty mode', async () => {
    mockHealthyBackend();
    for (const key of [{ name: 'c', ctrl: true }, { name: 'escape' }]) {
      const input = new PassThrough() as PassThrough & { isTTY?: boolean; setRawMode?: jest.Mock };
      input.isTTY = true;
      input.setRawMode = jest.fn();
      const outputStream = new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        }
      });
      const ctx = context({
        flags: { startupMode: 'live', server: 'http://illustry.local' },
        io: {
          stdin: input,
          outputStream,
          stdout: jest.fn()
        }
      });
      const run = runInteractive(ctx, {});
      setTimeout(() => {
        input.emit('keypress', '', key);
      }, 50);
      await expect(run).resolves.toEqual({ ok: true });
      expect(input.setRawMode).toHaveBeenCalledWith(false);
    }
  });

});
