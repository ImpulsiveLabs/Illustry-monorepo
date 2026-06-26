#!/usr/bin/env node
import { Command } from 'commander';
import { toIllustryError } from '@illustry/core';
import { CliContext, type CommandFlags } from './context';
import { normalizeMode } from './config';
import { runInteractive } from './interactive';
import {
  forgotPassword,
  login,
  logout,
  resendVerification,
  resetPassword,
  session,
  signup,
  verifyEmail
} from './services/auth';
import {
  deleteResource,
  exportAsset,
  importVisualization,
  listResources
} from './services/resources';
import { getStatus } from './services/status';
import type { CliIo, CliRunOptions, OutputMode } from './types';
import {
  formatError,
  formatInfo,
  formatModeBadge,
  formatSuccess,
  printValue,
  resourceTable,
  write,
  writeError
} from './ui/output';

type ActionContext = {
  io: CliIo;
  runOptions: CliRunOptions;
  flags: CommandFlags;
};

const helpText = `Illustry CLI

Usage:
  illustry                         Open the interactive shell
  illustry status                  Show mode, workspace, server, and session
  illustry mode offline|live       Switch workspace mode
  illustry connect --server URL    Configure live/server mode
  illustry login --email E --password P
  illustry signup --email E --password P --name N
  illustry logout
  illustry session
  illustry import data.csv --name Sales --type bar-chart
  illustry import visualization --file data.csv
  illustry list assets|projects|visualizations|dashboards
  illustry export --asset Sales --format svg,png,excel --out exports
  illustry delete assets Sales

Global:
  --workspace DIR   Override local workspace
  --server URL      Override configured server
  --json            Machine-readable output`;

const collectGlobalFlags = (program: Command): CommandFlags => {
  const opts = program.opts();
  return {
    workspace: opts.workspace,
    server: opts.server,
    token: opts.token,
    cookie: opts.cookie,
    csrf: opts.csrf,
    csrfToken: opts.csrfToken,
    json: opts.json
  };
};

const createContext = (action: ActionContext) => new CliContext({
  ...action.runOptions,
  io: action.io,
  flags: action.flags
});

const outputResult = (result: unknown, mode: OutputMode, io: CliIo, tableOutput = false) => {
  if (mode.json || !tableOutput) {
    printValue(result, mode, io);
    return;
  }
  write(io, resourceTable(result));
};

const asBoolean = (value: unknown) => value === true || value === 'true';

const runAction = async (
  action: ActionContext,
  handler: (context: CliContext) => Promise<unknown>,
  options: OutputMode & { table?: boolean } = {}
) => {
  const context = createContext(action);
  const result = await handler(context);
  if (!(action.flags.json || options.json) && !options.quiet) {
    const profile = await context.profile();
    write(action.io, `${formatModeBadge(profile.mode)} ${profile.mode === 'live' ? profile.serverUrl || 'no server configured' : profile.workspaceDir}`);
  }
  outputResult(result, { json: action.flags.json || options.json, quiet: options.quiet }, action.io, options.table);
  return result;
};

const configureProgram = (
  program: Command,
  action: ActionContext,
  setResult: (value: unknown) => void
) => {
  program
    .name('illustry')
    .description('Terminal frontend for Illustry local and live workflows.')
    .showHelpAfterError()
    .exitOverride()
    .configureOutput({
      writeOut: (message) => {
        if (action.io.stdout) {
          action.io.stdout(message.trimEnd());
        } else {
          process.stdout.write(message);
        }
      },
      writeErr: (message) => {
        if (action.io.stderr) {
          action.io.stderr(message.trimEnd());
        } else {
          process.stderr.write(message);
        }
      }
    })
    .option('--workspace <dir>', 'override local workspace directory')
    .option('--server <url>', 'override or use an Illustry backend URL')
    .option('--token <token>', 'send a bearer token for custom deployments')
    .option('--cookie <cookie>', 'use an explicit cookie header')
    .option('--csrf <token>', 'use an explicit CSRF token')
    .option('--csrf-token <token>', 'use an explicit CSRF token')
    .option('--json', 'print machine-readable JSON')
    .option('-q, --quiet', 'suppress normal command output');

  const wrap = (
    handler: (context: CliContext) => Promise<unknown>,
    options: OutputMode & { table?: boolean } = {}
  ) => async () => {
    action.flags = {
      ...collectGlobalFlags(program),
      json: collectGlobalFlags(program).json
    };
    const result = await runAction(action, handler, {
      ...options,
      quiet: program.opts().quiet
    });
    setResult(result);
  };

  program
    .command('shell')
    .alias('ui')
    .alias('interactive')
    .description('open the interactive terminal frontend')
    .option('--once', 'process one shell command and return')
    .option('--mode <mode>', 'choose startup mode without prompting')
    .option('--server <url>', 'server URL when choosing live mode')
    .option('--url <url>', 'server URL when choosing live mode')
    .action(async (options) => {
      action.flags = {
        ...collectGlobalFlags(program),
        server: options.server || options.url || collectGlobalFlags(program).server,
        startupMode: options.mode ? normalizeMode(options.mode) : undefined
      };
      const result = await runInteractive(createContext(action), { once: asBoolean(options.once) });
      setResult(result);
    });

  program
    .command('status')
    .description('show current mode, workspace, server, and session')
    .action(wrap(getStatus));

  program
    .command('mode <mode>')
    .description('switch between offline and live mode')
    .action(async (mode: string) => {
      action.flags = collectGlobalFlags(program);
      const context = createContext(action);
      const profile = await context.config.setMode(normalizeMode(mode));
      const result = { mode: profile.mode, workspace: profile.workspaceDir, server: profile.serverUrl };
      printValue(result, { json: action.flags.json, quiet: program.opts().quiet }, action.io);
      setResult(result);
    });

  program
    .command('connect')
    .description('configure live/server mode')
    .argument('[server]', 'Illustry backend URL')
    .option('--url <url>', 'Illustry backend URL')
    .action(async (serverArg: string | undefined, options) => {
      const server = serverArg || options.url || collectGlobalFlags(program).server;
      action.flags = { ...collectGlobalFlags(program), server };
      if (!server) {
        throw new Error('Missing server URL. Use `illustry connect --server <url>`.');
      }
      const context = createContext(action);
      const profile = await context.config.setServer(server);
      const result = { mode: profile.mode, server: profile.serverUrl };
      printValue(result, { json: action.flags.json, quiet: program.opts().quiet }, action.io);
      setResult(result);
    });

  program
    .command('disconnect')
    .description('switch back to offline mode without deleting the local workspace')
    .action(async () => {
      action.flags = collectGlobalFlags(program);
      const context = createContext(action);
      const profile = await context.config.setMode('offline');
      const result = { mode: profile.mode, server: profile.serverUrl };
      printValue(result, { json: action.flags.json, quiet: program.opts().quiet }, action.io);
      setResult(result);
    });

  program
    .command('login')
    .description('sign in with backend email/password auth')
    .requiredOption('--email <email>', 'email address')
    .requiredOption('--password <password>', 'password')
    .action(async (options) => {
      await wrap((context) => login(context, options))();
    });

  program
    .command('signup')
    .alias('register')
    .description('create an account using backend auth')
    .requiredOption('--email <email>', 'email address')
    .requiredOption('--password <password>', 'password')
    .requiredOption('--name <name>', 'display name')
    .action(async (options) => {
      await wrap((context) => signup(context, options))();
    });

  program
    .command('logout')
    .description('sign out and clear the persisted session')
    .action(wrap(logout));

  program
    .command('session')
    .description('show the current live session')
    .action(wrap(session));

  program
    .command('verify-email')
    .description('verify email by token or by email/code')
    .option('--token <token>', 'verification token')
    .option('--email <email>', 'email address')
    .option('--code <code>', 'verification code')
    .action(async (options) => {
      const token = options.token || collectGlobalFlags(program).token;
      await wrap((context) => verifyEmail(context, token, options.email, options.code))();
    });

  program
    .command('resend-verification')
    .description('request another verification email')
    .option('--email <email>', 'email address')
    .action(async (options) => {
      await wrap((context) => resendVerification(context, options.email))();
    });

  program
    .command('forgot-password')
    .description('request a password reset email')
    .requiredOption('--email <email>', 'email address')
    .action(async (options) => {
      await wrap((context) => forgotPassword(context, options.email))();
    });

  program
    .command('reset-password')
    .description('reset password with a backend reset token')
    .option('--token <token>', 'reset token')
    .requiredOption('--password <password>', 'new password')
    .action(async (options) => {
      const token = options.token || collectGlobalFlags(program).token;
      await wrap((context) => resetPassword(context, token, options.password))();
    });

  program
    .command('import [file]')
    .description('import or upload a visualization source file')
    .option('--file <file>', 'source file path')
    .option('--file-type <type>', 'source file type: JSON, CSV, EXCEL, or XML')
    .option('--name <name>', 'visualization name')
    .option('--type <type>', 'visualization type')
    .option('--map <mapping>', 'column mapping, for example label=Country,value=Revenue')
    .option('--mapping <mapping>', 'column mapping, for example label=Country,value=Revenue')
    .option('--label-column <column>', 'column/header to use as labels')
    .option('--value-column <column>', 'column/header to use as numeric values')
    .option('--full-details', 'ask backend to read full file details')
    .action(async (file: string | undefined, options) => {
      const resolvedFile = file === 'visualization' ? options.file : file || options.file;
      await wrap((context) => importVisualization(context, {
        file: resolvedFile,
        fileType: options.fileType,
        name: options.name,
        type: options.type,
        mapping: options.map || options.mapping,
        labelColumn: options.labelColumn,
        valueColumn: options.valueColumn,
        fullDetails: options.fullDetails
      }))();
    });

  program
    .command('list [resource]')
    .description('list assets, projects, visualizations, or dashboards')
    .option('--resource <resource>', 'resource name for compatibility with older CLI usage')
    .option('--text <text>', 'server-side text search')
    .option('--page <page>', 'page number')
    .option('--sort <sort>', 'sort expression')
    .option('--shared-scope <scope>', 'server shared scope')
    .action(async (resource: string | undefined, options) => {
      await wrap((context) => listResources(context, {
        resource: resource || options.resource,
        text: options.text,
        page: options.page,
        sort: options.sort,
        sharedScope: options.sharedScope
      }), { table: true })();
    });

  program
    .command('export')
    .description('export a local or live visualization/dashboard')
    .requiredOption('--asset <name>', 'asset/resource name')
    .option('--resource <resource>', 'visualization or dashboard')
    .option('--format <formats>', 'comma-separated formats: json,svg,png,jpg,webp,web-component,excel,pdf,word,ppt')
    .option('--out <dir>', 'output directory')
    .option('--type <type>', 'visualization type in live mode')
    .option('--title <title>', 'export title')
    .option('--chart-file <path>', 'JSON chart payload for live exports')
    .action(async (options) => {
      await wrap((context) => exportAsset(context, {
        asset: options.asset,
        resource: options.resource,
        format: options.format,
        out: options.out,
        type: options.type,
        title: options.title,
        chartFile: options.chartFile
      }))();
    });

  program
    .command('delete <resource> <name>')
    .description('delete a local asset or live resource')
    .option('--type <type>', 'visualization type')
    .action(async (resource: string, name: string, options) => {
      await wrap((context) => deleteResource(context, {
        resource,
        name,
        type: options.type
      }))();
    });

  program
    .command('doctor')
    .description('check local workspace and live server reachability')
    .action(async () => {
      await wrap(async (context) => {
        const status = await getStatus(context);
        if (status.mode === 'live' && status.server) {
          try {
            const client = await context.client(false);
            const health = await client.health();
            write(action.io, formatSuccess('Illustry server is reachable.'));
            return { ...status, reachable: true, health };
          } catch (error) {
            write(action.io, formatInfo('Server is not reachable. Check --server or run `illustry disconnect`.'));
            return { ...status, reachable: false, healthError: error instanceof Error ? error.message : String(error) };
          }
        }
        write(action.io, formatSuccess('Illustry CLI configuration looks usable.'));
        return status;
      })();
    });
};

const runCli = async (argv: string[], io: CliIo = {}, runOptions: CliRunOptions = {}) => {
  let result: unknown;
  const program = new Command();
  const action: ActionContext = {
    io,
    runOptions,
    flags: {}
  };
  configureProgram(program, action, (value) => {
    result = value;
  });

  if (argv.length === 0) {
    const input = io.stdin || process.stdin;
    if ('isTTY' in input && input.isTTY) {
      const context = new CliContext({ ...runOptions, io, flags: collectGlobalFlags(program) });
      result = await runInteractive(context);
      return result;
    }
    printValue(helpText, { json: false }, io);
    return { ok: true, help: true };
  }

  if (argv.includes('--help') || argv.includes('-h')) {
    try {
      await program.parseAsync(argv, { from: 'user' });
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error
        ? Reflect.get(error, 'code')
        : undefined;
      if (code !== 'commander.helpDisplayed') {
        throw error;
      }
    }
    return { ok: true, help: true };
  }

  try {
    await program.parseAsync(argv, { from: 'user' });
    return result;
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error
      ? Reflect.get(error, 'code')
      : undefined;
    if (code === 'commander.helpDisplayed') {
      return { ok: true, help: true };
    }
    throw error;
  }
};

/* istanbul ignore next */
if (require.main === module) {
  runCli(process.argv.slice(2)).catch((error) => {
    const normalized = toIllustryError(error);
    const json = process.argv.includes('--json');
    writeError({}, formatError(normalized, json));
    process.exitCode = normalized.status && normalized.status >= 500 ? 2 : 1;
  });
}

export {
  configureProgram,
  helpText,
  runCli
};
