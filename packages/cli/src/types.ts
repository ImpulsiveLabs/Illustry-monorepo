import type { Readable, Writable } from 'stream';
import type { IllustryAuthUser } from '@illustry/core';

type CliMode = 'live' | 'not-connected';

type CliIo = {
  stdin?: Readable;
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
  outputStream?: Writable;
  errorStream?: Writable;
};

type CliRunOptions = {
  configDir?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

type CliSession = {
  cookie?: string;
  csrfToken?: string;
  user?: IllustryAuthUser | null;
  updatedAt?: string;
};

type CliProfile = {
  name: string;
  mode: CliMode;
  workspaceDir: string;
  serverUrl?: string;
  session?: CliSession;
};

type CliConfig = {
  activeProfile: string;
  profiles: Record<string, CliProfile>;
};

type OutputMode = {
  json?: boolean;
  quiet?: boolean;
};

type ResourceName = 'assets' | 'projects' | 'visualizations' | 'dashboards';

export type {
  CliConfig,
  CliIo,
  CliMode,
  CliProfile,
  CliRunOptions,
  CliSession,
  OutputMode,
  ResourceName
};
