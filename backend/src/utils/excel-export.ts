import ExcelJS from 'exceljs';
import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import JSZip from 'jszip';
import { Builder, Parser } from 'xml2js';

type ExcelExportOptions = {
  sheetName?: string;
  cellRange?: string;
  templateWorkbookBase64?: string;
  templateWorkbookBuffer?: Buffer;
  templateWorkbookFilename?: string;
  embeddedCharts?: Array<{
    title?: string;
    type?: string;
    option?: unknown;
  }>;
  previewImage?: {
    buffer: Buffer;
    extension: 'png' | 'jpeg';
  };
};

type WorkbookExport = {
  buffer: Buffer;
  filename: string;
};

type EmbeddedChart = NonNullable<ExcelExportOptions['embeddedCharts']>[number];

const toZipBytes = (buffer: Buffer) => new Uint8Array(buffer);

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DEFAULT_SHEET_NAME = 'Illustry Export';
const DEFAULT_CELL_RANGE = 'B2:K19';
const INVALID_SHEET_CHARS = /[\\/?*[\]:]/g;
const ILLUSTRY_OFFICE_ADDIN_ID = '53f9e4f7-b86d-46c0-99e1-87a3e5d3a0c4';
const WEB_EXTENSION_RELATIONSHIP = 'http://schemas.microsoft.com/office/2011/relationships/webextension';
const WEB_EXTENSION_TASKPANES_RELATIONSHIP = 'http://schemas.microsoft.com/office/2011/relationships/webextensiontaskpanes';

const columnNameToNumber = (columnName: string) => columnName
  .toUpperCase()
  .split('')
  .reduce((total, char) => (total * 26) + char.charCodeAt(0) - 64, 0);

const normalizeSheetName = (value: unknown) => {
  const normalized = typeof value === 'string'
    ? value.trim().replace(INVALID_SHEET_CHARS, ' ')
    : '';
  return (normalized || DEFAULT_SHEET_NAME).slice(0, 31);
};

const sanitizeFilename = (value: string) => value
  .trim()
  .replace(/[/\\?%*:|"<>]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  || 'illustry-excel-export';

const normalizeCellAddress = (value: string) => {
  const match = value.trim().toUpperCase().match(/^([A-Z]{1,3})([1-9]\d*)$/);
  const columnName = match?.[1];
  const rowValue = match?.[2];
  if (!columnName || !rowValue) {
    throw new Error('Use a valid Excel cell address, for example H3.');
  }

  const column = columnNameToNumber(columnName);
  const row = Number(rowValue);
  if (column < 1 || column > 16384 || row < 1 || row > 1048576) {
    throw new Error('The selected Excel cell range is outside worksheet limits.');
  }

  return {
    address: `${columnName}${row}`,
    column,
    row
  };
};

const normalizeCellRange = (value: unknown) => {
  const rawRange = typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_CELL_RANGE;
  const [rawStart, rawEnd] = rawRange.split(':');
  if (!rawStart || !rawEnd) {
    throw new Error('Use a valid Excel range, for example H3:Z10.');
  }

  const start = normalizeCellAddress(rawStart);
  const end = normalizeCellAddress(rawEnd);
  const topLeft = {
    column: Math.min(start.column, end.column),
    row: Math.min(start.row, end.row)
  };
  const bottomRight = {
    column: Math.max(start.column, end.column),
    row: Math.max(start.row, end.row)
  };

  if (bottomRight.column - topLeft.column < 1 || bottomRight.row - topLeft.row < 1) {
    throw new Error('Use a larger Excel range so the visualization has room to render.');
  }

  return `${getColumnName(topLeft.column)}${topLeft.row}:${getColumnName(bottomRight.column)}${bottomRight.row}`;
};

const getCellRangeBounds = (cellRange: string) => {
  const [rawStart, rawEnd] = cellRange.split(':');
  const start = normalizeCellAddress(rawStart);
  const end = normalizeCellAddress(rawEnd);
  return {
    start: {
      column: Math.min(start.column, end.column),
      row: Math.min(start.row, end.row)
    },
    end: {
      column: Math.max(start.column, end.column),
      row: Math.max(start.row, end.row)
    }
  };
};

const preparePreviewWorksheet = (
  worksheet: ExcelJS.Worksheet,
  cellRange: string,
  templateWorkbook: boolean
) => {
  const bounds = getCellRangeBounds(cellRange);

  for (let column = bounds.start.column; column <= bounds.end.column; column += 1) {
    const excelColumn = worksheet.getColumn(column);
    excelColumn.width = Math.max(Number(excelColumn.width) || 0, 14);
  }

  for (let row = bounds.start.row; row <= bounds.end.row; row += 1) {
    const excelRow = worksheet.getRow(row);
    excelRow.height = Math.max(Number(excelRow.height) || 0, 24);
    for (let column = bounds.start.column; column <= bounds.end.column; column += 1) {
      const cell = excelRow.getCell(column);
      if (!templateWorkbook && cell.value === null) {
        cell.value = '';
      }
    }
  }

  return bounds;
};

const getPreviewImageSize = (bounds: ReturnType<typeof getCellRangeBounds>) => {
  const columns = bounds.end.column - bounds.start.column + 1;
  const rows = bounds.end.row - bounds.start.row + 1;
  return {
    width: Math.max(320, columns * 96),
    height: Math.max(240, rows * 28)
  };
};

const chartOptionRecord = (chart: EmbeddedChart) => (
  chart?.option && typeof chart.option === 'object' && !Array.isArray(chart.option)
    ? chart.option as Record<string, unknown>
    : {}
);

const asRecordArray = (value: unknown) => (
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const presentString = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const numberValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const valuesAsSeriesData = (value: unknown) => (
  Array.isArray(value)
    ? value.map((item) => numberValue(item))
    : [numberValue(value)]
);

const labelFromRecord = (record: Record<string, unknown>, index: number) => {
  const labelKeys = ['name', 'label', 'category', 'date', 'source', 'title', 'key'];
  return labelKeys
    .map((key) => presentString(record[key]))
    .find(Boolean)
    || `Item ${index + 1}`;
};

const valueFromRecord = (record: Record<string, unknown>) => {
  const valueKeys = ['value', 'count', 'amount', 'total', 'revenue', 'score', 'y'];
  const namedValue = valueKeys
    .map((key) => record[key])
    .find((item) => Number.isFinite(Number(String(item ?? '').replace(/,/g, '').trim())));
  if (namedValue !== undefined) return numberValue(namedValue, 1);
  const firstNumericValue = Object.values(record)
    .find((item) => Number.isFinite(Number(String(item ?? '').replace(/,/g, '').trim())));
  return numberValue(firstNumericValue, 1);
};

const pairsFromArray = (items: unknown[]) => items.map((item, index) => {
  if (isRecord(item)) {
    return {
      name: labelFromRecord(item, index),
      value: valueFromRecord(item)
    };
  }
  return {
    name: presentString(item, `Item ${index + 1}`),
    value: numberValue(item, 1)
  };
});

const namedSeriesOptionFromData = (
  data: Record<string, unknown>,
  visualization: VisualizationTypes.VisualizationType
) => {
  if (isRecord(data.values)) {
    const entries = Object.entries(data.values);
    const hasArraySeries = entries.some(([, value]) => Array.isArray(value));
    if (hasArraySeries) {
      const longestSeries = Math.max(...entries.map(([, value]) => valuesAsSeriesData(value).length));
      const headers = Array.isArray(data.headers)
        ? data.headers.map((item, index) => presentString(item, `Item ${index + 1}`))
        : Array.from({ length: longestSeries }, (_item, index) => `Item ${index + 1}`);
      return {
        xAxis: { type: 'category', data: headers },
        series: entries.map(([name, value]) => ({
          name,
          data: valuesAsSeriesData(value)
        }))
      };
    }
    return {
      series: [{
        name: visualization.name,
        data: entries.map(([name, value]) => ({
          name,
          value: numberValue(value)
        }))
      }]
    };
  }

  const listData = Array.isArray(data.words)
    ? data.words
    : Array.isArray(data.calendar)
      ? data.calendar
      : Array.isArray(data.nodes)
        ? data.nodes
        : undefined;
  if (listData) {
    return {
      series: [{
        name: visualization.name,
        data: pairsFromArray(listData)
      }]
    };
  }

  const numericEntries = Object.entries(data)
    .filter(([, value]) => Number.isFinite(Number(String(value ?? '').replace(/,/g, '').trim())));
  if (numericEntries.length > 0) {
    return {
      series: [{
        name: visualization.name,
        data: numericEntries.map(([name, value]) => ({
          name,
          value: numberValue(value)
        }))
      }]
    };
  }

  return undefined;
};

const createEmbeddedChartsFromVisualizations = (visualizations: VisualizationTypes.VisualizationType[]): NonNullable<ExcelExportOptions['embeddedCharts']> => (
  visualizations.map((visualization) => {
    const type = Array.isArray(visualization.type) ? visualization.type[0] : visualization.type;
    return {
      title: visualization.name,
      type,
      option: isRecord(visualization.data)
        ? namedSeriesOptionFromData(visualization.data, visualization)
        : undefined
    };
  })
);

const getAxisLabels = (option: Record<string, unknown>): unknown[] => {
  const axis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
  return axis && typeof axis === 'object' && !Array.isArray(axis) && Array.isArray((axis as Record<string, unknown>).data)
    ? (axis as Record<string, unknown>).data as unknown[]
    : [];
};

const writeVisibleChartData = (
  worksheet: ExcelJS.Worksheet,
  charts: NonNullable<ExcelExportOptions['embeddedCharts']>,
  startRow: number,
  startColumn: number
) => {
  let cursor = startRow;
  charts.forEach((chart, chartIndex) => {
    const option = chartOptionRecord(chart);
    const series = asRecordArray(option.series);
    const axisLabels = getAxisLabels(option);
    worksheet.getCell(cursor, startColumn).value = chart.title || `Visualization ${chartIndex + 1}`;
    worksheet.getCell(cursor, startColumn).font = { bold: true };
    cursor += 1;

    if (axisLabels.length > 0 && series.length > 0) {
      worksheet.getCell(cursor, startColumn).value = 'Category';
      series.forEach((item, index) => {
        worksheet.getCell(cursor, startColumn + index + 1).value = typeof item.name === 'string' ? item.name : `Series ${index + 1}`;
      });
      cursor += 1;
      axisLabels.forEach((label, rowIndex) => {
        worksheet.getCell(cursor, startColumn).value = label as ExcelJS.CellValue;
        series.forEach((item, seriesIndex) => {
          const values = Array.isArray(item.data) ? item.data : [];
          worksheet.getCell(cursor, startColumn + seriesIndex + 1).value = values[rowIndex] as ExcelJS.CellValue;
        });
        cursor += 1;
      });
      cursor += 1;
      return;
    }

    const firstSeriesData = Array.isArray(series[0]?.data) ? series[0].data as unknown[] : [];
    const namedValues = firstSeriesData.filter((item): item is Record<string, unknown> => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return false;
      }
      return 'name' in item || 'value' in item;
    });
    if (namedValues.length > 0) {
      worksheet.getCell(cursor, startColumn).value = 'Name';
      worksheet.getCell(cursor, startColumn + 1).value = 'Value';
      cursor += 1;
      namedValues.forEach((item) => {
        worksheet.getCell(cursor, startColumn).value = item.name as ExcelJS.CellValue;
        worksheet.getCell(cursor, startColumn + 1).value = item.value as ExcelJS.CellValue;
        cursor += 1;
      });
      cursor += 1;
      return;
    }

    worksheet.getCell(cursor, startColumn).value = 'Type';
    worksheet.getCell(cursor, startColumn + 1).value = chart.type || 'visualization';
    cursor += 2;
  });
};

const writeVisiblePreviewSummary = (
  worksheet: ExcelJS.Worksheet,
  title: string,
  bounds: ReturnType<typeof getCellRangeBounds>,
  charts: ExcelExportOptions['embeddedCharts']
) => {
  if (bounds.start.row > 1) {
    const titleRow = bounds.start.row - 1;
    const start = `${getColumnName(bounds.start.column)}${titleRow}`;
    const end = `${getColumnName(bounds.end.column)}${titleRow}`;
    worksheet.mergeCells(`${start}:${end}`);
    const titleCell = worksheet.getCell(titleRow, bounds.start.column);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 12 };
    titleCell.alignment = { horizontal: 'center' };
  }

  if (charts?.length) {
    writeVisibleChartData(worksheet, charts, bounds.end.row + 2, bounds.start.column);
  }
};

const decodeTemplateWorkbook = (value: unknown, buffer?: Buffer) => {
  if (buffer?.length) {
    return buffer;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const base64 = value.includes(',') ? value.split(',').pop() : value;
  if (!base64) {
    return undefined;
  }

  return Buffer.from(base64, 'base64');
};

const getColumnName = (columnNumber: number) => {
  let dividend = columnNumber;
  let columnName = '';

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
};

const createWebExtensionXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<we:webextension xmlns:we="http://schemas.microsoft.com/office/webextensions/webextension/2010/11" id="{${ILLUSTRY_OFFICE_ADDIN_ID}}">
  <we:reference id="${ILLUSTRY_OFFICE_ADDIN_ID}" version="1.0.0.0" store="developer" storeType="Registry"/>
  <we:alternateReferences/>
  <we:properties>
    <we:property name="Office.AutoShowTaskpaneWithDocument" value="true"/>
  </we:properties>
  <we:bindings/>
  <we:snapshot xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
</we:webextension>`;

const createTaskpanesXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<wetp:taskpanes xmlns:wetp="http://schemas.microsoft.com/office/webextensions/taskpanes/2010/11">
  <wetp:taskpane dockstate="right" visibility="1" width="420" row="4">
    <wetp:webextensionref xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/>
  </wetp:taskpane>
</wetp:taskpanes>`;

const createTaskpanesRelsXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="${WEB_EXTENSION_RELATIONSHIP}" Target="webextension1.xml"/>
</Relationships>`;

const ensureOverride = (
  overrides: Array<{ $: { PartName: string; ContentType: string } }>,
  partName: string,
  contentType: string
) => {
  if (!overrides.some((override) => override.$.PartName === partName)) {
    overrides.push({
      $: {
        PartName: partName,
        ContentType: contentType
      }
    });
  }
};

const updateContentTypes = async (zip: JSZip) => {
  const contentTypesPath = '[Content_Types].xml';
  const contentTypesFile = zip.file(contentTypesPath);
  if (!contentTypesFile) {
    throw new Error(`Missing required workbook part: ${contentTypesPath}`);
  }

  const parser = new Parser();
  const builder = new Builder({ headless: false, renderOpts: { pretty: false } });
  const contentTypes = await parser.parseStringPromise(await contentTypesFile.async('string'));
  const overrides = (contentTypes.Types.Override || []) as Array<{ $: { PartName: string; ContentType: string } }>;

  ensureOverride(overrides, '/xl/webextensions/webextension1.xml', 'application/vnd.ms-office.webextension+xml');
  ensureOverride(overrides, '/xl/webextensions/taskpanes.xml', 'application/vnd.ms-office.webextensiontaskpanes+xml');
  contentTypes.Types.Override = overrides;
  zip.file(contentTypesPath, builder.buildObject(contentTypes));
};

const updateWorkbookRelationships = async (zip: JSZip) => {
  const relsPath = 'xl/_rels/workbook.xml.rels';
  const relsFile = zip.file(relsPath);
  if (!relsFile) {
    throw new Error(`Missing required workbook relationships part: ${relsPath}`);
  }

  const parser = new Parser();
  const builder = new Builder({ headless: false, renderOpts: { pretty: false } });
  const rels = await parser.parseStringPromise(await relsFile.async('string'));
  const relationships = (rels.Relationships.Relationship || []) as Array<{
    $: { Id: string; Type: string; Target: string };
  }>;
  const maxRelationshipId = relationships.reduce((maxId, relationship) => {
    const id = Number(String(relationship.$.Id || '').replace(/^rId/, ''));
    return Number.isFinite(id) ? Math.max(maxId, id) : maxId;
  }, 0);

  if (!relationships.some((relationship) => relationship.$.Type === WEB_EXTENSION_TASKPANES_RELATIONSHIP)) {
    relationships.push({
      $: {
        Id: `rId${maxRelationshipId + 1}`,
        Type: WEB_EXTENSION_TASKPANES_RELATIONSHIP,
        Target: 'webextensions/taskpanes.xml'
      }
    });
  }

  rels.Relationships.Relationship = relationships;
  zip.file(relsPath, builder.buildObject(rels));
};

const normalizeDrawingImageExtents = async (zip: JSZip) => {
  const drawingFiles = Object.keys(zip.files).filter((filename) => /^xl\/drawings\/drawing\d+\.xml$/.test(filename));
  const parser = new Parser();
  const builder = new Builder({ headless: false, renderOpts: { pretty: false } });

  await Promise.all(drawingFiles.map(async (filename) => {
    const drawingFile = zip.file(filename);
    if (!drawingFile) return;
    const drawing = await parser.parseStringPromise(await drawingFile.async('string'));
    const anchors = [
      ...(drawing['xdr:wsDr']?.['xdr:oneCellAnchor'] || []),
      ...(drawing['xdr:wsDr']?.['xdr:twoCellAnchor'] || [])
    ] as Array<Record<string, unknown>>;
    let changed = false;

    anchors.forEach((anchor) => {
      const outerExtent = (anchor['xdr:ext'] as Array<{ $?: { cx?: string; cy?: string } }> | undefined)?.[0]?.$;
      if (!outerExtent?.cx || !outerExtent?.cy) return;
      const picture = (anchor['xdr:pic'] as Array<Record<string, unknown>> | undefined)?.[0];
      const shapeProperties = (picture?.['xdr:spPr'] as Array<Record<string, unknown>> | undefined)?.[0];
      const transform = (shapeProperties?.['a:xfrm'] as Array<Record<string, unknown>> | undefined)?.[0];
      if (!transform) return;
      const innerExtent = (transform['a:ext'] as Array<{ $?: { cx?: string; cy?: string } }> | undefined)?.[0];
      if (!innerExtent?.$) return;
      if (innerExtent.$.cx === '0' || innerExtent.$.cy === '0') {
        innerExtent.$.cx = outerExtent.cx;
        innerExtent.$.cy = outerExtent.cy;
        changed = true;
      }
    });

    if (changed) {
      zip.file(filename, builder.buildObject(drawing));
    }
  }));
};

const embedIllustryOfficeAddin = async (buffer: Buffer) => {
  const zip = await JSZip.loadAsync(toZipBytes(buffer));
  zip.file('xl/webextensions/webextension1.xml', createWebExtensionXml());
  zip.file('xl/webextensions/taskpanes.xml', createTaskpanesXml());
  zip.file('xl/webextensions/_rels/taskpanes.xml.rels', createTaskpanesRelsXml());

  await normalizeDrawingImageExtents(zip);
  await updateContentTypes(zip);
  await updateWorkbookRelationships(zip);

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
};

const upsertHiddenMetadataSheet = (workbook: ExcelJS.Workbook) => {
  const existing = workbook.getWorksheet('Illustry Add-in');
  const worksheet = existing || workbook.addWorksheet('Illustry Add-in');
  worksheet.state = 'veryHidden';
  return worksheet;
};

const createWorkbook = async (
  title: string,
  visualizations: VisualizationTypes.VisualizationType[],
  options: ExcelExportOptions
): Promise<WorkbookExport> => {
  const sheetName = normalizeSheetName(options.sheetName);
  const cellRange = normalizeCellRange(options.cellRange);
  const workbook = new ExcelJS.Workbook();

  const templateWorkbookBuffer = decodeTemplateWorkbook(options.templateWorkbookBase64, options.templateWorkbookBuffer);
  if (templateWorkbookBuffer) {
    await workbook.xlsx.load(templateWorkbookBuffer);
  } else {
    workbook.creator = 'Illustry';
    workbook.created = new Date();
    workbook.addWorksheet(sheetName);
  }
  workbook.modified = new Date();

  let worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
    worksheet = workbook.addWorksheet(sheetName);
  }

  const embeddedCharts = Array.isArray(options.embeddedCharts) && options.embeddedCharts.length > 0
    ? options.embeddedCharts
    : createEmbeddedChartsFromVisualizations(visualizations);
  const previewBounds = preparePreviewWorksheet(worksheet, cellRange, Boolean(templateWorkbookBuffer));

  if (!templateWorkbookBuffer) {
    writeVisiblePreviewSummary(worksheet, title, previewBounds, embeddedCharts);
  }

  if (options.previewImage?.buffer.length) {
    const imageId = workbook.addImage(options.previewImage);
    const previewSize = getPreviewImageSize(previewBounds);
    worksheet.addImage(imageId, {
      tl: {
        col: previewBounds.start.column - 1,
        row: previewBounds.start.row - 1
      },
      ext: previewSize,
      editAs: 'oneCell'
    });
  }

  const firstVisualization = visualizations[0];
  if (firstVisualization) {
    upsertHiddenMetadataSheet(workbook).getCell('A1').value = JSON.stringify({
      title: firstVisualization.name,
      type: Array.isArray(firstVisualization.type) ? firstVisualization.type[0] : firstVisualization.type,
      sheetName,
      rangeAddress: cellRange,
      imageRangeAddress: cellRange,
      addinId: ILLUSTRY_OFFICE_ADDIN_ID,
      charts: embeddedCharts
    });
  }

  const buffer = await embedIllustryOfficeAddin(Buffer.from(await workbook.xlsx.writeBuffer()));
  return {
    buffer,
    filename: `${sanitizeFilename(title)}.xlsx`
  };
};

const createVisualizationExcelWorkbook = (
  visualization: VisualizationTypes.VisualizationType,
  options: ExcelExportOptions
) => createWorkbook(`visualization-${visualization.name}`, [visualization], options);

const createDashboardExcelWorkbook = (
  dashboard: DashboardTypes.DashboardType,
  options: ExcelExportOptions
) => {
  const visualizations = Array.isArray(dashboard.visualizations)
    ? dashboard.visualizations
    : [];
  return createWorkbook(`dashboard-${dashboard.name}`, visualizations, options);
};

export {
  EXCEL_MIME,
  ILLUSTRY_OFFICE_ADDIN_ID,
  createDashboardExcelWorkbook,
  createVisualizationExcelWorkbook
};
export type {
  ExcelExportOptions,
  WorkbookExport
};
