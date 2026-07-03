import path from 'path';
import {
  IllustryApiClient,
  IllustryError,
  LocalIllustryStore,
  type IllustrySessionSnapshot
} from '@illustry/core';
import { CliConfigStore } from './config';
import type { CliIo, CliProfile, CliRunOptions } from './types';

type CommandFlags = {
  workspace?: string;
  server?: string;
  token?: string;
  cookie?: string;
  csrf?: string;
  csrfToken?: string;
  json?: boolean;
  startupMode?: 'live';
};

type CliContextOptions = CliRunOptions & {
  io?: CliIo;
  flags?: CommandFlags;
};

class CliContext {
  readonly config: CliConfigStore;
  readonly cwd: string;
  readonly io: CliIo;
  readonly flags: CommandFlags;

  constructor(options: CliContextOptions = {}) {
    this.cwd = path.resolve(options.cwd || process.cwd());
    this.config = new CliConfigStore(options);
    this.io = options.io || {};
    this.flags = options.flags || {};
  }

  async profile(): Promise<CliProfile> {
    const profile = await this.config.getActiveProfile();
    return {
      ...profile,
      mode: this.flags.server ? 'live' : profile.mode,
      workspaceDir: path.resolve(this.cwd, this.flags.workspace || profile.workspaceDir),
      serverUrl: this.flags.server || profile.serverUrl,
      session: {
        ...profile.session,
        cookie: this.flags.cookie || profile.session?.cookie,
        csrfToken: this.flags.csrf || this.flags.csrfToken || profile.session?.csrfToken
      }
    };
  }

  async store() {
    const profile = await this.profile();
    return new LocalIllustryStore({ rootDir: profile.workspaceDir });
  }

  async client(requireServer = true) {
    const profile = await this.profile();
    const server = profile.serverUrl;
    if (!server && requireServer) {
      throw new IllustryError('No Illustry server is configured. Run `illustry connect --server <url>` first.', {
        code: 'ILLUSTRY_CLI_MISSING_SERVER',
        status: 400
      });
    }
    return new IllustryApiClient({
      baseUrl: server || 'http://localhost:7001',
      token: this.flags.token,
      cookie: profile.session?.cookie,
      csrfToken: profile.session?.csrfToken
    });
  }

  async saveClientSession(snapshot: IllustrySessionSnapshot) {
    await this.config.saveSession({
      cookie: snapshot.cookie,
      csrfToken: snapshot.csrfToken,
      user: snapshot.user
    });
  }
}

export {
  CliContext
};
export type {
  CliContextOptions,
  CommandFlags
};
