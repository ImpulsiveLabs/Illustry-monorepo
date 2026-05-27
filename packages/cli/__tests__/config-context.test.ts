import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { CliConfigStore, createDefaultConfig, defaultWorkspace, normalizeMode, resolveConfigDir } from '../src/config';
import { CliContext } from '../src/context';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-cli-config-'));

describe('@illustry/cli config and context', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('creates defaults, resolves overrides, persists updates, and handles malformed config', async () => {
    expect(defaultWorkspace()).toContain('.illustry');
    expect(createDefaultConfig().profiles.default.workspaceDir).toContain('.illustry');
    expect(resolveConfigDir()).toContain(path.join('.config', 'illustry'));
    expect(defaultWorkspace(tempDir)).toBe(path.join(tempDir, '.illustry'));
    expect(createDefaultConfig(tempDir).profiles.default.mode).toBe('offline');
    expect(resolveConfigDir({ env: { ILLUSTRY_CONFIG_DIR: path.join(tempDir, 'env-config') } as any }))
      .toBe(path.join(tempDir, 'env-config'));
    expect(normalizeMode('local')).toBe('offline');
    expect(normalizeMode('server')).toBe('live');
    expect(() => normalizeMode('moon')).toThrow('Unsupported mode');

    const store = new CliConfigStore({ configDir: path.join(tempDir, 'config'), cwd: tempDir });
    await expect(store.getActiveProfile()).resolves.toMatchObject({ mode: 'offline' });
    await store.setWorkspace('workspace');
    await store.setServer('http://illustry.local');
    await store.saveSession({ cookie: 'sid=1', csrfToken: 'csrf', user: null });
    await expect(store.getActiveProfile()).resolves.toMatchObject({
      mode: 'live',
      workspaceDir: path.join(tempDir, 'workspace'),
      serverUrl: 'http://illustry.local',
      session: { cookie: 'sid=1', csrfToken: 'csrf' }
    });
    await store.clearSession();
    expect((await store.getActiveProfile()).session).toBeUndefined();

    const malformedDir = path.join(tempDir, 'malformed');
    await fs.mkdir(malformedDir, { recursive: true });
    await fs.writeFile(path.join(malformedDir, 'config.json'), '{nope', 'utf8');
    await expect(new CliConfigStore({ configDir: malformedDir }).read())
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_CONFIG_MALFORMED' });

    await fs.writeFile(path.join(malformedDir, 'config.json'), JSON.stringify({ activeProfile: 'missing', profiles: {} }), 'utf8');
    await expect(new CliConfigStore({ configDir: malformedDir }).read())
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_CONFIG_READ_FAILED' });

    await fs.writeFile(path.join(malformedDir, 'config.json'), JSON.stringify({
      activeProfile: 'default',
      profiles: { default: null }
    }), 'utf8');
    await expect(new CliConfigStore({ configDir: malformedDir }).read())
      .rejects.toMatchObject({ code: 'ILLUSTRY_CLI_CONFIG_READ_FAILED' });
  });

  it('builds stores and API clients from profile and flag overrides', async () => {
    const context = new CliContext({
      cwd: tempDir,
      configDir: path.join(tempDir, 'config'),
      flags: {
        workspace: path.join(tempDir, 'workspace'),
        server: 'http://illustry.local',
        cookie: 'sid=1',
        csrf: 'csrf'
      }
    });
    const profile = await context.profile();
    expect(profile.mode).toBe('live');
    expect(profile.serverUrl).toBe('http://illustry.local');
    expect(profile.session?.csrfToken).toBe('csrf');
    expect((await context.store()).rootDir).toBe(path.join(tempDir, 'workspace'));
    expect((await context.client()).baseUrl).toBe('http://illustry.local');

    await context.saveClientSession({
      baseUrl: 'http://illustry.local',
      cookie: 'sid=2',
      csrfToken: 'csrf2',
      user: null
    });
    expect((await context.config.getActiveProfile()).session?.cookie).toBe('sid=2');

    const missing = new CliContext({ configDir: path.join(tempDir, 'missing-server') });
    await expect(missing.client()).rejects.toMatchObject({ code: 'ILLUSTRY_CLI_MISSING_SERVER' });
    await expect(missing.client(false)).resolves.toMatchObject({ baseUrl: 'http://localhost:7001' });

    const defaults = new CliContext();
    expect(defaults.cwd).toBe(process.cwd());
  });
});
