import readline from 'readline';
import { createInterface as createPromptInterface, type Interface as PromptInterface } from 'readline/promises';
import { stdin as defaultStdin, stdout as defaultStdout } from 'process';
import { toIllustryError } from '@illustry/core';
import { CliContext } from './context';
import { normalizeMode } from './config';
import { login, logout, session } from './services/auth';
import { deleteResource, exportAsset, importVisualization, listResources } from './services/resources';
import { getStatus } from './services/status';
import type { CliIo } from './types';
import {
  color,
  formatError,
  formatInfo,
  formatSuccess,
  paint,
  printValue,
  resourceTable,
  write
} from './ui/output';
import { formatStatusHeader, promptModeLabel } from './ui/status-line';

type InteractiveOptions = {
  once?: boolean;
  startupMode?: 'offline' | 'live';
  server?: string;
};

const isTtyInput = (input: NodeJS.ReadableStream) => (
  Boolean((input as NodeJS.ReadableStream & { isTTY?: boolean }).isTTY)
);

const createInterface = (io: CliIo) => createPromptInterface({
  input: io.stdin || defaultStdin,
  output: io.outputStream || defaultStdout,
  terminal: isTtyInput(io.stdin || defaultStdin)
});

const ask = async (rl: PromptInterface, question: string) => rl.question(question);

type MenuItem = {
  label: string;
  description?: string;
  action: string;
};

const isInteractiveTty = (context: CliContext) => (
  isTtyInput(context.io.stdin || defaultStdin)
  && Boolean(context.io.outputStream || defaultStdout)
);

const promptLabel = async (context: CliContext) => {
  const status = await getStatus(context);
  return `illustry:${promptModeLabel(status)}> `;
};

const showStatus = async (context: CliContext) => {
  const status = await getStatus(context);
  write(context.io, formatStatusHeader(status));
};

const chooseStartupMode = async (context: CliContext, rl: PromptInterface) => {
  const profile = await context.profile();
  const options = context.flags as typeof context.flags & { startupMode?: 'offline' | 'live' };
  if (options.startupMode === 'offline') {
    await context.config.setMode('offline');
    write(context.io, formatSuccess('Offline mode selected.'));
    return;
  }
  if (options.startupMode === 'live') {
    if (context.flags.server) {
      await context.config.setServer(context.flags.server);
    } else {
      await context.config.setMode('live');
    }
    write(context.io, formatSuccess('Live mode selected.'));
    return;
  }
  write(context.io, formatInfo(`Current mode: ${profile.mode}. Choose how to start this session:`));
  write(context.io, '1. Keep current mode');
  write(context.io, '2. Offline/local');
  write(context.io, '3. Live/server');
  const answer = (await ask(rl, 'Mode [1]: ')).trim();
  if (answer === '' || answer === '1' || answer.toLowerCase() === 'keep') {
    write(context.io, formatSuccess(`${profile.mode === 'live' ? 'Live' : 'Offline'} mode selected.`));
    return;
  }
  if (answer === '3' || answer.toLowerCase() === 'live') {
    const server = (await ask(rl, 'Server URL: ')).trim();
    if (server) {
      await context.config.setServer(server);
    } else {
      await context.config.setMode('live');
    }
    write(context.io, formatSuccess('Live mode selected.'));
    return;
  }
  await context.config.setMode('offline');
  write(context.io, formatSuccess('Offline mode selected.'));
};

const promptImport = async (context: CliContext, rl: PromptInterface) => {
  const profile = await context.profile();
  const file = (await ask(rl, 'File path: ')).trim();
  const name = (await ask(rl, 'Name [from file]: ')).trim();
  const type = (await ask(rl, 'Visualization type [bar-chart]: ')).trim();
  const labelColumn = (await ask(rl, 'Label column [first column]: ')).trim();
  const valueColumn = (await ask(rl, 'Value column [second column]: ')).trim();
  const project = profile.mode === 'live'
    ? (await ask(rl, 'Project [active project]: ')).trim()
    : undefined;
  const result = await importVisualization(context, {
    file,
    name: name || undefined,
    type: type || undefined,
    project: project || undefined,
    labelColumn: labelColumn || undefined,
    valueColumn: valueColumn || undefined
  });
  printValue(result, { json: false }, context.io);
};

const promptExport = async (context: CliContext, rl: PromptInterface) => {
  const profile = await context.profile();
  const resource = profile.mode === 'live'
    ? (await ask(rl, 'Resource [visualization/dashboard]: ')).trim()
    : undefined;
  const asset = (await ask(rl, 'Asset name: ')).trim();
  const format = (await ask(rl, 'Formats [json]: ')).trim();
  const out = (await ask(rl, 'Output directory [workspace exports]: ')).trim();
  const type = profile.mode === 'live' && (!resource || resource.startsWith('visual'))
    ? (await ask(rl, 'Visualization type [optional]: ')).trim()
    : undefined;
  const result = await exportAsset(context, {
    asset,
    resource: resource || undefined,
    format: format || undefined,
    out: out || undefined,
    type: type || undefined
  });
  printValue(result, { json: false }, context.io);
};

const promptDelete = async (context: CliContext, rl: PromptInterface) => {
  const profile = await context.profile();
  const resource = profile.mode === 'live'
    ? (await ask(rl, 'Resource [projects/visualizations/dashboards]: ')).trim()
    : 'assets';
  const name = (await ask(rl, 'Name: ')).trim();
  const type = resource === 'visualizations'
    ? (await ask(rl, 'Visualization type [optional]: ')).trim()
    : undefined;
  const confirm = (await ask(rl, `Delete ${name}? [y/N]: `)).trim().toLowerCase();
  if (confirm !== 'y' && confirm !== 'yes') {
    write(context.io, formatInfo('Delete cancelled.'));
    return;
  }
  const result = await deleteResource(context, {
    resource,
    name,
    type: type || undefined
  });
  printValue(result, { json: false }, context.io);
};

const promptLogin = async (context: CliContext, rl: PromptInterface) => {
  const email = (await ask(rl, 'Email: ')).trim();
  const password = (await ask(rl, 'Password: ')).trim();
  const result = await login(context, { email, password });
  printValue(result, { json: false }, context.io);
};

const modeAwareResources = async (context: CliContext) => {
  const profile = await context.profile();
  if (profile.mode === 'live') {
    return ['projects', 'visualizations', 'dashboards'];
  }
  return ['assets'];
};

const promptList = async (context: CliContext, rl: PromptInterface) => {
  const resources = await modeAwareResources(context);
  const answer = (await ask(rl, `Resource [${resources.join('/')}]: `)).trim();
  const resource = answer || resources[0];
  const result = await listResources(context, { resource });
  write(context.io, resourceTable(result));
};

const switchMode = async (context: CliContext, rl: PromptInterface, mode?: string) => {
  const nextMode = normalizeMode(mode || await ask(rl, 'Mode [offline/live]: '));
  if (nextMode === 'live') {
    const profile = await context.profile();
    const server = profile.serverUrl || (await ask(rl, 'Server URL: ')).trim();
    if (server) {
      await context.config.setServer(server);
    } else {
      await context.config.setMode('live');
    }
  } else {
    await context.config.setMode('offline');
  }
  write(context.io, formatSuccess(`Mode switched to ${nextMode}.`));
};

const handleCommand = async (context: CliContext, rl: PromptInterface, input: string) => {
  const [command, ...rest] = input.trim().split(/\s+/).filter(Boolean);
  if (!command) return true;
  if (command === 'exit' || command === 'quit') return false;
  if (command === 'help') {
    write(context.io, [
      'Commands:',
      '  status',
      '  mode offline|live',
      '  connect <server>',
      '  login',
      '  import <file>',
      '  list [assets|projects|visualizations|dashboards]',
      '  export <asset> [formats]',
      '  exit'
    ].join('\n'));
    return true;
  }
  if (command === 'status') {
    await showStatus(context);
    return true;
  }
  if (command === 'mode') {
    await switchMode(context, rl, rest[0]);
    return true;
  }
  if (command === 'connect') {
    const server = rest[0] || await ask(rl, 'Server URL: ');
    await context.config.setServer(server.trim());
    write(context.io, formatSuccess(`Connected profile to ${server.trim()}.`));
    return true;
  }
  if (command === 'login') {
    if (rest[0] && rest[1]) {
      const result = await login(context, { email: rest[0], password: rest[1] });
      printValue(result, { json: false }, context.io);
    } else {
      await promptLogin(context, rl);
    }
    return true;
  }
  if (command === 'logout') {
    const result = await logout(context);
    printValue(result, { json: false }, context.io);
    return true;
  }
  if (command === 'session') {
    const result = await session(context);
    printValue(result, { json: false }, context.io);
    return true;
  }
  if (command === 'import') {
    if (rest[0]) {
      const result = await importVisualization(context, { file: rest[0] });
      printValue(result, { json: false }, context.io);
    } else {
      await promptImport(context, rl);
    }
    return true;
  }
  if (command === 'list') {
    if (rest[0]) {
      const result = await listResources(context, { resource: rest[0] });
      write(context.io, resourceTable(result));
    } else {
      await promptList(context, rl);
    }
    return true;
  }
  if (command === 'export') {
    if (rest[0]) {
      const result = await exportAsset(context, { asset: rest[0], format: rest[1] });
      printValue(result, { json: false }, context.io);
    } else {
      await promptExport(context, rl);
    }
    return true;
  }
  if (command === 'delete') {
    if (rest[0] && rest[1]) {
      const result = await deleteResource(context, { resource: rest[0], name: rest[1], type: rest[2] });
      printValue(result, { json: false }, context.io);
    } else {
      await promptDelete(context, rl);
    }
    return true;
  }
  write(context.io, formatInfo(`Unknown shell command "${command}". Type help for options.`));
  return true;
};

const buildMenu = async (context: CliContext): Promise<MenuItem[]> => {
  const profile = await context.profile();
  const common: MenuItem[] = [
    { label: 'Show status', description: 'Mode, workspace, server, session', action: 'status' },
    { label: 'Import visualization', description: profile.mode === 'live' ? 'Upload a local source file' : 'Save a local source file', action: 'import' },
    { label: 'List resources', description: profile.mode === 'live' ? 'Projects, visualizations, dashboards' : 'Local assets', action: 'list' },
    { label: 'Export', description: 'Render/bundle visualization output', action: 'export' }
  ];

  if (profile.mode === 'live') {
    if (!profile.session?.cookie) {
      return [
        { label: 'Show status', description: 'Mode, workspace, server, session', action: 'status' },
        { label: 'Login', description: 'Sign in before using server resources', action: 'login' },
        { label: 'Connect/change server', description: 'Set the Illustry backend URL', action: 'connect' },
        { label: 'Switch to offline', description: 'Use local workspace only', action: 'mode offline' },
        { label: 'Command prompt', description: 'Type an Illustry shell command', action: 'prompt' },
        { label: 'Exit', action: 'exit' }
      ];
    }
    return [
      ...common,
      { label: 'Session', description: 'Check signed-in user', action: 'session' },
      { label: 'Logout', description: 'Clear backend session', action: 'logout' },
      { label: 'Connect/change server', description: 'Set the Illustry backend URL', action: 'connect' },
      { label: 'Switch to offline', description: 'Use local workspace only', action: 'mode offline' },
      { label: 'Delete resource', description: 'Remove a server resource', action: 'delete' },
      { label: 'Command prompt', description: 'Type an Illustry shell command', action: 'prompt' },
      { label: 'Exit', action: 'exit' }
    ];
  }

  return [
    ...common,
    { label: 'Switch to live', description: 'Connect to an Illustry backend', action: 'mode live' },
    { label: 'Delete local asset', description: 'Remove an offline asset', action: 'delete' },
    { label: 'Command prompt', description: 'Type an Illustry shell command', action: 'prompt' },
    { label: 'Exit', action: 'exit' }
  ];
};

const renderMenu = async (context: CliContext, items: MenuItem[], selected: number) => {
  const status = await getStatus(context);
  const lines = [
    '\x1b[2J\x1b[H',
    formatStatusHeader(status),
    '',
    paint(color.gray, 'Use up/down arrows, Enter to select, q to quit.'),
    ''
  ];
  items.forEach((item, index) => {
    const marker = index === selected ? paint(color.blue, '>') : ' ';
    const label = index === selected ? paint(color.bold, item.label) : item.label;
    const description = item.description ? paint(color.gray, ` - ${item.description}`) : '';
    lines.push(`${marker} ${label}${description}`);
  });
  write(context.io, lines.join('\n'));
};

const selectMenuItem = async (context: CliContext, items: MenuItem[]) => {
  const input = context.io.stdin || defaultStdin;
  const output = context.io.outputStream || defaultStdout;
  if (!isInteractiveTty(context)) {
    items.forEach((item, index) => {
      write(context.io, `${index + 1}. ${item.label}${item.description ? ` - ${item.description}` : ''}`);
    });
    const rl = createInterface(context.io);
    try {
      const answer = Number((await ask(rl, 'Select: ')).trim() || '1');
      return items[Math.max(0, Math.min(items.length - 1, answer - 1))];
    } finally {
      rl.close();
    }
  }

  readline.emitKeypressEvents(input);
  const rawInput = input as NodeJS.ReadStream & { setRawMode?: (mode: boolean) => void };
  rawInput.setRawMode?.(true);
  input.resume();
  let selected = 0;
  await renderMenu(context, items, selected);

  return new Promise<MenuItem>((resolve) => {
    const onKeypress = async (_chunk: string, key: { name?: string; sequence?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup(items[items.length - 1]);
        return;
      }
      if (key.name === 'q' || key.name === 'escape') {
        cleanup(items[items.length - 1]);
        return;
      }
      if (key.name === 'up') {
        selected = (selected - 1 + items.length) % items.length;
        await renderMenu(context, items, selected);
        return;
      }
      if (key.name === 'down') {
        selected = (selected + 1) % items.length;
        await renderMenu(context, items, selected);
        return;
      }
      if (key.name === 'return') {
        cleanup(items[selected]);
      }
    };
    const cleanup = (item: MenuItem) => {
      input.off('keypress', onKeypress);
      rawInput.setRawMode?.(false);
      (output as NodeJS.WritableStream).write('\n');
      resolve(item);
    };
    input.on('keypress', onKeypress);
  });
};

const executeMenuAction = async (context: CliContext, rl: PromptInterface, item: MenuItem) => {
  if (item.action === 'exit') return false;
  if (item.action === 'prompt') {
    const answer = await ask(rl, await promptLabel(context));
    return handleCommand(context, rl, answer);
  }
  return handleCommand(context, rl, item.action);
};

const runInteractive = async (context: CliContext, options: InteractiveOptions = {}) => {
  const rl = createInterface(context.io);
  try {
    await chooseStartupMode(context, rl);
    await showStatus(context);
    if (options.once) {
      return { ok: true };
    }
    let keepGoing = true;
    while (keepGoing) {
      try {
        if (isInteractiveTty(context)) {
          const item = await selectMenuItem(context, await buildMenu(context));
          keepGoing = await executeMenuAction(context, rl, item);
        } else {
          const answer = await ask(rl, await promptLabel(context));
          keepGoing = await handleCommand(context, rl, answer);
        }
        if (keepGoing) {
          await showStatus(context);
        }
      } catch (error) {
        write(context.io, formatError(toIllustryError(error)));
      }
    }
    return { ok: true };
  } finally {
    rl.close();
  }
};

export {
  type MenuItem,
  buildMenu,
  chooseStartupMode,
  executeMenuAction,
  handleCommand,
  modeAwareResources,
  promptDelete,
  promptExport,
  promptImport,
  promptLabel,
  promptList,
  promptLogin,
  renderMenu,
  runInteractive
};
