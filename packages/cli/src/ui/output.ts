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
    if (Array.isArray(record.projects)) return record.projects;
    if (Array.isArray(record.dashboards)) return record.dashboards;
    if (Array.isArray(record.visualizations)) return record.visualizations;
    if (Array.isArray(record.data)) return record.data;
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.projects)) return nested.projects;
      if (Array.isArray(nested.dashboards)) return nested.dashboards;
      if (Array.isArray(nested.visualizations)) return nested.visualizations;
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

type TableColumn = {
  key: string;
  label?: string;
  width?: number;
};

const normalizeColumns = (columns: Array<string | TableColumn>): TableColumn[] => columns
  .map((column) => (typeof column === 'string' ? { key: column } : column));

const truncateCell = (value: string, width?: number) => {
  if (!width || value.length <= width) return value;
  if (width <= 3) return '.'.repeat(width);
  return `${value.slice(0, width - 3)}...`;
};

const formatDateCell = (value: unknown) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return stringifyCell(value);
  return date.toISOString().replace('T', ' ').slice(0, 16);
};

const isProjectListPayload = (value: unknown) => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.projects)) return true;
  if (record.data && typeof record.data === 'object') {
    return Array.isArray((record.data as Record<string, unknown>).projects);
  }
  return false;
};

const isDashboardListPayload = (value: unknown) => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.dashboards)) return true;
  if (record.data && typeof record.data === 'object') {
    return Array.isArray((record.data as Record<string, unknown>).dashboards);
  }
  return false;
};

const isVisualizationListPayload = (value: unknown) => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.visualizations)) return true;
  if (record.data && typeof record.data === 'object') {
    return Array.isArray((record.data as Record<string, unknown>).visualizations);
  }
  return false;
};

const table = (rows: Array<Record<string, unknown>>, columns: Array<string | TableColumn>) => {
  if (rows.length === 0) {
    return paint(color.gray, 'No rows found.');
  }
  const normalizedColumns = normalizeColumns(columns);
  const widths = normalizedColumns.map((column) => column.width || Math.max(
    (column.label || column.key).length,
    ...rows.map((row) => stringifyCell(row[column.key]).length)
  ));
  const renderRow = (values: string[]) => values
    .map((value, index) => truncateCell(value, widths[index]).padEnd(widths[index]))
    .join('  ')
    .trimEnd();
  const header = normalizedColumns
    .map((column, index) => paint(color.bold, truncateCell(column.label || column.key, widths[index]).padEnd(widths[index])))
    .join('  ')
    .trimEnd();
  const divider = renderRow(widths.map((width) => '-'.repeat(width)));
  const body = rows.map((row) => renderRow(normalizedColumns.map((column) => stringifyCell(row[column.key]))));
  return [header, divider, ...body].join('\n');
};

const resourceTable = (value: unknown) => {
  if (isProjectListPayload(value)) {
    const projectRows = flattenItems(value)
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        name: item.name,
        description: item.description,
        created: formatDateCell(item.createdAt),
        updated: formatDateCell(item.updatedAt || item.createdAt),
        active: item.isActive === undefined ? '' : item.isActive
      }));
    return table(projectRows, [
      { key: 'name', width: 24 },
      { key: 'description', width: 32 },
      { key: 'created', width: 16 },
      { key: 'updated', width: 16 },
      { key: 'active', width: 6 }
    ]);
  }

  if (isDashboardListPayload(value)) {
    const dashboardRows = flattenItems(value)
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        name: item.name,
        description: item.description,
        created: formatDateCell(item.createdAt),
        updated: formatDateCell(item.updatedAt || item.createdAt)
      }));
    return table(dashboardRows, [
      { key: 'name', width: 24 },
      { key: 'description', width: 32 },
      { key: 'created', width: 16 },
      { key: 'updated', width: 16 }
    ]);
  }

  if (isVisualizationListPayload(value)) {
    const visualizationRows = flattenItems(value)
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        name: item.name,
        type: item.type,
        project: item.projectName,
        created: formatDateCell(item.createdAt),
        updated: formatDateCell(item.updatedAt || item.createdAt)
      }));
    return table(visualizationRows, [
      { key: 'name', width: 24 },
      { key: 'type', width: 18 },
      { key: 'project', width: 24 },
      { key: 'created', width: 16 },
      { key: 'updated', width: 16 }
    ]);
  }

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
