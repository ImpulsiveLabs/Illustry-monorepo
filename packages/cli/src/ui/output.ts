import { toIllustryError } from '@illustry/core';
import type { CliIo, OutputMode } from '../types';

const color = {
  blue: (value: string) => `\u001b[34m${value}\u001b[39m`,
  green: (value: string) => `\u001b[32m${value}\u001b[39m`,
  red: (value: string) => `\u001b[31m${value}\u001b[39m`,
  yellow: (value: string) => `\u001b[33m${value}\u001b[39m`,
  gray: (value: string) => `\u001b[90m${value}\u001b[39m`,
  bold: (value: string) => `\u001b[1m${value}\u001b[22m`
};

const useColor = () => process.env.NO_COLOR !== '1';
const paint = (fn: (value: string) => string, value: string) => (useColor() ? fn(value) : value);

const write = (io: CliIo, message: string) => {
  if (io.stdout) {
    io.stdout(message);
    return;
  }
  if (io.outputStream) {
    io.outputStream.write(`${message}\n`);
    return;
  }
  console.log(message);
};

const writeError = (io: CliIo, message: string) => {
  if (io.stderr) {
    io.stderr(message);
    return;
  }
  if (io.errorStream) {
    io.errorStream.write(`${message}\n`);
    return;
  }
  console.error(message);
};

const printValue = (value: unknown, options: OutputMode, io: CliIo) => {
  if (options.quiet) {
    return;
  }
  if (options.json || typeof value !== 'string') {
    write(io, JSON.stringify(value, null, 2));
    return;
  }
  write(io, value);
};

const formatSuccess = (message: string) => `${paint(color.green, '[ok]')} ${message}`;
const formatInfo = (message: string) => `${paint(color.blue, '>')} ${message}`;
const formatWarning = (message: string) => `${paint(color.yellow, '!')} ${message}`;
const formatModeBadge = (mode: string) => (
  mode === 'live'
    ? paint(color.green, '[live]')
    : paint(color.yellow, '[offline]')
);

const formatError = (error: unknown, json = false) => {
  const normalized = toIllustryError(error);
  if (json) {
    return JSON.stringify({
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        status: normalized.status,
        details: normalized.details
      }
    }, null, 2);
  }
  const code = normalized.code ? ` ${paint(color.gray, `[${normalized.code}]`)}` : '';
  return `${paint(color.red, 'x')} ${normalized.message}${code}`;
};

const flattenItems = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.data)) return record.data;
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items;
    }
  }
  return [];
};

const stringifyCell = (value: unknown) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

const table = (rows: Array<Record<string, unknown>>, columns: string[]) => {
  if (rows.length === 0) {
    return paint(color.gray, 'No rows found.');
  }
  const widths = columns.map((column) => Math.max(
    column.length,
    ...rows.map((row) => stringifyCell(row[column]).length)
  ));
  const renderRow = (values: string[]) => values
    .map((value, index) => value.padEnd(widths[index]))
    .join('  ')
    .trimEnd();
  const header = renderRow(columns.map((column) => paint(color.bold, column)));
  const divider = renderRow(widths.map((width) => '-'.repeat(width)));
  const body = rows.map((row) => renderRow(columns.map((column) => stringifyCell(row[column]))));
  return [header, divider, ...body].join('\n');
};

const resourceTable = (value: unknown) => {
  const rows = flattenItems(value)
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      name: item.name || item.projectName || item.id || item._id,
      type: item.type || item.kind || '',
      project: item.projectName || '',
      updated: item.updatedAt || item.createdAt || '',
      active: item.isActive === undefined ? '' : item.isActive
    }));
  return table(rows, ['name', 'type', 'project', 'updated', 'active']);
};

export {
  color,
  formatError,
  formatInfo,
  formatModeBadge,
  formatSuccess,
  formatWarning,
  paint,
  printValue,
  resourceTable,
  table,
  write,
  writeError
};
