import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import ExcelJS from 'exceljs';
import { parseStringPromise } from 'xml2js';
import { IllustryError } from './errors';
import { assertUploadedFileMetadata, getFileExtension } from './upload-constraints';
import type { IllustryChartOption, IllustryLocalAsset, IllustrySourceFormat } from './types';

type ImportVisualizationInput = {
  filePath: string;
  name?: string;
  type?: string;
  maxRows?: number;
  mapping?: ImportColumnMapping;
};

const DEFAULT_MAX_ROWS = 5000;
const DEFAULT_PREVIEW_ROWS = 6;

type JsonRecord = Record<string, unknown>;
type ImportColumnMapping = {
  label?: string;
  value?: string;
};

type ImportSourcePreview = {
  filePath: string;
  filename: string;
  format: IllustrySourceFormat;
  size: number;
  suggestedName: string;
  suggestedType?: string;
  columns: string[];
  sampleRows: unknown[][];
  fullConfigAvailable: boolean;
};

const isRecord = (value: unknown): value is JsonRecord => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isRows = (value: unknown): value is unknown[][] => (
  Array.isArray(value) && value.every((item) => Array.isArray(item))
);

const isChartOption = (value: unknown): value is IllustryChartOption => isRecord(value);

const detectSourceFormat = (filePath: string): IllustrySourceFormat => {
  const extension = getFileExtension(filePath);
  if (extension === '.json') return 'json';
  if (extension === '.xml') return 'xml';
  if (extension === '.csv') return 'csv';
  if (extension === '.xlsx') return 'xlsx';
  throw new IllustryError(`Unsupported visualization source file: ${extension || 'unknown'}.`, {
    code: 'ILLUSTRY_UNSUPPORTED_SOURCE_FORMAT',
    status: 400
  });
};

const basenameWithoutExtension = (filePath: string) => path.basename(filePath).replace(/\.[^.]+$/, '');

const rowsToBarOption = (title: string, rows: unknown[][]): IllustryChartOption => {
  const body = rows.slice(1);
  const labels = body.map((row, index) => String(row[0] ?? `Row ${index + 1}`));
  const values = body.map((row) => {
    const value = Number(row[1] ?? 0);
    return Number.isFinite(value) ? value : 0;
  });
  return {
    title: { text: title, left: 'center' },
    tooltip: {},
    grid: { left: 48, right: 24, top: 72, bottom: 48 },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: values }]
  };
};

const normalizeMappingKey = (key: string) => key.trim().toLowerCase();

const parseImportMapping = (value?: string): ImportColumnMapping => {
  if (!value) {
    return {};
  }
  return value.split(',').reduce<ImportColumnMapping>((mapping, pair) => {
    const separator = pair.indexOf('=');
    if (separator <= 0) {
      throw new IllustryError(`Invalid import mapping "${pair}". Use label=Column,value=Column.`, {
        code: 'ILLUSTRY_IMPORT_MAPPING_INVALID',
        status: 400
      });
    }
    const key = normalizeMappingKey(pair.slice(0, separator));
    const column = pair.slice(separator + 1).trim();
    if (!column) {
      throw new IllustryError(`Missing column name in import mapping "${pair}".`, {
        code: 'ILLUSTRY_IMPORT_MAPPING_INVALID',
        status: 400
      });
    }
    if (key === 'label' || key === 'x' || key === 'category' || key === 'name') {
      return { ...mapping, label: column };
    }
    if (key === 'value' || key === 'y' || key === 'amount') {
      return { ...mapping, value: column };
    }
    throw new IllustryError(`Unsupported import mapping key "${key}". Use label and value.`, {
      code: 'ILLUSTRY_IMPORT_MAPPING_INVALID',
      status: 400
    });
  }, {});
};

const resolveColumnIndex = (headers: unknown[], column: string, fallback: number) => {
  const numeric = Number(column);
  if (Number.isInteger(numeric) && numeric >= 0) {
    return numeric;
  }
  const normalized = normalizeMappingKey(column);
  const index = headers.findIndex((header) => normalizeMappingKey(String(header ?? '')) === normalized);
  if (index >= 0) {
    return index;
  }
  if (!column) {
    return fallback;
  }
  throw new IllustryError(`Import mapping column "${column}" was not found.`, {
    code: 'ILLUSTRY_IMPORT_MAPPING_COLUMN_NOT_FOUND',
    status: 400,
    details: { column, headers }
  });
};

const applyImportMapping = (rows: unknown[][], mapping: ImportColumnMapping = {}) => {
  if (!mapping.label && !mapping.value) {
    return rows;
  }
  const [headers = [], ...body] = rows;
  const labelIndex = mapping.label ? resolveColumnIndex(headers, mapping.label, 0) : 0;
  const valueIndex = mapping.value ? resolveColumnIndex(headers, mapping.value, 1) : 1;
  return [
    ['label', 'value'],
    ...body.map((row) => [row[labelIndex], row[valueIndex]])
  ];
};

const objectToRows = (value: unknown): unknown[][] => {
  if (Array.isArray(value)) {
    if (isRows(value)) {
      return value;
    }
    if (value.every(isRecord)) {
      const records = value;
      const keys = Array.from(new Set(records.flatMap((item) => Object.keys(item))));
      return [keys, ...records.map((item) => keys.map((key) => item[key]))];
    }
    return [['Value'], ...value.map((item) => [item])];
  }
  if (isRecord(value)) {
    return Object.entries(value).map(([key, item]) => [key, item]);
  }
  return [['Value'], [value]];
};

const parseJson = async (filePath: string) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const parseXml = async (filePath: string) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return parseStringPromise(raw, { explicitArray: false, mergeAttrs: true });
};

const parseCsv = async (filePath: string, maxRows: number) => {
  const rows: unknown[][] = [];
  const source = createReadStream(filePath, { encoding: 'utf8' });
  const reader = readline.createInterface({ input: source, crlfDelay: Infinity });
  for await (const line of reader) {
    rows.push(line.split(',').map((cell) => cell.trim()));
    if (rows.length >= maxRows) {
      reader.close();
      break;
    }
  }
  return rows;
};

const parseXlsx = async (filePath: string, maxRows: number) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }
  const rows: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    if (rows.length >= maxRows) return;
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values);
  });
  return rows;
};

const normalizePreviewColumns = (rows: unknown[][]) => {
  const [headers = []] = rows;
  return headers.map((header, index) => {
    const value = String(header ?? '').trim();
    return value || `Column ${index + 1}`;
  });
};

const extractOption = (data: unknown): IllustryChartOption | undefined => {
  if (isRecord(data)) {
    if (isChartOption(data.option)) {
      return data.option;
    }
    if (isChartOption(data.chartOption)) {
      return data.chartOption;
    }
    if (Array.isArray(data.charts)) {
      const [first] = data.charts;
      if (isRecord(first) && isChartOption(first.option)) {
        return first.option;
      }
    }
  }
  return undefined;
};

const extractVisualizationType = (data: unknown): string | undefined => {
  if (!isRecord(data)) return undefined;
  const directType = data.type;
  if (typeof directType === 'string') return directType;
  if (Array.isArray(directType) && typeof directType[0] === 'string') return directType[0];
  if (isRecord(data.visualizationDetails) && typeof data.visualizationDetails.type === 'string') {
    return data.visualizationDetails.type;
  }
  if (Array.isArray(data.charts)) {
    const [first] = data.charts;
    if (isRecord(first) && typeof first.type === 'string') return first.type;
  }
  return undefined;
};

const previewVisualizationImportSource = async (
  filePath: string,
  maxRows = DEFAULT_PREVIEW_ROWS
): Promise<ImportSourcePreview> => {
  const absolutePath = path.resolve(filePath);
  const stat = await fs.stat(absolutePath);
  assertUploadedFileMetadata({
    originalname: path.basename(absolutePath),
    size: stat.size
  }, 'visualization-source');

  const format = detectSourceFormat(absolutePath);
  let data: unknown;
  let rows: unknown[][];

  if (format === 'json') {
    data = await parseJson(absolutePath);
    rows = isRecord(data)
      ? [['Key', 'Value'], ...Object.entries(data)].slice(0, maxRows)
      : objectToRows(data).slice(0, maxRows);
  } else if (format === 'xml') {
    data = await parseXml(absolutePath);
    rows = isRecord(data)
      ? [['Key', 'Value'], ...Object.entries(data)].slice(0, maxRows)
      : objectToRows(data).slice(0, maxRows);
  } else if (format === 'csv') {
    rows = await parseCsv(absolutePath, maxRows);
  } else {
    rows = await parseXlsx(absolutePath, maxRows);
  }

  return {
    filePath: absolutePath,
    filename: path.basename(absolutePath),
    format,
    size: stat.size,
    suggestedName: basenameWithoutExtension(absolutePath),
    suggestedType: extractVisualizationType(data),
    columns: normalizePreviewColumns(rows),
    sampleRows: rows.slice(1, maxRows),
    fullConfigAvailable: format === 'json' && Boolean(extractOption(data))
  };
};

const importVisualizationSource = async ({
  filePath,
  name,
  type,
  maxRows = DEFAULT_MAX_ROWS,
  mapping
}: ImportVisualizationInput): Promise<Omit<IllustryLocalAsset, 'id' | 'createdAt' | 'updatedAt'>> => {
  const absolutePath = path.resolve(filePath);
  const stat = await fs.stat(absolutePath);
  assertUploadedFileMetadata({
    originalname: path.basename(absolutePath),
    size: stat.size
  }, 'visualization-source');

  const format = detectSourceFormat(absolutePath);
  const title = name || basenameWithoutExtension(absolutePath);
  let data: unknown;
  let rows: unknown[][] = [];

  if (format === 'json') {
    data = await parseJson(absolutePath);
    rows = objectToRows(data).slice(0, maxRows);
  } else if (format === 'xml') {
    data = await parseXml(absolutePath);
    rows = objectToRows(data).slice(0, maxRows);
  } else if (format === 'csv') {
    rows = await parseCsv(absolutePath, maxRows);
    data = rows;
  } else {
    rows = await parseXlsx(absolutePath, maxRows);
    data = rows;
  }

  rows = applyImportMapping(rows, mapping);
  const option = extractOption(data) || rowsToBarOption(title, rows);
  return {
    kind: 'visualization',
    name: title,
    type: type || 'bar-chart',
    source: {
      filename: path.basename(absolutePath),
      format,
      size: stat.size,
      rows,
      data
    },
    charts: [{ title, option }]
  };
};

export {
  DEFAULT_MAX_ROWS,
  applyImportMapping,
  detectSourceFormat,
  previewVisualizationImportSource,
  parseImportMapping,
  importVisualizationSource
};
export type {
  ImportSourcePreview,
  ImportColumnMapping,
  ImportVisualizationInput
};
