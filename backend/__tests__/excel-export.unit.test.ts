import ExcelJS from 'exceljs';
import { VisualizationTypes } from '@illustry/types';
import JSZip from 'jszip';
import { createDashboardExcelWorkbook, createVisualizationExcelWorkbook } from '../src/utils/excel-export';

describe('excel export utility', () => {
  it('creates a visualization workbook with only the visualization image on the requested range', async () => {
    const workbookExport = await createVisualizationExcelWorkbook({
      _id: 'viz-1',
      userId: 'owner-1',
      projectName: 'Project',
      name: 'Sales',
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
      data: {
        headers: ['Jan', 'Feb'],
        values: {
          Revenue: [10, 20],
          Cost: [4, 8]
        }
      }
    } as VisualizationTypes.VisualizationType, {
      sheetName: 'Report',
      cellRange: 'H3:Z10',
      previewImage: {
        buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        extension: 'png'
      }
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(workbookExport.buffer);
    const worksheet = workbook.getWorksheet('Report');

    expect(worksheet).toBeDefined();
    expect(worksheet?.getCell('A1').value).toBeNull();
    expect(worksheet?.getImages()).toHaveLength(1);
    expect(workbookExport.filename).toBe('visualization-Sales.xlsx');
  });

  it('embeds the Illustry Office add-in reference with hidden placement metadata', async () => {
    const workbookExport = await createVisualizationExcelWorkbook({
      _id: 'viz-1',
      userId: 'owner-1',
      projectName: 'Project',
      name: 'Sales',
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
      data: {
        headers: ['Jan'],
        values: {
          Revenue: [10]
        }
      }
    } as VisualizationTypes.VisualizationType, {
      sheetName: 'Report',
      cellRange: 'H3:Z10'
    });

    const zip = await JSZip.loadAsync(workbookExport.buffer);
    const webExtensionXml = await zip.file('xl/webextensions/webextension1.xml')?.async('string');
    const taskpanesXml = await zip.file('xl/webextensions/taskpanes.xml')?.async('string');
    const workbookRelsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
    const contentTypesXml = await zip.file('[Content_Types].xml')?.async('string');

    expect(webExtensionXml).toContain('Office.AutoShowTaskpaneWithDocument');
    expect(webExtensionXml).toContain('53f9e4f7-b86d-46c0-99e1-87a3e5d3a0c4');
    expect(taskpanesXml).toContain('visibility="1"');
    expect(workbookRelsXml).toContain('webextensiontaskpanes');
    expect(contentTypesXml).toContain('application/vnd.ms-office.webextension+xml');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(workbookExport.buffer);
    const metadataSheet = workbook.getWorksheet('Illustry Add-in');
    expect(metadataSheet?.state).toBe('veryHidden');
    expect(metadataSheet?.getCell('A1').value).toContain('"rangeAddress":"H3:Z10"');
    expect(metadataSheet?.getCell('A1').value).toContain('"imageRangeAddress":"H3:Z10"');
  });

  it('preserves formulas in an uploaded workbook and inserts only the visualization', async () => {
    const template = new ExcelJS.Workbook();
    const report = template.addWorksheet('Report');
    report.getCell('A1').value = { formula: 'SUM(B1:C1)', result: 7 };
    report.getCell('B1').value = 3;
    report.getCell('C1').value = 4;

    const workbookExport = await createDashboardExcelWorkbook({
      _id: 'dash-1',
      userId: 'owner-1',
      projectName: 'Project',
      name: 'Overview',
      visualizations: [{
        _id: 'viz-1',
        userId: 'owner-1',
        projectName: 'Project',
        name: 'Funnel',
        type: VisualizationTypes.VisualizationTypesEnum.FUNNEL,
        data: {
          values: {
            Leads: 100,
            Closed: 20
          }
        }
      } as VisualizationTypes.VisualizationType]
    } as never, {
      sheetName: 'Report',
      cellRange: 'H3:Z10',
      templateWorkbookBase64: Buffer.from(await template.xlsx.writeBuffer()).toString('base64'),
      previewImage: {
        buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        extension: 'png'
      }
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(workbookExport.buffer);
    const worksheet = workbook.getWorksheet('Report');

    expect(worksheet?.getCell('A1').value).toEqual({ formula: 'SUM(B1:C1)', result: 7 });
    expect(worksheet?.getCell('B1').value).toBe(3);
    expect(worksheet?.getCell('C1').value).toBe(4);
    expect(worksheet?.getImages()).toHaveLength(1);
  });
});
