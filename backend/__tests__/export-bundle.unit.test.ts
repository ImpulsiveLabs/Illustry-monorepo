import JSZip from 'jszip';
import path from 'path';
import sharp from 'sharp';
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
const pngDataUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=`;

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

const getRelationships = (xml: string) => Array.from(xml.matchAll(/<Relationship\s+([^>]+?)\/>/g))
  .map((match) => {
    const attrs = Object.fromEntries(Array.from(match[1].matchAll(/([A-Za-z:]+)="([^"]*)"/g))
      .map((attr) => [attr[1], attr[2]]));
    return attrs as { Id: string; Type: string; Target: string };
  });

const resolveRelationshipTarget = (relsPath: string, target: string) => {
  const ownerPath = relsPath.replace('/_rels/', '/').replace(/\.rels$/, '');
  const ownerDirectory = path.posix.dirname(ownerPath);
  return path.posix.normalize(path.posix.join(ownerDirectory, target));
};

const expectValidPptxPackage = async (buffer: Buffer, expectedImageSlide: number) => {
  const pptZip = await JSZip.loadAsync(buffer);
  expect(pptZip.file('[Content_Types].xml')).toBeDefined();
  expect(pptZip.file('_rels/.rels')).toBeDefined();
  expect(pptZip.file('docProps/core.xml')).toBeDefined();
  expect(pptZip.file('docProps/app.xml')).toBeDefined();
  expect(pptZip.file('ppt/presentation.xml')).toBeDefined();
  expect(pptZip.file('ppt/_rels/presentation.xml.rels')).toBeDefined();
  expect(pptZip.file('ppt/slideMasters/slideMaster1.xml')).toBeDefined();
  expect(pptZip.file('ppt/slideLayouts/slideLayout1.xml')).toBeDefined();
  expect(pptZip.file('ppt/theme/theme1.xml')).toBeDefined();

  const contentTypes = await pptZip.file('[Content_Types].xml')?.async('string');
  expect(contentTypes).toContain('/ppt/slideMasters/slideMaster1.xml');
  expect(contentTypes).toContain('/ppt/slideLayouts/slideLayout1.xml');
  expect(contentTypes).toContain('/ppt/theme/theme1.xml');

  const presentationRelsXml = await pptZip.file('ppt/_rels/presentation.xml.rels')?.async('string');
  const presentationRelationships = getRelationships(presentationRelsXml || '');
  const slideRelationships = presentationRelationships
    .filter((relationship) => relationship.Type.endsWith('/slide'));
  expect(slideRelationships.length).toBeGreaterThanOrEqual(expectedImageSlide);
  slideRelationships.forEach((relationship) => {
    expect(pptZip.file(resolveRelationshipTarget('ppt/_rels/presentation.xml.rels', relationship.Target))).toBeDefined();
  });

  await Promise.all(slideRelationships.map(async (relationship, index) => {
    const slidePath = resolveRelationshipTarget('ppt/_rels/presentation.xml.rels', relationship.Target);
    const relsPath = `ppt/slides/_rels/${path.posix.basename(slidePath)}.rels`;
    const slideXml = await pptZip.file(slidePath)?.async('string');
    const slideRelsXml = await pptZip.file(relsPath)?.async('string');
    expect(slideXml).toContain('<p:sld');
    expect(slideRelsXml).toBeDefined();
    const relationships = getRelationships(slideRelsXml || '');
    const ids = relationships.map((item) => item.Id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(relationships.some((item) => item.Type.endsWith('/slideLayout'))).toBe(true);
    relationships.forEach((item) => {
      expect(pptZip.file(resolveRelationshipTarget(relsPath, item.Target))).toBeDefined();
    });
    if (index + 1 === expectedImageSlide) {
      expect(slideXml).toContain('<p:pic>');
      expect(relationships.some((item) => item.Type.endsWith('/image'))).toBe(true);
    } else {
      expect(slideXml).not.toContain('<p:pic>');
    }
  }));
};

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

  it('uses the live preview image for raster exports to avoid backend SVG text artifacts', async () => {
    const preview = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 4,
        background: { r: 12, g: 34, b: 56, alpha: 1 }
      }
    }).png().toBuffer();
    const result = await createVisualizationExportBundle({
      title: 'Preview backed raster',
      formats: ['png'],
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360,
        previewDataUrl: `data:image/png;base64,${preview.toString('base64')}`
      }],
      visualization
    });

    const pixels = await sharp(result.buffer).raw().toBuffer();
    expect(Array.from(pixels.subarray(0, 3))).toEqual([12, 34, 56]);
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
        previewDataUrl: pngDataUrl
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

  it('packages PDF, Word, and PowerPoint exports with the requested document placement', async () => {
    const result = await createVisualizationExportBundle({
      title: 'Sales documents',
      formats: ['pdf', 'word', 'ppt'],
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360,
        previewDataUrl: pngDataUrl
      }],
      documentOptions: {
        page: 2,
        width: 800,
        height: 450,
        placement: 'top-right'
      },
      visualization
    });

    expect(result.bundled).toBe(true);
    const zip = await JSZip.loadAsync(result.buffer);
    const pdf = await zip.file('Sales-documents.pdf')?.async('nodebuffer');
    const word = await zip.file('Sales-documents.docx')?.async('nodebuffer');
    const ppt = await zip.file('Sales-documents.pptx')?.async('nodebuffer');
    expect(pdf?.subarray(0, 5).toString()).toBe('%PDF-');
    expect(word).toBeDefined();
    expect(ppt).toBeDefined();
    await expect(JSZip.loadAsync(word as Buffer)).resolves.toBeDefined();
    await expectValidPptxPackage(ppt as Buffer, 2);
  });

  it('places PowerPoint exports on the requested slide instead of always using slide one', async () => {
    const result = await createVisualizationExportBundle({
      title: 'Sales slide target',
      formats: ['ppt'],
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360,
        previewDataUrl: pngDataUrl
      }],
      documentOptions: {
        page: 3,
        width: 800,
        height: 450,
        placement: 'middle-center'
      },
      visualization
    });

    expect(result.filename).toBe('Sales-slide-target.pptx');
    await expectValidPptxPackage(result.buffer, 3);
  });

  it('updates uploaded document templates in the backend', async () => {
    const sharedInput = {
      title: 'Sales document template',
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360,
        previewDataUrl: pngDataUrl
      }],
      visualization
    };
    const pdfTemplate = await createVisualizationExportBundle({
      ...sharedInput,
      formats: ['pdf']
    });
    const wordTemplate = await createVisualizationExportBundle({
      ...sharedInput,
      formats: ['word']
    });
    const pptTemplate = await createVisualizationExportBundle({
      ...sharedInput,
      formats: ['ppt']
    });

    const pdf = await createVisualizationExportBundle({
      ...sharedInput,
      title: 'Updated PDF',
      formats: ['pdf'],
      documentOptions: {
        templateFile: {
          buffer: pdfTemplate.buffer,
          originalname: 'existing-report.pdf',
          mimetype: 'application/pdf'
        }
      }
    });
    const word = await createVisualizationExportBundle({
      ...sharedInput,
      title: 'Updated Word',
      formats: ['word'],
      documentOptions: {
        templateFile: {
          buffer: wordTemplate.buffer,
          originalname: 'existing-report.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      }
    });
    const ppt = await createVisualizationExportBundle({
      ...sharedInput,
      title: 'Updated PPT',
      formats: ['ppt'],
      documentOptions: {
        templateFile: {
          buffer: pptTemplate.buffer,
          originalname: 'existing-report.pptx',
          mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        }
      }
    });

    expect(pdf.filename).toBe('existing-report.pdf');
    expect(pdf.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(word.filename).toBe('existing-report.docx');
    await expect(JSZip.loadAsync(word.buffer)).resolves.toBeDefined();
    expect(ppt.filename).toBe('existing-report.pptx');
    await expectValidPptxPackage(ppt.buffer, 1);
  });

  it('allows one independent uploaded template per document format', async () => {
    const sharedInput = {
      title: 'Sales separate templates',
      charts: [{
        title: 'Sales',
        option: chart,
        width: 640,
        height: 360,
        previewDataUrl: pngDataUrl
      }],
      visualization
    };
    const excelTemplate = await createVisualizationExportBundle({ ...sharedInput, formats: ['excel'] });
    const pdfTemplate = await createVisualizationExportBundle({ ...sharedInput, formats: ['pdf'] });
    const wordTemplate = await createVisualizationExportBundle({ ...sharedInput, formats: ['word'] });
    const pptTemplate = await createVisualizationExportBundle({ ...sharedInput, formats: ['ppt'] });

    const result = await createVisualizationExportBundle({
      ...sharedInput,
      formats: ['excel', 'pdf', 'word', 'ppt'],
      documentOptions: {
        templateFiles: {
          excel: { buffer: excelTemplate.buffer, originalname: 'workbook.xlsx' },
          pdf: { buffer: pdfTemplate.buffer, originalname: 'deck-not-used.pdf' },
          word: { buffer: wordTemplate.buffer, originalname: 'notes.docx' },
          ppt: { buffer: pptTemplate.buffer, originalname: 'slides.pptx' }
        }
      }
    });

    const zip = await JSZip.loadAsync(result.buffer);
    expect(zip.file('visualization-Sales.xlsx')).toBeDefined();
    expect(zip.file('deck-not-used.pdf')).toBeDefined();
    expect(zip.file('notes.docx')).toBeDefined();
    expect(zip.file('slides.pptx')).toBeDefined();
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
