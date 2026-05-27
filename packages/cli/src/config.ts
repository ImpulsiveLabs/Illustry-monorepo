import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { IllustryError } from '@illustry/core';
import type { CliConfig, CliMode, CliProfile, CliRunOptions, CliSession } from './types';

const CONFIG_FILENAME = 'config.json';
const DEFAULT_PROFILE = 'default';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const resolveConfigDir = (options: CliRunOptions = {}) => (
  path.resolve(
    options.configDir
      || options.env?.ILLUSTRY_CONFIG_DIR
      || process.env.ILLUSTRY_CONFIG_DIR
      || path.join(os.homedir(), '.config', 'illustry')
  )
);

const defaultWorkspace = (cwd = process.cwd()) => path.resolve(cwd, '.illustry');

const createDefaultConfig = (cwd = process.cwd()): CliConfig => ({
  activeProfile: DEFAULT_PROFILE,
  profiles: {
    [DEFAULT_PROFILE]: {
      name: DEFAULT_PROFILE,
      mode: 'offline',
      workspaceDir: defaultWorkspace(cwd)
    }
  }
});

const normalizeMode = (value: string): CliMode => {
  if (value === 'offline' || value === 'local') {
    return 'offline';
  }
  if (value === 'live' || value === 'server' || value === 'connected') {
    return 'live';
  }
  throw new IllustryError(`Unsupported mode "${value}". Use offline or live.`, {
    code: 'ILLUSTRY_CLI_INVALID_MODE',
    status: 400
  });
};

class CliConfigStore {
  readonly configDir: string;
  readonly cwd: string;

  constructor(options: CliRunOptions = {}) {
    this.configDir = resolveConfigDir(options);
    this.cwd = path.resolve(options.cwd || process.cwd());
  }

  private get configPath() {
    return path.join(this.configDir, CONFIG_FILENAME);
  }

  async read(): Promise<CliConfig> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!isRecord(parsed) || typeof parsed.activeProfile !== 'string' || !isRecord(parsed.profiles)) {
        throw new Error('Invalid config shape');
      }
      const profile = parsed.profiles[parsed.activeProfile];
      if (!isRecord(profile)) {
        throw new Error('Missing active profile');
      }
      return parsed as CliConfig;
    } catch (error) {
      if (isRecord(error) && error.code === 'ENOENT') {
        return createDefaultConfig(this.cwd);
      }
      if (error instanceof SyntaxError) {
        throw new IllustryError('Illustry CLI config is malformed.', {
          code: 'ILLUSTRY_CLI_CONFIG_MALFORMED',
          status: 400,
          cause: error
        });
      }
      if (error instanceof IllustryError) {
        throw error;
      }
      throw new IllustryError('Unable to read Illustry CLI config.', {
        code: 'ILLUSTRY_CLI_CONFIG_READ_FAILED',
        cause: error
      });
    }
  }

  async write(config: CliConfig) {
    await fs.mkdir(this.configDir, { recursive: true, mode: 0o700 });
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), {
      encoding: 'utf8',
      mode: 0o600
    });
    await fs.chmod(this.configPath, 0o600).catch(() => undefined);
  }

  async getActiveProfile(): Promise<CliProfile> {
    const config = await this.read();
    return config.profiles[config.activeProfile];
  }

  async updateActiveProfile(updater: (profile: CliProfile, config: CliConfig) => CliProfile | Promise<CliProfile>) {
    const config = await this.read();
    const current = config.profiles[config.activeProfile];
    const next = await updater({ ...current }, config);
    config.profiles[next.name] = next;
    config.activeProfile = next.name;
    await this.write(config);
    return next;
  }

  async setMode(mode: CliMode) {
    return this.updateActiveProfile((profile) => ({
      ...profile,
      mode
    }));
  }

  async setServer(serverUrl: string) {
    return this.updateActiveProfile((profile) => ({
      ...profile,
      mode: 'live',
      serverUrl
    }));
  }

  async setWorkspace(workspaceDir: string) {
    return this.updateActiveProfile((profile) => ({
      ...profile,
      workspaceDir: path.resolve(this.cwd, workspaceDir)
    }));
  }

  async saveSession(session: CliSession) {
    return this.updateActiveProfile((profile) => ({
      ...profile,
      session: {
        ...session,
        updatedAt: new Date().toISOString()
      }
    }));
  }

  async clearSession() {
    return this.updateActiveProfile((profile) => {
      const { session: _session, ...rest } = profile;
      return {
        ...rest,
        mode: profile.mode
      };
    });
  }
}

export {
  CliConfigStore,
  DEFAULT_PROFILE,
  createDefaultConfig,
  defaultWorkspace,
  normalizeMode,
  resolveConfigDir
};
