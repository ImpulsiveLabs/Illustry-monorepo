import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import ExcelJS from 'exceljs';
import { parseStringPromise } from 'xml2js';
import { IllustryError } from './errors';
import { assertUploadedFileMetadata, getFileExtension } from './upload-constraints';
import type { IllustryLocalAsset, IllustrySourceFormat } from './types';

type ImportVisualizationInput = {
  filePath: string;
  name?: string;
  type?: string;
  maxRows?: number;
};

const DEFAULT_MAX_ROWS = 5000;

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isRows = (value: unknown): value is unknown[][] => (
  Array.isArray(value) && value.every((item) => Array.isArray(item))
);

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

const rowsToBarOption = (title: string, rows: unknown[][]): JsonRecord => {
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

const extractOption = (data: unknown): JsonRecord | undefined => {
  if (isRecord(data)) {
    if (isRecord(data.option)) {
      return data.option;
    }
    if (isRecord(data.chartOption)) {
      return data.chartOption;
    }
    if (Array.isArray(data.charts)) {
      const [first] = data.charts;
      if (isRecord(first) && isRecord(first.option)) {
        return first.option;
      }
    }
  }
  return undefined;
};

const importVisualizationSource = async ({
  filePath,
  name,
  type,
  maxRows = DEFAULT_MAX_ROWS
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
  importVisualizationSource
};
export type {
  ImportVisualizationInput
};
