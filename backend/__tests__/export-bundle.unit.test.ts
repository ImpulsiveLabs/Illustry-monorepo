import JSZip from 'jszip';
import { VisualizationTypes } from '@illustry/types';
import {
  createDashboardExportBundle,
  createVisualizationExportBundle,
  normalizeFormats
} from '../src/utils/export-bundle';

const chart = {
  title: {
    text: 'Sales'
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Feb', 'Mar']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    type: 'bar',
    data: [10, 20, 30]
  }]
};

const visualization = {
  _id: 'viz-1',
  userId: 'owner-1',
  projectName: 'Project',
  name: 'Sales',
  type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
  data: {
    headers: ['Jan', 'Feb', 'Mar'],
    values: {
      Revenue: [10, 20, 30]
    }
  }
} as VisualizationTypes.VisualizationType;

describe('export bundle utility', () => {
  it('rejects empty export selections', () => {
    expect(() => normalizeFormats([])).toThrow('Select at least one export option.');
  });

  it('returns a single selected export directly', async () => {
    const result = await createVisualizationExportBundle({
      title: 'Sales',
      formats: ['svg'],
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360
      }],
      visualization
    });

    expect(result.bundled).toBe(false);
    expect(result.filename).toBe('Sales.svg');
    expect(result.mimeType).toBe('image/svg+xml;charset=utf-8');
    expect(result.buffer.toString()).toContain('<svg');
  });

  it('returns the default single PNG export directly without ZIP packaging', async () => {
    const result = await createVisualizationExportBundle({
      title: 'Sales',
      formats: ['png'],
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360
      }],
      visualization
    });

    expect(result.bundled).toBe(false);
    expect(result.filename).toBe('Sales.png');
    expect(result.mimeType).toBe('image/png');
    expect(result.buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });

  it('packages multiple selected exports into a valid ZIP', async () => {
    const result = await createDashboardExportBundle({
      title: 'Main dashboard',
      formats: ['svg', 'web-component'],
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360
      }],
      dashboard: {
        _id: 'dash-1',
        userId: 'owner-1',
        projectName: 'Project',
        name: 'Main dashboard',
        visualizations: [visualization]
      } as never
    });

    expect(result.bundled).toBe(true);
    expect(result.filename).toBe('Main-dashboard.zip');
    const zip = await JSZip.loadAsync(result.buffer);
    await expect(zip.file('Main-dashboard.svg')?.async('string')).resolves.toContain('<svg');
    await expect(zip.file('Main-dashboard.webcomponent.html')?.async('string')).resolves.toContain('<illustry-dashboard>');
  });

  it('creates an Excel workbook with an embedded visualization preview', async () => {
    const result = await createVisualizationExportBundle({
      title: 'Sales',
      formats: ['excel'],
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360,
        previewDataUrl: `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')}`
      }],
      excelOptions: {
        sheetName: 'Report',
        cellRange: 'H3:Z10'
      },
      visualization
    });

    expect(result.bundled).toBe(false);
    expect(result.filename).toBe('visualization-Sales.xlsx');
    const workbookZip = await JSZip.loadAsync(result.buffer);
    const media = Object.keys(workbookZip.files).filter((file) => file.startsWith('xl/media/'));
    expect(media).toContain('xl/media/image1.png');
    await expect(workbookZip.file('xl/webextensions/webextension1.xml')?.async('string'))
      .resolves
      .toContain('Office.AutoShowTaskpaneWithDocument');
    const workbook = await import('exceljs').then(({ default: ExcelJS }) => new ExcelJS.Workbook());
    await workbook.xlsx.load(result.buffer);
    expect(workbook.getWorksheet('Illustry Add-in')?.getCell('A1').value).toContain('"charts":[{"title":"Sales"');
  });

  it('keeps large SVG exports valid without ZIP corruption', async () => {
    const largeChart = {
      ...chart,
      xAxis: {
        type: 'category',
        data: Array.from({ length: 500 }, (_, index) => `P${index}`)
      },
      series: [{
        type: 'line',
        data: Array.from({ length: 500 }, (_, index) => Math.sin(index / 12) * 100)
      }]
    };

    const result = await createVisualizationExportBundle({
      title: 'Large export',
      formats: ['svg', 'web-component'],
      charts: [{
        title: 'Large export',
        option: largeChart,
        width: 1600,
        height: 900
      }],
      visualization
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const svg = await zip.file('Large-export.svg')?.async('string');
    expect(svg?.length).toBeGreaterThan(1000);
    expect(await zip.file('Large-export.webcomponent.html')?.async('string')).toContain('"type":"line"');
  });
});
