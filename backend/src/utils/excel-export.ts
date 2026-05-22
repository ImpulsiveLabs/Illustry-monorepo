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

const embedIllustryOfficeAddin = async (buffer: Buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  zip.file('xl/webextensions/webextension1.xml', createWebExtensionXml());
  zip.file('xl/webextensions/taskpanes.xml', createTaskpanesXml());
  zip.file('xl/webextensions/_rels/taskpanes.xml.rels', createTaskpanesRelsXml());

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

  const templateWorkbook = decodeTemplateWorkbook(options.templateWorkbookBase64, options.templateWorkbookBuffer);
  if (templateWorkbook) {
    await workbook.xlsx.load(templateWorkbook);
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

  if (options.previewImage?.buffer.length) {
    const imageId = workbook.addImage(options.previewImage);
    worksheet.addImage(imageId, cellRange);
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
      charts: Array.isArray(options.embeddedCharts) ? options.embeddedCharts : []
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
