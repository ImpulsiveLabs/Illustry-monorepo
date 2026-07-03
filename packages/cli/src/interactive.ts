import readline from 'readline';
import { createInterface as createPromptInterface, type Interface as PromptInterface } from 'readline/promises';
import { stdin as defaultStdin, stdout as defaultStdout } from 'process';
import {
  IllustryError,
  previewVisualizationImportSource,
  toIllustryError,
  type ImportColumnMapping,
  type ImportSourcePreview
} from '@illustry/core';
import { CliContext } from './context';
import { normalizeMode } from './config';
import { login, logout, resendVerification, session, signup, verifyEmail } from './services/auth';
import {
  createDashboard,
  createProject,
  deleteResource,
  exportDashboard,
  exportVisualization,
  getDashboard,
  getProject,
  getVisualization,
  importVisualization,
  listDashboards,
  listProjects,
  listResources,
  listVisualizations,
  removeDashboard,
  removeProject,
  removeVisualization,
  updateDashboard,
  updateProject
} from './services/resources';
import {
  assertCliVisualizationTypeSupported,
  isCliVisualizationTypeSupported
} from './services/visualization-types';
import { getStatus } from './services/status';
import type { CliIo } from './types';
import {
  color,
  formatError,
  formatInfo,
  formatSuccess,
  formatWarning,
  paint,
  printValue,
  resourceTable,
  write
} from './ui/output';
import { formatStatusHeader, promptModeLabel } from './ui/status-line';

type InteractiveOptions = {
  once?: boolean;
  startupMode?: 'live';
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

const isReadlineClosedError = (error: unknown) => (
  error instanceof Error && error.message.toLowerCase().includes('readline was closed')
);

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const requireEmail = (value: string) => {
  const email = value.trim();
  if (!isValidEmail(email)) {
    throw new IllustryError('Please enter a valid email address.', {
      code: 'ILLUSTRY_CLI_INVALID_EMAIL',
      status: 400
    });
  }
  return email;
};

const passwordValidationMessage = (password: string) => {
  if (password.length < 12) return 'Password must be at least 12 characters long.';
  if (password.length > 128) return 'Password must be 128 characters or fewer.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase character.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase character.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character.';
  return undefined;
};

const askSecret = async (context: CliContext, rl: PromptInterface, question: string) => {
  if (!isInteractiveTty(context)) {
    return ask(rl, question);
  }

  const input = context.io.stdin || defaultStdin;
  const output = (context.io.outputStream || defaultStdout) as NodeJS.WritableStream;
  const restoreKeyboard = takeKeyboardControl(input);
  output.write(question);

  return new Promise<string>((resolve) => {
    let value = '';
    const onKeypress = (chunk: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup('');
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        cleanup(value);
        return;
      }
      if (key.name === 'backspace') {
        value = value.slice(0, -1);
        return;
      }
      if (chunk && chunk.length === 1 && chunk >= ' ') {
        value += chunk;
      }
    };
    const cleanup = (result: string) => {
      input.off('keypress', onKeypress);
      restoreKeyboard();
      output.write('\n');
      resolve(result);
    };
    input.on('keypress', onKeypress);
  });
};

type MenuItem = {
  label: string;
  description?: string;
  action: string;
};

type VerifiedSession = {
  authenticated: true;
  user: NonNullable<Awaited<ReturnType<typeof session>>['user']>;
};

type StartupChoice = 'online' | 'exit';
type BackendFailureAction = 'retry' | 'exit';
type AuthCapability = 'login' | 'register' | 'verifyEmail' | 'resendVerification' | 'restoreSession';
type AuthCapabilityMap = Record<AuthCapability, boolean>;

type DashboardVisualizationOption = {
  key: string;
  name: string;
  type: string;
  label: string;
};

type DashboardExportFormatOption = {
  value: string;
  label: string;
  description: string;
};

const DASHBOARD_VISUALIZATION_LIMIT = 6;
const DASHBOARD_VISUALIZATION_PAGE_SIZE = 100;
const DASHBOARD_VISUALIZATION_VISIBLE_ROWS = 12;
const DASHBOARD_VISUALIZATION_MAX_PAGES = 50;
const DASHBOARD_EXPORT_FORMAT_OPTIONS: DashboardExportFormatOption[] = [
  { value: 'png', label: 'PNG', description: 'image file' },
  { value: 'jpg', label: 'JPG', description: 'image file' },
  { value: 'webp', label: 'WebP', description: 'image file' },
  { value: 'svg', label: 'SVG', description: 'vector image' },
  { value: 'web-component', label: 'Web component', description: 'HTML component' },
  { value: 'excel', label: 'Excel', description: 'workbook' },
  { value: 'pdf', label: 'PDF', description: 'document' },
  { value: 'word', label: 'Word', description: 'document' },
  { value: 'ppt', label: 'PowerPoint', description: 'presentation' }
];
const VISUALIZATION_EXPORT_FORMAT_OPTIONS = DASHBOARD_EXPORT_FORMAT_OPTIONS;

const isInteractiveTty = (context: CliContext) => (
  isTtyInput(context.io.stdin || defaultStdin)
  && Boolean(context.io.outputStream || defaultStdout)
);

const takeKeyboardControl = (input: NodeJS.ReadableStream) => {
  readline.emitKeypressEvents(input);
  const rawInput = input as NodeJS.ReadStream & { isRaw?: boolean; setRawMode?: (mode: boolean) => void };
  const wasRaw = Boolean(rawInput.isRaw);
  const existingKeypressListeners = input.listeners('keypress');
  existingKeypressListeners.forEach((listener) => input.off('keypress', listener as (...args: unknown[]) => void));
  rawInput.setRawMode?.(true);
  input.resume();

  return () => {
    existingKeypressListeners.forEach((listener) => input.on('keypress', listener as (...args: unknown[]) => void));
    rawInput.setRawMode?.(wasRaw);
  };
};

const promptLabel = async (context: CliContext) => {
  const status = await getStatus(context);
  return `illustry:${promptModeLabel(status)}> `;
};

const showStatus = async (context: CliContext) => {
  const status = await getStatus(context);
  write(context.io, formatStatusHeader(status));
};

const isRecordValue = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const getStringValue = (record: Record<string, unknown>, key: string) => (
  typeof record[key] === 'string' ? record[key] as string : undefined
);

const getVisualizationType = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string');
  }
  return undefined;
};

const extractArrayByKey = (value: unknown, key: string): unknown[] => {
  if (Array.isArray(value)) return value;
  if (!isRecordValue(value)) return [];
  if (Array.isArray(value[key])) return value[key] as unknown[];
  if (Array.isArray(value.items)) return value.items;
  const nested = extractArrayByKey(value.data, key);
  if (nested.length) return nested;
  return extractArrayByKey(value.dashboard, key);
};

const extractPageCount = (value: unknown): number | undefined => {
  if (!isRecordValue(value)) return undefined;
  if (isRecordValue(value.pagination)) {
    const pageCount = Number(value.pagination.pageCount);
    if (Number.isFinite(pageCount) && pageCount > 0) {
      return Math.ceil(pageCount);
    }
  }
  return extractPageCount(value.data);
};

const toDashboardVisualizationOption = (value: unknown): DashboardVisualizationOption | undefined => {
  if (!isRecordValue(value)) return undefined;
  const name = getStringValue(value, 'name');
  const type = getVisualizationType(value.type);
  if (!name || !type) return undefined;
  return {
    key: `${name}_${type}`,
    name,
    type,
    label: `${name}(${type})`
  };
};

const extractVisualizationOptions = (value: unknown) => {
  const seen = new Set<string>();
  return extractArrayByKey(value, 'visualizations')
    .map(toDashboardVisualizationOption)
    .filter((option): option is DashboardVisualizationOption => Boolean(option))
    .filter((option) => {
      if (seen.has(option.key)) return false;
      seen.add(option.key);
      return true;
    });
};

const loadDashboardVisualizationOptions = async (context: CliContext) => {
  const client = await context.client();
  const options: DashboardVisualizationOption[] = [];
  let page = 1;
  let pageCount: number;

  do {
    const data = await client.browse({
      resource: 'visualizations',
      query: {
        page,
        per_page: DASHBOARD_VISUALIZATION_PAGE_SIZE
      }
    });
    options.push(...extractVisualizationOptions(data));
    pageCount = extractPageCount(data) || page;
    page += 1;
  } while (page <= pageCount && page <= DASHBOARD_VISUALIZATION_MAX_PAGES);

  await context.saveClientSession(client.getSessionSnapshot());
  const seen = new Set<string>();
  return options
    .filter((option) => {
      if (seen.has(option.key)) return false;
      seen.add(option.key);
      return true;
    })
    .sort((first, second) => first.label.localeCompare(second.label));
};

const extractDashboardVisualizationKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(toDashboardVisualizationOption)
      .filter((option): option is DashboardVisualizationOption => Boolean(option))
      .map((option) => option.key);
  }
  if (!isRecordValue(value)) return [];
  if (isRecordValue(value.visualizations)) {
    return Object.keys(value.visualizations);
  }
  if (Array.isArray(value.visualizations)) {
    return extractDashboardVisualizationKeys(value.visualizations);
  }
  return extractDashboardVisualizationKeys(value.data || value.dashboard);
};

const toDashboardVisualizationMap = (
  options: DashboardVisualizationOption[],
  selectedKeys: Set<string>
) => options.reduce((acc, option) => {
  if (selectedKeys.has(option.key)) {
    acc[option.key] = option.type;
  }
  return acc;
}, {} as Record<string, string>);

const renderDashboardVisualizationPicker = async (
  context: CliContext,
  options: DashboardVisualizationOption[],
  selectedKeys: Set<string>,
  cursor: number,
  message?: string
) => {
  const status = await getStatus(context);
  const visibleRows = Math.min(DASHBOARD_VISUALIZATION_VISIBLE_ROWS, options.length);
  const start = Math.min(
    Math.max(0, cursor - Math.floor(visibleRows / 2)),
    Math.max(0, options.length - visibleRows)
  );
  const visibleOptions = options.slice(start, start + visibleRows);
  const lines = [
    '\x1b[2J\x1b[H',
    formatStatusHeader(status),
    '',
    paint(color.bold, 'Select dashboard visualizations'),
    paint(color.gray, 'Use up/down arrows to move, Space to select, Enter to continue, Esc to cancel.'),
    `Selected: ${selectedKeys.size}/${DASHBOARD_VISUALIZATION_LIMIT}`,
    message ? paint(color.yellow, message) : '',
    ''
  ];

  if (start > 0) {
    lines.push(paint(color.gray, `... ${start} more above`));
  }

  visibleOptions.forEach((option, index) => {
    const actualIndex = start + index;
    const focused = actualIndex === cursor;
    const marker = focused ? paint(color.blue, '>') : ' ';
    const checked = selectedKeys.has(option.key) ? paint(color.green, '[x]') : '[ ]';
    const label = focused ? paint(color.bold, option.label) : option.label;
    lines.push(`${marker} ${checked} ${label}`);
  });

  const remaining = options.length - start - visibleOptions.length;
  if (remaining > 0) {
    lines.push(paint(color.gray, `... ${remaining} more below`));
  }

  write(context.io, lines.filter((line) => line !== '').join('\n'));
};

const selectDashboardVisualizations = async (
  context: CliContext,
  preselectedKeys: string[] = []
): Promise<Record<string, string> | undefined> => {
  const options = await loadDashboardVisualizationOptions(context);
  if (options.length === 0) {
    write(context.io, formatInfo('No visualizations are available in the active project.'));
    return {};
  }

  const availableKeys = new Set(options.map((option) => option.key));
  const selectedKeys = new Set(preselectedKeys.filter((key) => availableKeys.has(key)).slice(0, DASHBOARD_VISUALIZATION_LIMIT));

  if (!isInteractiveTty(context)) {
    write(context.io, formatInfo('Visualization selection needs an interactive terminal. Operation cancelled.'));
    return undefined;
  }

  const input = context.io.stdin || defaultStdin;
  const output = (context.io.outputStream || defaultStdout) as NodeJS.WritableStream;
  const restoreKeyboard = takeKeyboardControl(input);
  let cursor = 0;
  let message: string | undefined;
  await renderDashboardVisualizationPicker(context, options, selectedKeys, cursor);

  return new Promise<Record<string, string> | undefined>((resolve) => {
    const cleanup = (result: Record<string, string> | undefined) => {
      input.off('keypress', onKeypress);
      restoreKeyboard();
      output.write('\n');
      resolve(result);
    };
    const onKeypress = async (_chunk: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup(undefined);
        return;
      }
      if (key.name === 'escape') {
        cleanup(undefined);
        return;
      }
      if (key.name === 'up') {
        cursor = (cursor - 1 + options.length) % options.length;
        message = undefined;
        await renderDashboardVisualizationPicker(context, options, selectedKeys, cursor);
        return;
      }
      if (key.name === 'down') {
        cursor = (cursor + 1) % options.length;
        message = undefined;
        await renderDashboardVisualizationPicker(context, options, selectedKeys, cursor);
        return;
      }
      if (key.name === 'space') {
        const option = options[cursor];
        if (selectedKeys.has(option.key)) {
          selectedKeys.delete(option.key);
          message = undefined;
        } else if (selectedKeys.size >= DASHBOARD_VISUALIZATION_LIMIT) {
          message = `Dashboards support up to ${DASHBOARD_VISUALIZATION_LIMIT} visualizations.`;
        } else {
          selectedKeys.add(option.key);
          message = undefined;
        }
        await renderDashboardVisualizationPicker(context, options, selectedKeys, cursor, message);
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        cleanup(toDashboardVisualizationMap(options, selectedKeys));
      }
    };
    input.on('keypress', onKeypress);
  });
};

const renderDashboardExportFormatPicker = async (
  context: CliContext,
  selectedFormats: Set<string>,
  cursor: number,
  message?: string
) => {
  const status = await getStatus(context);
  const lines = [
    '\x1b[2J\x1b[H',
    formatStatusHeader(status),
    '',
    paint(color.bold, 'Select dashboard export formats'),
    paint(color.gray, 'Use up/down arrows to move, Space to select, A to select all/clear all, Enter to export, Esc to cancel.'),
    `Selected: ${selectedFormats.size}`,
    message ? paint(color.yellow, message) : '',
    ''
  ];

  DASHBOARD_EXPORT_FORMAT_OPTIONS.forEach((option, index) => {
    const focused = index === cursor;
    const marker = focused ? paint(color.blue, '>') : ' ';
    const checked = selectedFormats.has(option.value) ? paint(color.green, '[x]') : '[ ]';
    const label = focused ? paint(color.bold, option.label.padEnd(14)) : option.label.padEnd(14);
    lines.push(`${marker} ${checked} ${label} ${paint(color.gray, option.description)}`);
  });

  write(context.io, lines.filter((line) => line !== '').join('\n'));
};

const selectDashboardExportFormats = async (context: CliContext): Promise<string[] | undefined> => {
  const selectedFormats = new Set<string>(['png']);
  if (!isInteractiveTty(context)) {
    write(context.io, formatInfo('Format selection needs an interactive terminal. Using PNG.'));
    return Array.from(selectedFormats);
  }

  const input = context.io.stdin || defaultStdin;
  const output = (context.io.outputStream || defaultStdout) as NodeJS.WritableStream;
  const restoreKeyboard = takeKeyboardControl(input);
  let cursor = 0;
  let message: string | undefined;
  await renderDashboardExportFormatPicker(context, selectedFormats, cursor);

  return new Promise<string[] | undefined>((resolve) => {
    const cleanup = (result: string[] | undefined) => {
      input.off('keypress', onKeypress);
      restoreKeyboard();
      output.write('\n');
      resolve(result);
    };
    const onKeypress = async (_chunk: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup(undefined);
        return;
      }
      if (key.name === 'escape') {
        cleanup(undefined);
        return;
      }
      if (key.name === 'up') {
        cursor = (cursor - 1 + DASHBOARD_EXPORT_FORMAT_OPTIONS.length) % DASHBOARD_EXPORT_FORMAT_OPTIONS.length;
        message = undefined;
        await renderDashboardExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'down') {
        cursor = (cursor + 1) % DASHBOARD_EXPORT_FORMAT_OPTIONS.length;
        message = undefined;
        await renderDashboardExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'a') {
        if (selectedFormats.size === DASHBOARD_EXPORT_FORMAT_OPTIONS.length) {
          selectedFormats.clear();
        } else {
          DASHBOARD_EXPORT_FORMAT_OPTIONS.forEach((option) => selectedFormats.add(option.value));
        }
        message = undefined;
        await renderDashboardExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'space') {
        const option = DASHBOARD_EXPORT_FORMAT_OPTIONS[cursor];
        if (selectedFormats.has(option.value)) {
          selectedFormats.delete(option.value);
        } else {
          selectedFormats.add(option.value);
        }
        message = undefined;
        await renderDashboardExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        if (selectedFormats.size === 0) {
          message = 'Select at least one export format.';
          await renderDashboardExportFormatPicker(context, selectedFormats, cursor, message);
          return;
        }
        cleanup(DASHBOARD_EXPORT_FORMAT_OPTIONS
          .map((option) => option.value)
          .filter((format) => selectedFormats.has(format)));
      }
    };
    input.on('keypress', onKeypress);
  });
};

const renderVisualizationExportFormatPicker = async (
  context: CliContext,
  selectedFormats: Set<string>,
  cursor: number,
  message?: string
) => {
  const status = await getStatus(context);
  const lines = [
    '\x1b[2J\x1b[H',
    formatStatusHeader(status),
    '',
    paint(color.bold, 'Select visualization export formats'),
    paint(color.gray, 'Use up/down arrows to move, Space to select, A to select all/clear all, Enter to export, Esc to cancel.'),
    `Selected: ${selectedFormats.size}`,
    message ? paint(color.yellow, message) : '',
    ''
  ];

  VISUALIZATION_EXPORT_FORMAT_OPTIONS.forEach((option, index) => {
    const focused = index === cursor;
    const marker = focused ? paint(color.blue, '>') : ' ';
    const checked = selectedFormats.has(option.value) ? paint(color.green, '[x]') : '[ ]';
    const label = focused ? paint(color.bold, option.label.padEnd(14)) : option.label.padEnd(14);
    lines.push(`${marker} ${checked} ${label} ${paint(color.gray, option.description)}`);
  });

  write(context.io, lines.filter((line) => line !== '').join('\n'));
};

const selectVisualizationExportFormats = async (context: CliContext): Promise<string[] | undefined> => {
  const selectedFormats = new Set<string>(['png']);
  if (!isInteractiveTty(context)) {
    write(context.io, formatInfo('Format selection needs an interactive terminal. Using PNG.'));
    return Array.from(selectedFormats);
  }

  const input = context.io.stdin || defaultStdin;
  const output = (context.io.outputStream || defaultStdout) as NodeJS.WritableStream;
  const restoreKeyboard = takeKeyboardControl(input);
  let cursor = 0;
  let message: string | undefined;
  await renderVisualizationExportFormatPicker(context, selectedFormats, cursor);

  return new Promise<string[] | undefined>((resolve) => {
    const cleanup = (result: string[] | undefined) => {
      input.off('keypress', onKeypress);
      restoreKeyboard();
      output.write('\n');
      resolve(result);
    };
    const onKeypress = async (_chunk: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup(undefined);
        return;
      }
      if (key.name === 'escape') {
        cleanup(undefined);
        return;
      }
      if (key.name === 'up') {
        cursor = (cursor - 1 + VISUALIZATION_EXPORT_FORMAT_OPTIONS.length) % VISUALIZATION_EXPORT_FORMAT_OPTIONS.length;
        message = undefined;
        await renderVisualizationExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'down') {
        cursor = (cursor + 1) % VISUALIZATION_EXPORT_FORMAT_OPTIONS.length;
        message = undefined;
        await renderVisualizationExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'a') {
        if (selectedFormats.size === VISUALIZATION_EXPORT_FORMAT_OPTIONS.length) {
          selectedFormats.clear();
        } else {
          VISUALIZATION_EXPORT_FORMAT_OPTIONS.forEach((option) => selectedFormats.add(option.value));
        }
        message = undefined;
        await renderVisualizationExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'space') {
        const option = VISUALIZATION_EXPORT_FORMAT_OPTIONS[cursor];
        if (selectedFormats.has(option.value)) {
          selectedFormats.delete(option.value);
        } else {
          selectedFormats.add(option.value);
        }
        message = undefined;
        await renderVisualizationExportFormatPicker(context, selectedFormats, cursor);
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        if (selectedFormats.size === 0) {
          message = 'Select at least one export format.';
          await renderVisualizationExportFormatPicker(context, selectedFormats, cursor, message);
          return;
        }
        cleanup(VISUALIZATION_EXPORT_FORMAT_OPTIONS
          .map((option) => option.value)
          .filter((format) => selectedFormats.has(format)));
      }
    };
    input.on('keypress', onKeypress);
  });
};

const startupItems: Array<{ choice: StartupChoice; label: string; description: string }> = [
  { choice: 'online', label: 'Online', description: 'Connect to an Illustry backend' },
  { choice: 'exit', label: 'Exit', description: 'Close the CLI without changing mode' }
];

const formatStartupPanel = async (context: CliContext) => {
  const profile = await context.profile();
  const title = paint(color.bold, 'Illustry CLI');
  const rule = paint(color.gray, '='.repeat(58));
  const savedMode = profile.mode === 'live' ? 'Online' : 'Not connected';
  return [
    rule,
    `${title} ${paint(color.gray, 'interactive startup')}`,
    rule,
    `Saved mode: ${savedMode}`,
    `Backend: ${profile.serverUrl || '(none configured)'}`,
    `Workspace: ${profile.workspaceDir}`,
    '',
    paint(color.gray, 'Choose how this session should start:'),
    ...startupItems.map((item, index) => {
      const number = paint(color.blue, String(index + 1));
      const label = paint(color.bold, item.label.padEnd(7));
      return `  ${number}. ${label} ${paint(color.gray, item.description)}`;
    })
  ].join('\n');
};

const renderStartupMenu = async (context: CliContext, selected: number) => {
  const profile = await context.profile();
  const title = paint(color.bold, 'Illustry CLI');
  const rule = paint(color.gray, '='.repeat(58));
  const savedMode = profile.mode === 'live' ? 'Online' : 'Not connected';
  const lines = [
    '\x1b[2J\x1b[H',
    rule,
    `${title} ${paint(color.gray, 'interactive startup')}`,
    rule,
    `Saved mode: ${savedMode}`,
    `Backend: ${profile.serverUrl || '(none configured)'}`,
    `Workspace: ${profile.workspaceDir}`,
    '',
    paint(color.gray, 'Use up/down arrows, Enter to select, q to quit.'),
    ''
  ];
  startupItems.forEach((item, index) => {
    const marker = index === selected ? paint(color.blue, '>') : ' ';
    const label = index === selected ? paint(color.bold, item.label) : item.label;
    const description = paint(color.gray, ` - ${item.description}`);
    lines.push(`${marker} ${label}${description}`);
  });
  write(context.io, lines.join('\n'));
};

const selectStartupChoice = async (context: CliContext): Promise<StartupChoice> => {
  const input = context.io.stdin || defaultStdin;
  const output = (context.io.outputStream || defaultStdout) as NodeJS.WritableStream;
  const restoreKeyboard = takeKeyboardControl(input);
  let selected = 0;
  await renderStartupMenu(context, selected);

  return new Promise<StartupChoice>((resolve) => {
    const cleanup = (choice: StartupChoice) => {
      input.off('keypress', onKeypress);
      restoreKeyboard();
      output.write('\n');
      resolve(choice);
    };
    const onKeypress = async (_chunk: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup('exit');
        return;
      }
      if (key.name === 'q' || key.name === 'escape') {
        cleanup('exit');
        return;
      }
      if (key.name === 'up') {
        selected = (selected - 1 + startupItems.length) % startupItems.length;
        await renderStartupMenu(context, selected);
        return;
      }
      if (key.name === 'down') {
        selected = (selected + 1) % startupItems.length;
        await renderStartupMenu(context, selected);
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        cleanup(startupItems[selected].choice);
      }
    };
    input.on('keypress', onKeypress);
  });
};

const parseStartupChoice = (answer: string): StartupChoice | undefined => {
  const normalized = answer.trim().toLowerCase();
  if (normalized === '1' || normalized === 'online' || normalized === 'live') return 'online';
  if (normalized === '2' || normalized === 'exit' || normalized === 'quit' || normalized === 'q') return 'exit';
  return undefined;
};

const normalizeBackendUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new IllustryError('Backend URL cannot be empty.', {
      code: 'ILLUSTRY_CLI_EMPTY_BACKEND_URL',
      status: 400
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (error) {
    throw new IllustryError('Backend URL must be a valid absolute http or https URL.', {
      code: 'ILLUSTRY_CLI_INVALID_BACKEND_URL',
      status: 400,
      cause: error
    });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new IllustryError('Backend URL must use http or https.', {
      code: 'ILLUSTRY_CLI_INVALID_BACKEND_URL',
      status: 400
    });
  }

  return parsed.href.replace(/\/+$/, '');
};

const backendHealthUrl = (baseUrl: string, route: string) => new URL(route.replace(/^\//, ''), `${baseUrl}/`);
const BACKEND_HEALTH_TIMEOUT_MS = 5000;

const responseLooksHealthy = async (response: Response) => {
  if (!response.ok) {
    return false;
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => undefined);
    if (payload && typeof payload === 'object' && 'ok' in payload) {
      return Boolean((payload as { ok: unknown }).ok);
    }
    return true;
  }
  const text = (await response.text().catch(() => '')).trim().toLowerCase();
  return !text || text === 'ok' || text.includes('healthy');
};

const healthCheckBackend = async (baseUrl: string) => {
  const fetchImpl = typeof fetch === 'undefined' ? undefined : fetch;
  if (!fetchImpl) {
    throw new IllustryError('Fetch is not available in this runtime.', {
      code: 'ILLUSTRY_FETCH_UNAVAILABLE',
      status: 500
    });
  }

  const errors: string[] = [];
  for (const route of ['/api/health', '/health']) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BACKEND_HEALTH_TIMEOUT_MS);
    try {
      const response = await fetchImpl(backendHealthUrl(baseUrl, route), {
        method: 'GET',
        signal: controller.signal
      });
      if (await responseLooksHealthy(response)) {
        return { ok: true, route };
      }
      errors.push(`${route} returned ${response.status}`);
    } catch (error) {
      errors.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new IllustryError(`Backend is not reachable or did not pass health checks. ${errors.join('; ')}`, {
    code: 'ILLUSTRY_CLI_BACKEND_UNAVAILABLE',
    status: 503
  });
};

const AUTH_CAPABILITY_ROUTES: Record<AuthCapability, { route: string; method: string }> = {
  login: { route: '/api/auth/login', method: 'POST' },
  register: { route: '/api/auth/register', method: 'POST' },
  verifyEmail: { route: '/api/auth/verify-email-code', method: 'POST' },
  resendVerification: { route: '/api/auth/resend-verification', method: 'POST' },
  restoreSession: { route: '/api/auth/me', method: 'GET' }
};

const authCapabilityProbeInit = (capability: AuthCapability): RequestInit => {
  if (capability === 'restoreSession') {
    return { method: 'GET' };
  }
  return {
    method: AUTH_CAPABILITY_ROUTES[capability].method,
    headers: { 'content-type': 'application/json' },
    body: '{}'
  };
};

const probeAuthCapability = async (baseUrl: string, capability: AuthCapability) => {
  const fetchImpl = typeof fetch === 'undefined' ? undefined : fetch;
  if (!fetchImpl) {
    return false;
  }
  const { route } = AUTH_CAPABILITY_ROUTES[capability];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_HEALTH_TIMEOUT_MS);
  try {
    const init = authCapabilityProbeInit(capability);
    const response = await fetchImpl(backendHealthUrl(baseUrl, route), {
      ...init,
      signal: controller.signal
    });
    return response.status !== 404 && response.status !== 405 && response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const detectAuthCapabilities = async (context: CliContext): Promise<AuthCapabilityMap> => {
  const profile = await context.profile();
  const baseUrl = profile.serverUrl;
  if (!baseUrl) {
    return {
      login: false,
      register: false,
      verifyEmail: false,
      resendVerification: false,
      restoreSession: false
    };
  }

  const entries = await Promise.all(
    (Object.keys(AUTH_CAPABILITY_ROUTES) as AuthCapability[]).map(async (capability) => [
      capability,
      capability === 'restoreSession' && !profile.session?.cookie
        ? false
        : await probeAuthCapability(baseUrl, capability)
    ] as const)
  );
  return Object.fromEntries(entries) as AuthCapabilityMap;
};

const parseBackendFailureAction = (answer: string): BackendFailureAction | undefined => {
  const normalized = answer.trim().toLowerCase();
  if (normalized === '' || normalized === '1' || normalized === 'retry' || normalized === 'r') return 'retry';
  if (normalized === '2' || normalized === 'exit' || normalized === 'quit' || normalized === 'q') return 'exit';
  return undefined;
};

const askAfterBackendFailure = async (context: CliContext, rl: PromptInterface) => {
  while (true) {
    write(context.io, [
      paint(color.gray, 'Next step:'),
      `  ${paint(color.blue, '1')}. ${paint(color.bold, 'Retry')}   ${paint(color.gray, 'Enter a different backend URL')}`,
      `  ${paint(color.blue, '2')}. ${paint(color.bold, 'Exit')}    ${paint(color.gray, 'Close the CLI')}`
    ].join('\n'));
    const action = parseBackendFailureAction(await ask(rl, 'Choose [retry/exit]: '));
    if (action) {
      return action;
    }
    write(context.io, formatWarning('Choose Retry or Exit.'));
  }
};

const chooseOnlineBackend = async (context: CliContext, rl: PromptInterface) => {
  while (true) {
    try {
      const server = normalizeBackendUrl(await ask(rl, 'Backend URL: '));
      write(context.io, formatInfo(`Checking ${server} ...`));
      const health = await healthCheckBackend(server);
      await context.config.setServer(server);
      write(context.io, formatSuccess(`Connected to ${server} (${health.route}).`));
      write(context.io, formatSuccess('Online mode selected.'));
      return true;
    } catch (error) {
      write(context.io, formatError(toIllustryError(error)));
      const action = await askAfterBackendFailure(context, rl);
      if (action === 'retry') {
        continue;
      }
      write(context.io, formatInfo('Startup cancelled. Goodbye.'));
      return false;
    }
  }
};

const chooseStartupMode = async (context: CliContext, rl: PromptInterface) => {
  const options = context.flags as typeof context.flags & { startupMode?: 'live' };
  if (options.startupMode === 'live') {
    if (!context.flags.server) {
      return chooseOnlineBackend(context, rl);
    }
    const server = normalizeBackendUrl(context.flags.server);
    await healthCheckBackend(server);
    await context.config.setServer(server);
    write(context.io, formatSuccess('Online mode selected.'));
    return true;
  }

  let invalidAttempts = 0;
  while (true) {
    let choice: StartupChoice | undefined;
    try {
      if (isInteractiveTty(context)) {
        choice = await selectStartupChoice(context);
      } else {
        write(context.io, await formatStartupPanel(context));
        choice = parseStartupChoice(await ask(rl, 'Start [online/exit]: '));
      }
    } catch (error) {
      if (isReadlineClosedError(error)) {
        write(context.io, formatInfo('Startup cancelled because input closed.'));
        return false;
      }
      throw error;
    }

    if (choice === 'online') {
      return chooseOnlineBackend(context, rl);
    }
    if (choice === 'exit') {
      write(context.io, formatInfo('Startup cancelled. Goodbye.'));
      return false;
    }

    invalidAttempts += 1;
    write(context.io, formatWarning('Choose Online or Exit. No mode was selected.'));
    if (invalidAttempts >= 3) {
      throw new IllustryError('Startup cancelled after too many invalid selections.', {
        code: 'ILLUSTRY_CLI_STARTUP_SELECTION_FAILED',
        status: 400
      });
    }
  }
};

const formatPreviewRow = (row: unknown[]) => row
  .slice(0, 6)
  .map((cell) => {
    const value = String(cell ?? '');
    return value.length > 18 ? `${value.slice(0, 15)}...` : value;
  })
  .join(' | ');

const showImportPreview = (context: CliContext, preview: ImportSourcePreview) => {
  const lines = [
    formatInfo(`Detected ${preview.format.toUpperCase()} file: ${preview.filename}`),
    `Size: ${preview.size} bytes`,
    preview.suggestedType ? `Type in file: ${preview.suggestedType}` : undefined,
    preview.columns.length > 0
      ? `Columns: ${preview.columns.join(', ')}`
      : 'Columns: none detected',
    preview.sampleRows.length > 0
      ? [
        'Preview:',
        ...preview.sampleRows.slice(0, 5).map((row, index) => `  ${index + 1}. ${formatPreviewRow(row)}`)
      ].join('\n')
      : 'Preview: no data rows detected'
  ];
  write(context.io, lines.filter((line): line is string => Boolean(line)).join('\n'));
};

type FrontendFileType = 'JSON' | 'CSV' | 'EXCEL' | 'XML';

const fileTypeMenuItems: MenuItem[] = [
  { label: 'JSON', action: 'JSON' },
  { label: 'CSV', action: 'CSV' },
  { label: 'EXCEL', action: 'EXCEL' },
  { label: 'XML', action: 'XML' }
];

const visualizationTypeMenuItems: MenuItem[] = [
  { label: 'Word cloud', action: 'word-cloud' },
  { label: 'Force-directed graph', action: 'force-directed-graph' },
  { label: 'Sankey', action: 'sankey' },
  { label: 'Calendar', action: 'calendar' },
  { label: 'Hierarchical edge bundling', action: 'hierarchical-edge-bundling' },
  { label: 'Matrix', action: 'matrix' },
  { label: 'Line chart', action: 'line-chart' },
  { label: 'Bar chart', action: 'bar-chart' },
  { label: 'Pie chart', action: 'pie-chart' },
  { label: 'Scatter', action: 'scatter' },
  { label: 'Treemap', action: 'treemap' },
  { label: 'Sunburst', action: 'sunburst' },
  { label: 'Funnel', action: 'funnel' }
];

const parseFrontendFileType = (answer: string): FrontendFileType => {
  const normalized = answer.trim().toLowerCase();
  if (!normalized || normalized === 'json' || normalized === '1') return 'JSON';
  if (normalized === 'csv' || normalized === '2') return 'CSV';
  if (normalized === 'excel' || normalized === 'xlsx' || normalized === '3') return 'EXCEL';
  if (normalized === 'xml' || normalized === '4') return 'XML';
  throw new IllustryError('Choose file type JSON, CSV, EXCEL, or XML.', {
    code: 'ILLUSTRY_CLI_IMPORT_FILE_TYPE_INVALID',
    status: 400
  });
};

const selectFrontendFileType = async (context: CliContext, rl: PromptInterface): Promise<FrontendFileType> => {
  if (isInteractiveTty(context)) {
    return (await selectMenuItem(context, fileTypeMenuItems)).action as FrontendFileType;
  }
  return parseFrontendFileType(await ask(rl, 'File type [JSON/CSV/EXCEL/XML]: '));
};

const selectVisualizationType = async (
  context: CliContext,
  rl: PromptInterface,
  suggestedType = 'bar-chart'
) => {
  const fallbackType = isCliVisualizationTypeSupported(suggestedType) ? suggestedType : 'bar-chart';
  if (isInteractiveTty(context)) {
    const orderedItems = [
      ...visualizationTypeMenuItems.filter((item) => item.action === fallbackType),
      ...visualizationTypeMenuItems.filter((item) => item.action !== fallbackType)
    ];
    return (await selectMenuItem(context, orderedItems)).action;
  }
  const answer = (await ask(rl, `Visualization type [${fallbackType}]: `)).trim() || fallbackType;
  assertCliVisualizationTypeSupported(answer);
  return answer;
};

const fileTypeSupportsAllDetails = (fileType: FrontendFileType) => fileType === 'JSON';

const frontendFileTypeFromPreview = (preview: ImportSourcePreview): FrontendFileType => {
  if (preview.format === 'json') return 'JSON';
  if (preview.format === 'csv') return 'CSV';
  if (preview.format === 'xlsx') return 'EXCEL';
  return 'XML';
};

const parseYesNo = (answer: string, fallback = false) => {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['y', 'yes', 'true', '1'].includes(normalized)) return true;
  if (['n', 'no', 'false', '0'].includes(normalized)) return false;
  throw new IllustryError('Use yes/no.', {
    code: 'ILLUSTRY_CLI_INVALID_BOOLEAN',
    status: 400
  });
};

const requirePreviewColumn = (preview: ImportSourcePreview, label: string, value: string) => {
  const column = value.trim();
  if (!column) {
    throw new IllustryError(`${label} column is required for guided mapped import.`, {
      code: 'ILLUSTRY_CLI_IMPORT_MAPPING_REQUIRED',
      status: 400
    });
  }
  const numeric = Number(column);
  if (Number.isInteger(numeric) && numeric >= 0) {
    return column;
  }
  const normalized = column.toLowerCase();
  const columnIndex = preview.columns.findIndex((item) => item.toLowerCase() === normalized);
  if (columnIndex === -1) {
    throw new IllustryError(`${label} column "${column}" was not found in the detected columns.`, {
      code: 'ILLUSTRY_CLI_IMPORT_MAPPING_COLUMN_NOT_FOUND',
      status: 400,
      details: { column, columns: preview.columns }
    });
  }
  return String(columnIndex + 1);
};

const requirePreviewColumnValue = (
  preview: ImportSourcePreview,
  label: string,
  value: string,
  multiple?: boolean
) => {
  if (!multiple) return requirePreviewColumn(preview, label, value);
  return value
    .split(',')
    .map((item) => requirePreviewColumn(preview, label, item))
    .join(',');
};

type MappingField = {
  key: string;
  label: string;
  optional?: boolean;
  multiple?: boolean;
};

const mappingField = (key: string, label: string, options: { optional?: boolean; multiple?: boolean } = {}): MappingField => ({
  key,
  label,
  ...options
});

const mappingFieldsForVisualizationType = (type: string): MappingField[] => {
  if (type === 'word-cloud') {
    return [
      mappingField('names', 'Names'),
      mappingField('values', 'Values'),
      mappingField('properties', 'Properties', { optional: true })
    ];
  }
  if (type === 'force-directed-graph' || type === 'hierarchical-edge-bundling' || type === 'sankey') {
    return [
      mappingField('categories', 'Categories', { optional: true }),
      mappingField('nodes', 'Nodes'),
      mappingField('properties', 'Properties', { optional: true }),
      mappingField('sources', 'Sources'),
      mappingField('targets', 'Targets'),
      mappingField('values', 'Values')
    ];
  }
  if (type === 'matrix') {
    return [
      mappingField('sources', 'Sources'),
      mappingField('targets', 'Targets'),
      mappingField('values', 'Values')
    ];
  }
  if (type === 'calendar') {
    return [
      mappingField('dates', 'Dates'),
      mappingField('values', 'Values'),
      mappingField('categories', 'Categories', { optional: true }),
      mappingField('properties', 'Properties', { optional: true })
    ];
  }
  if (type === 'bar-chart' || type === 'line-chart') {
    return [
      mappingField('data', 'Data', { multiple: true }),
      mappingField('headers', 'Headers')
    ];
  }
  if (type === 'pie-chart' || type === 'funnel') {
    return [
      mappingField('names', 'Names', { multiple: true }),
      mappingField('values', 'Values', { multiple: true })
    ];
  }
  if (type === 'scatter') {
    return [
      mappingField('categories', 'Categories', { optional: true }),
      mappingField('values', 'Values', { multiple: true }),
      mappingField('properties', 'Properties', { optional: true })
    ];
  }
  if (type === 'treemap' || type === 'sunburst') {
    return [
      mappingField('names', 'Names'),
      mappingField('values', 'Values'),
      mappingField('categories', 'Categories', { optional: true }),
      mappingField('properties', 'Properties', { optional: true }),
      mappingField('children', 'Children', { optional: true, multiple: true })
    ];
  }
  return [
    mappingField('names', 'Names'),
    mappingField('values', 'Values')
  ];
};

const selectMappingColumnValue = async (
  rl: PromptInterface,
  preview: ImportSourcePreview,
  field: MappingField
) => {
  const suffix = field.multiple ? ' column(s)' : ' column';
  const value = (await ask(rl, `${field.label}${suffix}${field.optional ? ' [optional]' : ''}: `)).trim();
  if (!value && field.optional) return undefined;
  return requirePreviewColumnValue(preview, field.label, value, field.multiple);
};

const promptFrontendMapping = async (
  context: CliContext,
  rl: PromptInterface,
  preview: ImportSourcePreview,
  type: string
): Promise<Record<string, string>> => {
  if (preview.columns.length === 0) {
    throw new IllustryError('No columns were detected. Choose a file with headers/fields before importing.', {
      code: 'ILLUSTRY_CLI_IMPORT_NO_COLUMNS',
      status: 400
    });
  }
  write(context.io, formatInfo(`Mapping fields for ${type}. Enter column numbers as strings, comma-separated when needed.`));
  const mapping: Record<string, string> = {};
  for (const field of [
    mappingField('visualizationName', 'Visualization name', { optional: true }),
    mappingField('visualizationDescription', 'Visualization description', { optional: true }),
    mappingField('visualizationTags', 'Visualization tags', { optional: true })
  ]) {
    const value = await selectMappingColumnValue(rl, preview, field);
    if (value) {
      mapping[field.key] = value;
    }
  }
  const fields = mappingFieldsForVisualizationType(type);
  for (const field of fields) {
    const value = await selectMappingColumnValue(rl, preview, field);
    if (value) {
      mapping[field.key] = value;
    } else if (!field.optional) {
      throw new IllustryError(`${field.label} mapping is required for ${type}.`, {
        code: 'ILLUSTRY_CLI_IMPORT_MAPPING_REQUIRED',
        status: 400
      });
    }
  }
  return mapping;
};

const promptGuidedImport = async (
  context: CliContext,
  rl: PromptInterface,
  defaults: { name?: string; type?: string } = {},
  actionLabel = 'imported'
) => {
  const fileType = await selectFrontendFileType(context, rl);
  const file = (await ask(rl, 'File path: ')).trim();
  const preview = await previewVisualizationImportSource(file);
  const detectedFileType = frontendFileTypeFromPreview(preview);
  if (detectedFileType !== fileType) {
    throw new IllustryError(`Selected file type ${fileType} does not match detected ${detectedFileType}.`, {
      code: 'ILLUSTRY_CLI_IMPORT_FILE_TYPE_MISMATCH',
      status: 400,
      details: { selected: fileType, detected: detectedFileType }
    });
  }
  showImportPreview(context, preview);

  const suggestedType = defaults.type || 'bar-chart';
  const fullDetails = fileTypeSupportsAllDetails(fileType)
    ? parseYesNo(
      await ask(rl, `File has all visualization details? [${preview.fullConfigAvailable ? 'Y/n' : 'y/N'}]: `),
      preview.fullConfigAvailable
    )
    : false;
  const type = fullDetails
    ? preview.suggestedType
    : await selectVisualizationType(context, rl, suggestedType);
  if (fullDetails && !type) {
    throw new IllustryError('The JSON file does not include a visualization type. Disable all-details and select a type manually.', {
      code: 'ILLUSTRY_CLI_IMPORT_JSON_TYPE_MISSING',
      status: 400
    });
  }
  const selectedType = type as string;
  if (fullDetails) {
    write(context.io, formatInfo(`Using visualization type from JSON: ${selectedType}.`));
  }
  let name = defaults.name || preview.suggestedName;
  let description: string | undefined;
  let tags: string[] | undefined;
  if (!fullDetails) {
    name = (await ask(rl, `Visualization name [${name}]: `)).trim() || name;
    description = (await ask(rl, 'Description [optional]: ')).trim() || undefined;
    const tagsInput = (await ask(rl, 'Tags [comma-separated, optional]: ')).trim();
    tags = tagsInput ? tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined;
  }

  let frontendMapping: Record<string, string> | undefined;
  let sheets: string | undefined;
  let separator: string | undefined;
  let includeHeaders: boolean | undefined;
  if (fileType === 'CSV' || fileType === 'EXCEL') {
    if (fileType === 'EXCEL') {
      sheets = (await ask(rl, 'Sheets [1]: ')).trim() || '1';
    } else {
      separator = (await ask(rl, 'Separator [,]: ')).trim() || ',';
    }
    includeHeaders = parseYesNo(await ask(rl, 'Include headers? [y/N]: '), false);
  }
  if (fileType === 'CSV' || fileType === 'EXCEL') {
    frontendMapping = await promptFrontendMapping(context, rl, preview, selectedType);
  }
  const result = await importVisualization(context, {
    file,
    name,
    type: selectedType,
    description,
    tags,
    mapping: frontendMapping,
    fullDetails,
    fileType,
    includeHeaders,
    sheets,
    separator,
    frontendMapping
  });
  printActionResult(context, `Visualization "${name}" ${actionLabel}.`, result);
  return result;
};

const promptImport = async (context: CliContext, rl: PromptInterface) => {
  await promptGuidedImport(context, rl);
};

const promptDelete = async (context: CliContext, rl: PromptInterface) => {
  const resource = (await ask(rl, 'Resource [projects/visualizations/dashboards]: ')).trim();
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

const parseOptionalBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['y', 'yes', 'true', '1', 'active'].includes(normalized)) return true;
  if (['n', 'no', 'false', '0', 'inactive'].includes(normalized)) return false;
  throw new IllustryError('Use yes/no for active status.', {
    code: 'ILLUSTRY_CLI_INVALID_BOOLEAN',
    status: 400
  });
};

const printActionResult = (context: CliContext, message: string, result: unknown) => {
  write(context.io, formatSuccess(message));
  printValue(result, { json: false }, context.io);
};

const promptProjectCreate = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Project name: ')).trim();
  const description = (await ask(rl, 'Description [optional]: ')).trim();
  const active = parseOptionalBoolean(await ask(rl, 'Set active? [y/N]: '));
  const result = await createProject(context, {
    name,
    description: description || undefined,
    active
  });
  printActionResult(context, `Project "${name}" created.`, result);
};

const promptProjectUpdate = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Project name to update: ')).trim();
  await getProject(context, name);
  const description = (await ask(rl, 'New description [leave blank to keep/clear backend default]: ')).trim();
  const active = parseOptionalBoolean(await ask(rl, 'Set active? [leave blank to keep]: '));
  const result = await updateProject(context, {
    name,
    description: description || undefined,
    active
  });
  printActionResult(context, `Project "${name}" updated.`, result);
};

const promptProjectDelete = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Project name to delete: ')).trim();
  await getProject(context, name);
  const confirm = (await ask(rl, `Delete project "${name}" and its dashboards/visualizations? [y/N]: `)).trim().toLowerCase();
  if (confirm !== 'y' && confirm !== 'yes') {
    write(context.io, formatInfo('Delete cancelled.'));
    return;
  }
  const result = await removeProject(context, name);
  printActionResult(context, `Project "${name}" deleted.`, result);
};

const promptProjectList = async (context: CliContext, rl: PromptInterface) => {
  const text = (await ask(rl, 'Search projects [blank lists all]: ')).trim();
  const result = await listProjects(context, {
    text: text || undefined
  });
  write(context.io, resourceTable(result));
};

const promptProjectDetails = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Project name: ')).trim();
  const result = await getProject(context, name);
  printActionResult(context, `Project "${name}" details loaded.`, result);
};

const projectMenuItems: MenuItem[] = [
  { label: 'Create project', action: 'project:create' },
  { label: 'Update project', action: 'project:update' },
  { label: 'Delete project', action: 'project:delete' },
  { label: 'List/query projects', action: 'project:list' },
  { label: 'View project details', action: 'project:details' },
  { label: 'Back', action: 'back' }
];

const runProjectMenu = async (context: CliContext, rl: PromptInterface) => {
  await requireAuthenticatedOnlineSession(context);
  let keepGoing = true;
  while (keepGoing) {
    const item = await selectMenuItem(context, projectMenuItems);
    try {
      if (item.action === 'back' || item.action === 'exit') {
        keepGoing = false;
      } else if (item.action === 'project:create') {
        await promptProjectCreate(context, rl);
      } else if (item.action === 'project:update') {
        await promptProjectUpdate(context, rl);
      } else if (item.action === 'project:delete') {
        await promptProjectDelete(context, rl);
      } else if (item.action === 'project:list') {
        await promptProjectList(context, rl);
      } else if (item.action === 'project:details') {
        await promptProjectDetails(context, rl);
      }
    } catch (error) {
      write(context.io, formatError(toIllustryError(error)));
    }
    if (keepGoing && isInteractiveTty(context)) {
      await ask(rl, paint(color.gray, 'Press Enter to return to Projects...'));
    }
  }
  return true;
};

const promptDashboardCreate = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Dashboard name: ')).trim();
  const description = (await ask(rl, 'Description [optional]: ')).trim();
  const visualizations = await selectDashboardVisualizations(context);
  if (!visualizations) {
    write(context.io, formatInfo('Dashboard creation cancelled.'));
    return;
  }
  const result = await createDashboard(context, {
    name,
    description: description || undefined,
    visualizations
  });
  printActionResult(context, `Dashboard "${name}" created.`, result);
};

const promptDashboardUpdate = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Dashboard name to update: ')).trim();
  const dashboard = await getDashboard(context, name);
  const description = (await ask(rl, 'New description [leave blank to keep/clear backend default]: ')).trim();
  const visualizations = await selectDashboardVisualizations(
    context,
    extractDashboardVisualizationKeys(dashboard)
  );
  if (!visualizations) {
    write(context.io, formatInfo('Dashboard update cancelled.'));
    return;
  }
  const result = await updateDashboard(context, {
    name,
    description: description || undefined,
    visualizations
  });
  printActionResult(context, `Dashboard "${name}" updated.`, result);
};

const promptDashboardDelete = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Dashboard name to delete: ')).trim();
  await getDashboard(context, name);
  const confirm = (await ask(rl, `Delete dashboard "${name}"? [y/N]: `)).trim().toLowerCase();
  if (confirm !== 'y' && confirm !== 'yes') {
    write(context.io, formatInfo('Delete cancelled.'));
    return;
  }
  const result = await removeDashboard(context, name);
  printActionResult(context, `Dashboard "${name}" deleted.`, result);
};

const promptDashboardList = async (context: CliContext, rl: PromptInterface) => {
  const text = (await ask(rl, 'Search dashboards [blank lists all]: ')).trim();
  const result = await listDashboards(context, {
    text: text || undefined
  });
  write(context.io, resourceTable(result));
};

const promptDashboardDetails = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Dashboard name: ')).trim();
  const result = await getDashboard(context, name);
  printActionResult(context, `Dashboard "${name}" details loaded.`, result);
};

const promptDashboardExport = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Dashboard name to export: ')).trim();
  const out = (await ask(rl, 'Output folder/file [blank=current directory]: ')).trim();
  const formats = await selectDashboardExportFormats(context);
  if (!formats) {
    write(context.io, formatInfo('Dashboard export cancelled.'));
    return;
  }
  const result = await exportDashboard(context, {
    name,
    format: formats.join(','),
    out: out || process.cwd()
  });
  printActionResult(context, `Dashboard "${name}" exported ${formats.length > 1 ? 'as a bundle' : 'as a file'}.`, result);
};

const dashboardMenuItems: MenuItem[] = [
  { label: 'Create dashboard', action: 'dashboard:create' },
  { label: 'Update dashboard', action: 'dashboard:update' },
  { label: 'Delete dashboard', action: 'dashboard:delete' },
  { label: 'List/query dashboards', action: 'dashboard:list' },
  { label: 'View dashboard details', action: 'dashboard:details' },
  { label: 'Export dashboard', action: 'dashboard:export' },
  { label: 'Back', action: 'back' }
];

const runDashboardMenu = async (context: CliContext, rl: PromptInterface) => {
  await requireAuthenticatedOnlineSession(context);
  let keepGoing = true;
  while (keepGoing) {
    const item = await selectMenuItem(context, dashboardMenuItems);
    try {
      if (item.action === 'back' || item.action === 'exit') {
        keepGoing = false;
      } else if (item.action === 'dashboard:create') {
        await promptDashboardCreate(context, rl);
      } else if (item.action === 'dashboard:update') {
        await promptDashboardUpdate(context, rl);
      } else if (item.action === 'dashboard:delete') {
        await promptDashboardDelete(context, rl);
      } else if (item.action === 'dashboard:list') {
        await promptDashboardList(context, rl);
      } else if (item.action === 'dashboard:details') {
        await promptDashboardDetails(context, rl);
      } else if (item.action === 'dashboard:export') {
        await promptDashboardExport(context, rl);
      }
    } catch (error) {
      write(context.io, formatError(toIllustryError(error)));
    }
    if (keepGoing && isInteractiveTty(context)) {
      await ask(rl, paint(color.gray, 'Press Enter to return to Dashboards...'));
    }
  }
  return true;
};

const promptVisualizationCreateUpdate = async (context: CliContext, rl: PromptInterface) => {
  await promptGuidedImport(context, rl, {}, 'created/updated');
};

const promptVisualizationDelete = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Visualization name to delete: ')).trim();
  const type = (await ask(rl, 'Visualization type [optional]: ')).trim();
  await getVisualization(context, {
    name,
    type: type || undefined
  });
  const confirm = (await ask(rl, `Delete visualization "${name}"? [y/N]: `)).trim().toLowerCase();
  if (confirm !== 'y' && confirm !== 'yes') {
    write(context.io, formatInfo('Delete cancelled.'));
    return;
  }
  const result = await removeVisualization(context, {
    name,
    type: type || undefined
  });
  printActionResult(context, `Visualization "${name}" deleted.`, result);
};

const promptVisualizationList = async (context: CliContext, rl: PromptInterface) => {
  const text = (await ask(rl, 'Search visualizations [blank lists all]: ')).trim();
  const result = await listVisualizations(context, {
    text: text || undefined
  });
  write(context.io, resourceTable(result));
};

const promptVisualizationDetails = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Visualization name: ')).trim();
  const type = (await ask(rl, 'Visualization type [optional]: ')).trim();
  const result = await getVisualization(context, {
    name,
    type: type || undefined
  });
  printActionResult(context, `Visualization "${name}" details loaded.`, result);
};

const promptVisualizationExport = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Visualization name to export: ')).trim();
  const type = (await ask(rl, 'Visualization type [optional]: ')).trim();
  const out = (await ask(rl, 'Output folder/file [blank=current directory]: ')).trim();
  const formats = await selectVisualizationExportFormats(context);
  if (!formats) {
    write(context.io, formatInfo('Visualization export cancelled.'));
    return;
  }
  const result = await exportVisualization(context, {
    name,
    type: type || undefined,
    format: formats.join(','),
    out: out || process.cwd()
  });
  printActionResult(context, `Visualization "${name}" exported ${formats.length > 1 ? 'as a bundle' : 'as a file'}.`, result);
};

const visualizationMenuItems: MenuItem[] = [
  { label: 'Create/update visualization', action: 'visualization:create-update' },
  { label: 'Delete visualization', action: 'visualization:delete' },
  { label: 'List/query visualizations', action: 'visualization:list' },
  { label: 'View visualization details', action: 'visualization:details' },
  { label: 'Export visualization', action: 'visualization:export' },
  { label: 'Back', action: 'back' }
];

const runVisualizationMenu = async (context: CliContext, rl: PromptInterface) => {
  await requireAuthenticatedOnlineSession(context);
  let keepGoing = true;
  while (keepGoing) {
    const item = await selectMenuItem(context, visualizationMenuItems);
    try {
      if (item.action === 'back' || item.action === 'exit') {
        keepGoing = false;
      } else if (item.action === 'visualization:create-update') {
        await promptVisualizationCreateUpdate(context, rl);
      } else if (item.action === 'visualization:delete') {
        await promptVisualizationDelete(context, rl);
      } else if (item.action === 'visualization:list') {
        await promptVisualizationList(context, rl);
      } else if (item.action === 'visualization:details') {
        await promptVisualizationDetails(context, rl);
      } else if (item.action === 'visualization:export') {
        await promptVisualizationExport(context, rl);
      }
    } catch (error) {
      write(context.io, formatError(toIllustryError(error)));
    }
    if (keepGoing && isInteractiveTty(context)) {
      await ask(rl, paint(color.gray, 'Press Enter to return to Visualizations...'));
    }
  }
  return true;
};

const userLabel = (value: unknown) => {
  if (!value || typeof value !== 'object') return 'the authenticated user';
  const user = value as { email?: unknown; name?: unknown };
  if (typeof user.email === 'string' && user.email) return user.email;
  if (typeof user.name === 'string' && user.name) return user.name;
  return 'the authenticated user';
};

const authUserFromResult = (result: unknown) => {
  if (result && typeof result === 'object' && 'user' in result) {
    return (result as { user?: unknown }).user;
  }
  return result;
};

const isVerifiedAuthUser = (value: unknown) => (
  Boolean(value)
  && typeof value === 'object'
  && (value as { isEmailVerified?: unknown }).isEmailVerified === true
);

const isUnverifiedAuthUser = (value: unknown) => (
  Boolean(value)
  && typeof value === 'object'
  && (value as { isEmailVerified?: unknown }).isEmailVerified === false
);

const authFailureMessage = (action: 'login' | 'register' | 'verify' | 'resend' | 'restore', error: unknown) => {
  const normalized = toIllustryError(error);
  const message = normalized.message.toLowerCase();
  if (action === 'register' && message.includes('unable to register')) {
    return 'An account with this email already exists. Use Login instead, or verify the email if this is your account.';
  }
  if (action === 'register' && message.includes('unable to send verification email')) {
    return 'Registration was not created because the verification email could not be sent. Check the backend email service and try again.';
  }
  if (action === 'register') {
    return `Registration did not complete. If this email already has an account, use Login instead. Otherwise check the name and password rules. Backend message: ${normalized.message}`;
  }
  if (action === 'login' && message.includes('invalid email or password')) {
    return 'Login failed: the email or password was not accepted.';
  }
  if (action === 'verify' && message.includes('verification')) {
    return 'Verification failed: the email/code or token was not accepted.';
  }
  if (normalized.code === 'ILLUSTRY_CLI_INVALID_EMAIL') {
    return normalized.message;
  }
  if (message.includes('invalid request payload')) {
    return 'The backend rejected the request. Check the email, password rules, and verification code format.';
  }
  return normalized.message;
};

const pauseAfterInteractiveAuthResult = async (context: CliContext, rl: PromptInterface) => {
  if (isInteractiveTty(context)) {
    await ask(rl, paint(color.gray, 'Press Enter to continue...'));
  }
};

const reportAuthFailure = (
  context: CliContext,
  action: 'login' | 'register' | 'verify' | 'resend' | 'restore',
  error: unknown
) => {
  const normalized = toIllustryError(error);
  write(context.io, formatError(new IllustryError(authFailureMessage(action, normalized), {
    code: normalized.code,
    status: normalized.status,
    details: normalized.details
  })));
};

const runAuthRequest = async <T>(
  context: CliContext,
  action: 'login' | 'register' | 'verify' | 'resend' | 'restore',
  request: () => Promise<T>,
  success: (result: T) => string
) => {
  try {
    write(context.io, formatInfo('Sending request...'));
    const result = await request();
    write(context.io, formatSuccess(success(result)));
    return result;
  } catch (error) {
    reportAuthFailure(context, action, error);
    return undefined;
  }
};

const promptLogin = async (context: CliContext, rl: PromptInterface) => {
  const email = requireEmail(await ask(rl, 'Email: '));
  const password = (await askSecret(context, rl, 'Password: ')).trim();
  const result = await runAuthRequest(
    context,
    'login',
    () => login(context, { email, password }),
    (result) => `Signed in as ${userLabel(authUserFromResult(result))}.`
  );
  if (isUnverifiedAuthUser(authUserFromResult(result))) {
    await context.config.clearSession();
    write(context.io, formatWarning('Email verification is required before this account can use the online app. No authenticated session was kept.'));
  }
  await pauseAfterInteractiveAuthResult(context, rl);
};

const promptRegister = async (context: CliContext, rl: PromptInterface) => {
  const name = (await ask(rl, 'Name: ')).trim();
  const email = requireEmail(await ask(rl, 'Email: '));
  const password = (await askSecret(context, rl, 'Password: ')).trim();
  const confirmPassword = (await askSecret(context, rl, 'Repeat password: ')).trim();
  const invalidPassword = passwordValidationMessage(password);
  if (invalidPassword) {
    write(context.io, formatError(new IllustryError(`${invalidPassword} Registration was not sent.`, {
      code: 'ILLUSTRY_CLI_INVALID_PASSWORD',
      status: 400
    })));
    await pauseAfterInteractiveAuthResult(context, rl);
    return;
  }
  if (password !== confirmPassword) {
    write(context.io, formatError(new IllustryError('Passwords do not match. Registration was not sent.', {
      code: 'ILLUSTRY_CLI_PASSWORD_MISMATCH',
      status: 400
    })));
    await pauseAfterInteractiveAuthResult(context, rl);
    return;
  }
  const result = await runAuthRequest(
    context,
    'register',
    () => signup(context, { name, email, password }),
    () => `Registration started for ${email}. Email verification is required before the account is created.`
  );
  if (!result) {
    await pauseAfterInteractiveAuthResult(context, rl);
    return;
  }
  await context.config.clearSession();
  write(context.io, formatInfo('Enter the 6-digit verification code from your email. If no email arrived, the backend email service may not be configured or delivery may be delayed.'));
  await promptVerifyEmailCode(context, rl, email);
  write(context.io, formatInfo('After verification, use Login to start an authenticated online session.'));
  await pauseAfterInteractiveAuthResult(context, rl);
};

const promptVerifyEmailCode = async (context: CliContext, rl: PromptInterface, email: string) => {
  const code = (await ask(rl, 'Verification code: ')).trim();
  await runAuthRequest(
    context,
    'verify',
    () => verifyEmail(context, undefined, email, code),
    () => 'Email verified.'
  );
  await context.config.clearSession();
};

const promptVerifyEmail = async (context: CliContext, rl: PromptInterface) => {
  const token = (await ask(rl, 'Verification token [leave blank for email/code]: ')).trim();
  if (token) {
    await runAuthRequest(
      context,
      'verify',
      () => verifyEmail(context, token),
      () => 'Email verified.'
    );
    await context.config.clearSession();
    await pauseAfterInteractiveAuthResult(context, rl);
    return;
  }
  const email = requireEmail(await ask(rl, 'Email: '));
  await promptVerifyEmailCode(context, rl, email);
  await pauseAfterInteractiveAuthResult(context, rl);
};

const promptResendVerification = async (context: CliContext, rl: PromptInterface) => {
  const emailInput = (await ask(rl, 'Email [current session]: ')).trim();
  const email = emailInput ? requireEmail(emailInput) : undefined;
  await runAuthRequest(
    context,
    'resend',
    () => resendVerification(context, email),
    () => 'Verification email requested.'
  );
  await pauseAfterInteractiveAuthResult(context, rl);
};

const restoreSession = async (context: CliContext) => runAuthRequest(
  context,
  'restore',
  () => session(context),
  (result) => result.authenticated
    ? `Session restored for ${userLabel(result.user)}.`
    : 'No authenticated session is available.'
);

const hasActiveOnlineSession = async (context: CliContext) => {
  const profile = await context.profile();
  if (profile.mode !== 'live' || !profile.serverUrl || !profile.session?.cookie) {
    return false;
  }
  try {
    const result = await session(context);
    return result.authenticated === true && isVerifiedAuthUser(result.user);
  } catch {
    await context.config.clearSession();
    return false;
  }
};

const requireAuthenticatedOnlineSession = async (context: CliContext) => {
  const profile = await context.profile();
  if (profile.mode !== 'live') {
    return;
  }
  if (!(await hasActiveOnlineSession(context))) {
    throw new IllustryError('Authentication required. Use the Authentication Menu before accessing online resources.', {
      code: 'ILLUSTRY_CLI_AUTH_REQUIRED',
      status: 401
    });
  }
};

const getVerifiedOnlineSession = async (context: CliContext): Promise<VerifiedSession | null> => {
  const profile = await context.profile();
  if (profile.mode !== 'live' || !profile.serverUrl || !profile.session?.cookie) {
    return null;
  }
  try {
    const result = await session(context);
    if (result.authenticated === true && isVerifiedAuthUser(result.user)) {
      return {
        authenticated: true,
        user: result.user as VerifiedSession['user']
      };
    }
  } catch {
    await context.config.clearSession();
  }
  return null;
};

const requireAuthCapability = async (context: CliContext, capability: AuthCapability) => {
  const profile = await context.profile();
  if (profile.mode !== 'live') {
    return;
  }
  const capabilities = await detectAuthCapabilities(context);
  if (!capabilities[capability]) {
    throw new IllustryError('This backend does not advertise support for that authentication action.', {
      code: 'ILLUSTRY_CLI_AUTH_ACTION_UNSUPPORTED',
      status: 400,
      details: { capability }
    });
  }
};

const modeAwareResources = async (context: CliContext) => {
  const profile = await context.profile();
  if (profile.mode === 'live') {
    return ['projects', 'visualizations', 'dashboards'];
  }
  return ['projects', 'visualizations', 'dashboards'];
};

const promptList = async (context: CliContext, rl: PromptInterface) => {
  const resources = await modeAwareResources(context);
  const answer = (await ask(rl, `Resource [${resources.join('/')}]: `)).trim();
  const resource = answer || resources[0];
  const result = await listResources(context, { resource });
  write(context.io, resourceTable(result));
};

const switchMode = async (context: CliContext, rl: PromptInterface, mode?: string) => {
  const nextMode = normalizeMode(mode || await ask(rl, 'Mode [live]: '));
  if (nextMode === 'live') {
    const profile = await context.profile();
    const server = profile.serverUrl || (await ask(rl, 'Server URL: ')).trim();
    if (server) {
      await context.config.setServer(server);
    } else {
      await context.config.setMode('live');
    }
  }
  write(context.io, formatSuccess(`Mode switched to ${nextMode}.`));
};

const handleCommand = async (context: CliContext, rl: PromptInterface, input: string) => {
  const [command, ...rest] = input.trim().split(/\s+/).filter(Boolean);
  if (!command) return true;
  if (command === 'exit' || command === 'quit') return false;
  if (command === 'help') {
    const profile = await context.profile();
    if (profile.mode === 'live' && !(await hasActiveOnlineSession(context))) {
      write(context.io, [
        'Authentication commands:',
        '  login',
        '  register',
        '  verify-email',
        '  restore-session',
        '  exit'
      ].join('\n'));
      return true;
    }
    if (profile.mode === 'live') {
      write(context.io, [
        'Authenticated online menu:',
        '  projects          Open project workflows',
        '  dashboards        Open dashboard workflows',
        '  visualizations    Open visualization workflows',
        '  session           Show current backend session',
        '  logout            Return to Authentication Menu',
        '  exit'
      ].join('\n'));
      return true;
    }
    write(context.io, [
      'Commands:',
      '  status',
      '  mode live',
      '  connect <server>',
      '  login',
      '  import <file>',
      '  list [assets|projects|visualizations|dashboards]',
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
    await requireAuthCapability(context, 'login');
    if (rest[0] && rest[1]) {
      await runAuthRequest(
        context,
        'login',
        () => login(context, { email: requireEmail(rest[0]), password: rest[1] }),
        (result) => `Signed in as ${userLabel(authUserFromResult(result))}.`
      );
    } else {
      await promptLogin(context, rl);
    }
    return true;
  }
  if (command === 'signup' || command === 'register') {
    await requireAuthCapability(context, 'register');
    if (rest[0] && rest[1] && rest[2]) {
      write(context.io, formatWarning('Interactive registration asks you to repeat the password. Use the Register menu item for safer entry.'));
      await promptRegister(context, rl);
    } else {
      await promptRegister(context, rl);
    }
    return true;
  }
  if (command === 'verify-email') {
    await requireAuthCapability(context, 'verifyEmail');
    if (rest[0]) {
      await runAuthRequest(
        context,
        'verify',
        () => verifyEmail(context, rest[0]),
        () => 'Email verified.'
      );
    } else {
      await promptVerifyEmail(context, rl);
    }
    return true;
  }
  if (command === 'resend-verification') {
    await requireAuthCapability(context, 'resendVerification');
    const email = rest[0] ? requireEmail(rest[0]) : undefined;
    await runAuthRequest(
      context,
      'resend',
      () => resendVerification(context, email),
      () => 'Verification email requested.'
    );
    return true;
  }
  if (command === 'restore-session') {
    await requireAuthCapability(context, 'restoreSession');
    await restoreSession(context);
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
  if (command === 'projects') {
    return runProjectMenu(context, rl);
  }
  if (command === 'dashboards') {
    return runDashboardMenu(context, rl);
  }
  if (command === 'visualizations') {
    return runVisualizationMenu(context, rl);
  }
  if (command === 'import') {
    await requireAuthenticatedOnlineSession(context);
    if (rest[0]) {
      const result = await importVisualization(context, { file: rest[0] });
      printValue(result, { json: false }, context.io);
    } else {
      await promptImport(context, rl);
    }
    return true;
  }
  if (command === 'list') {
    await requireAuthenticatedOnlineSession(context);
    if (rest[0]) {
      const result = await listResources(context, { resource: rest[0] });
      write(context.io, resourceTable(result));
    } else {
      await promptList(context, rl);
    }
    return true;
  }
  if (command === 'delete') {
    await requireAuthenticatedOnlineSession(context);
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

  if (profile.mode === 'live') {
    const verifiedSession = await getVerifiedOnlineSession(context);
    if (!verifiedSession) {
      const capabilities = await detectAuthCapabilities(context);
      const authItems: MenuItem[] = [];
      if (capabilities.login) {
        authItems.push({ label: 'Login', description: 'Sign in with email and password', action: 'login' });
      }
      if (capabilities.register) {
        authItems.push({ label: 'Register', description: 'Create an account on this backend', action: 'register' });
      }
      if (capabilities.verifyEmail) {
        authItems.push({ label: 'Verify email', description: 'Submit a token or email/code pair', action: 'verify-email' });
      }
      if (capabilities.restoreSession) {
        authItems.push({ label: 'Restore session', description: 'Validate the saved backend session', action: 'restore-session' });
      }
      return [
        ...authItems,
        { label: 'Exit', action: 'exit' }
      ];
    }
    return [
      { label: 'Projects', description: 'Create, update, delete, query, and view projects', action: 'projects' },
      { label: 'Dashboards', description: 'Manage dashboards', action: 'dashboards' },
      { label: 'Visualizations', description: 'Manage visualizations', action: 'visualizations' },
      { label: 'Session', description: `Signed in as ${userLabel(verifiedSession.user)}`, action: 'session' },
      { label: 'Logout', description: 'Return to Authentication Menu', action: 'logout' },
      { label: 'Exit', action: 'exit' }
    ];
  }

  return [
    { label: 'Connect to backend', description: 'Use the online application', action: 'mode live' },
    { label: 'Exit', action: 'exit' }
  ];
};

const renderMenu = async (context: CliContext, items: MenuItem[], selected: number) => {
  const status = await getStatus(context);
  const profile = await context.profile();
  const verifiedSession = profile.mode === 'live' ? await getVerifiedOnlineSession(context) : null;
  const menuTitle = profile.mode === 'live'
    ? verifiedSession
      ? 'Online Application Menu'
      : 'Authentication Menu'
    : 'Online Setup';
  const lines = [
    '\x1b[2J\x1b[H',
    formatStatusHeader(status),
    profile.mode === 'live'
      ? `Backend: ${profile.serverUrl || '(none)'}    User: ${verifiedSession ? userLabel(verifiedSession.user) : 'not authenticated'}`
      : `Workspace: ${profile.workspaceDir}`,
    '',
    paint(color.bold, menuTitle),
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

  const restoreKeyboard = takeKeyboardControl(input);
  let selected = 0;
  await renderMenu(context, items, selected);

  return new Promise<MenuItem>((resolve) => {
    let active = true;
    let redrawPromise: Promise<void> | undefined;
    const redraw = () => {
      if (!active) return;
      redrawPromise = renderMenu(context, items, selected).catch(() => undefined);
    };
    const cleanup = (item: MenuItem) => {
      active = false;
      input.off('keypress', onKeypress);
      restoreKeyboard();
      (output as NodeJS.WritableStream).write('\n');
      void redrawPromise;
      resolve(item);
    };
    const onKeypress = async (_chunk: string, key: { name?: string; sequence?: string; ctrl?: boolean }) => {
      if (!active) return;
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
        redraw();
        return;
      }
      if (key.name === 'down') {
        selected = (selected + 1) % items.length;
        redraw();
        return;
      }
      if (key.name === 'return') {
        cleanup(items[selected]);
      }
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
    const shouldContinue = await chooseStartupMode(context, rl);
    if (!shouldContinue) {
      return { ok: true, exited: true };
    }
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
        if (isReadlineClosedError(error)) {
          write(context.io, formatInfo('Input closed. Exiting.'));
          keepGoing = false;
          continue;
        }
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
  promptImport,
  promptLabel,
  promptList,
  promptLogin,
  promptRegister,
  promptResendVerification,
  promptVisualizationCreateUpdate,
  promptVisualizationDelete,
  promptVisualizationDetails,
  promptVisualizationExport,
  promptVisualizationList,
  promptVerifyEmail,
  renderMenu,
  restoreSession,
  runInteractive,
  runVisualizationMenu,
  selectMenuItem
};
