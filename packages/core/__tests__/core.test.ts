import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {
  IllustryApiClient,
  IllustryError,
  type IllustryApiClientOptions,
  LocalIllustryStore,
  UPLOAD_CONSTRAINTS,
  applyImportMapping,
  buildWebComponentHtml,
  createLocalExportBundle,
  formatUploadBytes,
  importVisualizationSource,
  isIllustryExportFormat,
  normalizeFormats,
  parseImportMapping,
  parseExportFormats,
  renderSvg,
  sanitizeFilename,
  toIllustryError,
  validateUploadedFileMetadata,
  type IllustryLocalAsset
} from '../src';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-core-'));

const makeAsset = (overrides: Partial<IllustryLocalAsset> = {}): IllustryLocalAsset => ({
  id: 'asset_1',
  kind: 'visualization',
  name: 'Offline chart',
  type: 'bar-chart',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  charts: [{
    title: 'Offline chart',
    option: {
      xAxis: { type: 'category', data: ['A', 'B'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [3, 7] }]
    },
    width: 640,
    height: 360
  }],
  ...overrides
});

const makeUser = () => ({
  id: 'user_1',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  isEmailVerified: true,
  roles: ['user'],
  hasAvatar: false
});

describe('@illustry/core local workflows', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('imports a visualization source without a server or database', async () => {
    const source = path.join(tempDir, 'sales.json');
    await fs.writeFile(source, JSON.stringify({
      option: {
        xAxis: { type: 'category', data: ['A', 'B'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [1, 2] }]
      }
    }), 'utf8');

    const asset = await importVisualizationSource({ filePath: source, name: 'Sales' });
    expect(asset.name).toBe('Sales');
    expect(asset.charts[0].option.series).toEqual([{ type: 'bar', data: [1, 2] }]);
  });

  it('stores local assets and creates zip exports when multiple formats are selected', async () => {
    const store = new LocalIllustryStore({ rootDir: tempDir });
    const asset = await store.saveAsset({
      kind: 'visualization',
      name: 'Offline chart',
      type: 'bar-chart',
      charts: [{
        title: 'Offline chart',
        option: {
          xAxis: { type: 'category', data: ['A'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [3] }]
        }
      }]
    });

    const bundle = await createLocalExportBundle({
      asset,
      formats: ['json', 'web-component']
    });
    expect(bundle.bundled).toBe(true);
    expect(bundle.filename).toBe('Offline-chart.zip');

    const zip = await JSZip.loadAsync(bundle.buffer);
    expect(zip.file('Offline-chart.json')).toBeTruthy();
    expect(zip.file('Offline-chart.webcomponent.html')).toBeTruthy();
  });

  it('creates a valid local Excel export from chart data', async () => {
    const store = new LocalIllustryStore({ rootDir: tempDir });
    const asset = await store.saveAsset({
      kind: 'visualization',
      name: 'Office chart',
      type: 'bar-chart',
      charts: [{
        title: 'Office chart',
        option: {
          xAxis: { type: 'category', data: ['A', 'B'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [3, 7] }]
        }
      }]
    });

    const bundle = await createLocalExportBundle({
      asset,
      formats: ['excel']
    });
    expect(bundle.bundled).toBe(false);
    expect(bundle.filename).toBe('Office-chart.xlsx');

    const workbookZip = await JSZip.loadAsync(bundle.buffer);
    expect(workbookZip.file('[Content_Types].xml')).toBeTruthy();
    expect(workbookZip.file('xl/workbook.xml')).toBeTruthy();
  });

  it('keeps local import/export format parsing deterministic', () => {
    expect(parseExportFormats()).toEqual(['json']);
    expect(parseExportFormats('svg,unknown,png,svg')).toEqual(['svg', 'png', 'svg']);
  });

  it('uploads raw files through the optional API adapter without buffering into JSON', async () => {
    const source = path.join(tempDir, 'payload.csv');
    await fs.writeFile(source, 'label,value\nA,1\n', 'utf8');

    let capturedInit: Parameters<NonNullable<IllustryApiClientOptions['fetchImpl']>>[1];
    const fetchImpl: NonNullable<IllustryApiClientOptions['fetchImpl']> = async (_input, init) => {
      capturedInit = init;
      return new Response(JSON.stringify({ uploaded: true }), {
        headers: { 'content-type': 'application/json' }
      });
    };
    const client = new IllustryApiClient({
      baseUrl: 'http://localhost:7001',
      token: 'token',
      fetchImpl
    });

    await expect(client.uploadRawFile('/upload', source, 'text/csv')).resolves.toEqual({ uploaded: true });
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.body).toBeInstanceOf(Blob);
    const headers = new Headers(capturedInit?.headers);
    expect(headers.get('content-type')).toBe('text/csv');
    expect(headers.get('x-illustry-file-size')).toBe('16');
  });

  it('uses real server routes for browse, bundle export, and visualization upload', async () => {
    const source = path.join(tempDir, 'server.csv');
    await fs.writeFile(source, 'label,value\nA,1\n', 'utf8');

    const calls: Array<{ url: string; init?: Parameters<NonNullable<IllustryApiClientOptions['fetchImpl']>>[1] }> = [];
    const fetchImpl: NonNullable<IllustryApiClientOptions['fetchImpl']> = async (input, init) => {
      const url = input.toString();
      const pathname = new URL(url).pathname;
      calls.push({ url, init });
      if (pathname === '/api/visualizations') {
        return new Response(JSON.stringify({ items: [{ name: 'Server Chart' }] }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (pathname === '/api/visualization/export/bundle') {
        return new Response(Buffer.from('server-export'), {
          headers: {
            'content-type': 'image/svg+xml;charset=utf-8',
            'content-disposition': 'attachment; filename="Server-Chart.svg"'
          }
        });
      }
      if (pathname === '/api/visualization') {
        return new Response(JSON.stringify({ name: 'Uploaded Chart' }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      throw new Error(`Unexpected URL ${url}`);
    };
    const client = new IllustryApiClient({
      baseUrl: 'http://illustry.local',
      cookie: 'illustry_session=session; illustry_csrf=csrf-token',
      csrfToken: 'csrf-token',
      fetchImpl
    });

    await expect(client.browse({ resource: 'visualizations', query: { text: 'Server' } }))
      .resolves.toEqual({ items: [{ name: 'Server Chart' }] });
    await expect(client.downloadExport({
      resource: 'visualization',
      name: 'Server Chart',
      body: {
        name: 'Server Chart',
        formats: ['svg'],
        charts: [{ option: { series: [] } }]
      }
    })).resolves.toMatchObject({
      filename: 'Server-Chart.svg',
      mimeType: 'image/svg+xml;charset=utf-8'
    });
    await expect(client.uploadVisualizationSource({
      filePath: source,
      contentType: 'text/csv',
      visualizationDetails: { name: 'Uploaded Chart', type: 'bar-chart' }
    })).resolves.toEqual({ name: 'Uploaded Chart' });

    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      '/api/visualizations',
      '/api/visualization/export/bundle',
      '/api/visualization'
    ]);
    calls.forEach((call) => {
      const headers = new Headers(call.init?.headers);
      expect(headers.get('cookie')).toContain('illustry_session=session');
      expect(headers.get('x-csrf-token')).toBe('csrf-token');
    });
    expect(calls[2].init?.body).toBeInstanceOf(FormData);
  });

  it('rejects huge files from metadata before processing content', () => {
    const result = validateUploadedFileMetadata({
      originalname: 'too-large.csv',
      size: UPLOAD_CONSTRAINTS['visualization-source'].maxBytes + 1
    }, 'visualization-source');
    expect(result.valid).toBe(false);
  });

  it('imports JSON, CSV, XML, and XLSX sources into local chart assets', async () => {
    const jsonArray = path.join(tempDir, 'records.json');
    await fs.writeFile(jsonArray, JSON.stringify([
      { label: 'A', value: 1 },
      { label: 'B', value: 2 }
    ]), 'utf8');
    await expect(importVisualizationSource({ filePath: jsonArray }))
      .resolves.toMatchObject({
        name: 'records',
        source: {
          format: 'json',
          rows: [
            ['label', 'value'],
            ['A', 1],
            ['B', 2]
          ]
        }
      });

    const jsonRows = path.join(tempDir, 'rows.json');
    await fs.writeFile(jsonRows, JSON.stringify([
      ['label', 'value'],
      ['A', '3']
    ]), 'utf8');
    await expect(importVisualizationSource({ filePath: jsonRows }))
      .resolves.toMatchObject({
        source: { rows: [['label', 'value'], ['A', '3']] }
      });

    const jsonPrimitive = path.join(tempDir, 'primitive.json');
    await fs.writeFile(jsonPrimitive, JSON.stringify(['A', 'B']), 'utf8');
    await expect(importVisualizationSource({ filePath: jsonPrimitive }))
      .resolves.toMatchObject({
        source: { rows: [['Value'], ['A'], ['B']] }
      });

    const jsonScalar = path.join(tempDir, 'scalar.json');
    await fs.writeFile(jsonScalar, JSON.stringify('Total'), 'utf8');
    await expect(importVisualizationSource({ filePath: jsonScalar }))
      .resolves.toMatchObject({
        source: { rows: [['Value'], ['Total']] }
      });

    const jsonChartOption = path.join(tempDir, 'chart-option.json');
    await fs.writeFile(jsonChartOption, JSON.stringify({
      chartOption: {
        series: [{ type: 'line', data: [1, 2] }]
      }
    }), 'utf8');
    await expect(importVisualizationSource({ filePath: jsonChartOption }))
      .resolves.toMatchObject({
        charts: [{ option: { series: [{ type: 'line', data: [1, 2] }] } }]
      });

    const jsonCharts = path.join(tempDir, 'charts.json');
    await fs.writeFile(jsonCharts, JSON.stringify({
      charts: [{ option: { series: [{ type: 'pie', data: [{ value: 1, name: 'A' }] }] } }]
    }), 'utf8');
    await expect(importVisualizationSource({ filePath: jsonCharts, type: 'pie-chart' }))
      .resolves.toMatchObject({
        type: 'pie-chart',
        charts: [{ option: { series: [{ type: 'pie', data: [{ value: 1, name: 'A' }] }] } }]
      });

    const csv = path.join(tempDir, 'limited.csv');
    await fs.writeFile(csv, 'label,value\n,not-a-number\nB,4\n', 'utf8');
    const csvAsset = await importVisualizationSource({ filePath: csv, maxRows: 2 });
    expect(csvAsset.source?.format).toBe('csv');
    expect(csvAsset.source?.rows).toEqual([
      ['label', 'value'],
      ['', 'not-a-number']
    ]);
    expect((csvAsset.charts[0].option.series as Array<{ data: number[] }>)[0].data).toEqual([0]);

    const mappedCsv = path.join(tempDir, 'mapped.csv');
    await fs.writeFile(mappedCsv, 'Country,Revenue,Notes\nRomania,10,a\nFrance,20,b\n', 'utf8');
    const mappedAsset = await importVisualizationSource({
      filePath: mappedCsv,
      mapping: parseImportMapping('label=Country,value=Revenue')
    });
    expect(mappedAsset.source?.rows).toEqual([
      ['label', 'value'],
      ['Romania', '10'],
      ['France', '20']
    ]);
    expect((mappedAsset.charts[0].option.series as Array<{ data: number[] }>)[0].data).toEqual([10, 20]);

    const xml = path.join(tempDir, 'source.xml');
    await fs.writeFile(xml, '<root><label>A</label><value>5</value></root>', 'utf8');
    await expect(importVisualizationSource({ filePath: xml }))
      .resolves.toMatchObject({
        source: {
          format: 'xml',
          rows: [
            ['root', { label: 'A', value: '5' }]
          ]
        }
      });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    sheet.addRow(['label', 'value']);
    sheet.addRow(['A', 10]);
    sheet.addRow(['B', 11]);
    const xlsx = path.join(tempDir, 'source.xlsx');
    await workbook.xlsx.writeFile(xlsx);
    await expect(importVisualizationSource({ filePath: xlsx, maxRows: 2 }))
      .resolves.toMatchObject({
        source: {
          format: 'xlsx',
          rows: [['label', 'value'], ['A', 10]]
        }
      });
  });

  it('rejects malformed and unsupported local import sources clearly', async () => {
    const unsupported = path.join(tempDir, 'image.png');
    await fs.writeFile(unsupported, 'not image data', 'utf8');
    await expect(importVisualizationSource({ filePath: unsupported }))
      .rejects.toMatchObject({
        code: 'ILLUSTRY_FILE_REJECTED',
        status: 400
      });

    const malformed = path.join(tempDir, 'broken.json');
    await fs.writeFile(malformed, '{', 'utf8');
    await expect(importVisualizationSource({ filePath: malformed }))
      .rejects.toBeInstanceOf(SyntaxError);

    const emptyWorkbook = new ExcelJS.Workbook();
    const emptyXlsx = path.join(tempDir, 'empty.xlsx');
    await emptyWorkbook.xlsx.writeFile(emptyXlsx);
    const asset = await importVisualizationSource({ filePath: emptyXlsx });
    expect(asset.source?.rows).toEqual([]);
    expect((asset.charts[0].option.series as Array<{ data: number[] }>)[0].data).toEqual([]);

    expect(() => parseImportMapping('bad')).toThrow('Invalid import mapping');
    expect(() => parseImportMapping('color=Country')).toThrow('Unsupported import mapping key');

    const mapped = path.join(tempDir, 'missing-column.csv');
    await fs.writeFile(mapped, 'Country,Revenue\nRomania,10\n', 'utf8');
    await expect(importVisualizationSource({
      filePath: mapped,
      mapping: { label: 'Missing', value: 'Revenue' }
    })).rejects.toMatchObject({
      code: 'ILLUSTRY_IMPORT_MAPPING_COLUMN_NOT_FOUND',
      status: 400
    });
  });

  it('parses import mapping aliases and supports numeric column indexes', () => {
    expect(parseImportMapping()).toEqual({});
    expect(parseImportMapping('x=0,y=2')).toEqual({ label: '0', value: '2' });
    expect(parseImportMapping('category=Country,amount=Revenue')).toEqual({
      label: 'Country',
      value: 'Revenue'
    });
    expect(parseImportMapping('name=Country,value=Revenue')).toEqual({
      label: 'Country',
      value: 'Revenue'
    });
    expect(() => parseImportMapping('label=')).toThrow('Missing column name');

    const rows = [
      ['Country', 'Ignored', 'Revenue'],
      ['Romania', 'x', '10']
    ];
    expect(applyImportMapping(rows, { label: '0', value: '2' })).toEqual([
      ['label', 'value'],
      ['Romania', '10']
    ]);
    expect(applyImportMapping(rows)).toBe(rows);
    expect(applyImportMapping([], { value: '0' })).toEqual([
      ['label', 'value']
    ]);
  });

  it('manages local store reads, updates, deletes, and export writes', async () => {
    const store = new LocalIllustryStore({ rootDir: tempDir });
    expect(await store.readAssets()).toEqual([]);

    const defaultStore = new LocalIllustryStore();
    expect(defaultStore.rootDir).toBe(path.resolve(process.cwd(), '.illustry'));

    const saved = await store.saveAsset(makeAsset({
      id: undefined as unknown as string,
      createdAt: undefined as unknown as string,
      updatedAt: undefined as unknown as string,
      name: ' Messy / Chart? '
    }));
    expect(saved.id).toMatch(/^visualization_/);
    expect(saved.createdAt).toBeTruthy();
    expect(saved.updatedAt).toBeTruthy();

    const updated = await store.saveAsset({
      ...saved,
      name: 'Clean Chart'
    });
    expect(updated.id).toBe(saved.id);
    expect(await store.getAsset('Clean Chart')).toMatchObject({ id: saved.id });
    expect(await store.requireAsset(saved.id)).toMatchObject({ name: 'Clean Chart' });

    const target = await store.writeExportFile({
      filename: ' report / bad?.json ',
      buffer: Buffer.from('{}')
    });
    expect(path.basename(target)).toBe('report-bad-.json');
    await expect(fs.readFile(target, 'utf8')).resolves.toBe('{}');

    await expect(store.requireAsset('missing')).rejects.toMatchObject({
      code: 'ILLUSTRY_ASSET_NOT_FOUND',
      status: 404
    });
    expect(await store.deleteAsset('missing')).toBe(false);
    expect(await store.deleteAsset(saved.id)).toBe(true);
    expect(await store.readAssets()).toEqual([]);
  });

  it('reports corrupt local store data as an Illustry error', async () => {
    await fs.writeFile(path.join(tempDir, 'assets.json'), '{', 'utf8');
    const store = new LocalIllustryStore({ rootDir: tempDir });
    await expect(store.readAssets()).rejects.toMatchObject({
      code: 'ILLUSTRY_LOCAL_STORE_READ_FAILED'
    });

    await fs.writeFile(path.join(tempDir, 'assets.json'), JSON.stringify({ assets: { bad: true } }), 'utf8');
    await expect(store.readAssets()).resolves.toEqual([]);
  });

  it('creates all supported local export formats and dashboard bundles', async () => {
    const asset = makeAsset({
      name: 'All Formats',
      charts: [{
        title: 'Primary',
        option: {
          xAxis: { type: 'category', data: ['A'] },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: [1] }]
        },
        width: 'bad' as unknown as number,
        height: 99999
      }]
    });

    for (const format of ['json', 'svg', 'png', 'jpg', 'webp', 'pdf', 'word', 'ppt'] as const) {
      const bundle = await createLocalExportBundle({ asset, formats: [format] });
      expect(bundle.bundled).toBe(false);
      expect(bundle.filename).toContain(format === 'word' ? '.docx' : format === 'ppt' ? '.pptx' : `.${format}`);
      expect(bundle.buffer.length).toBeGreaterThan(20);
    }

    const dashboard = makeAsset({
      kind: 'dashboard',
      name: 'Executive & Dashboard',
      charts: [
        makeAsset().charts[0],
        {
          option: {
            xAxis: { type: 'category', data: ['C'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [5] }]
          }
        },
        null as unknown as IllustryLocalAsset['charts'][number]
      ]
    });
    const svg = renderSvg(dashboard, [
      { ...dashboard.charts[0], title: 'One', width: 320, height: 240 },
      { ...dashboard.charts[1], title: 'Two', width: 320, height: 240 }
    ]);
    expect(svg).toContain('Executive &amp; Dashboard');
    expect(svg).toContain('<g transform=');

    const componentHtml = buildWebComponentHtml(dashboard, [
      { ...dashboard.charts[0], title: 'One', width: 320, height: 240 },
      {
        ...dashboard.charts[1],
        width: 320,
        height: 240,
        option: { series: [{ type: 'wordCloud', data: [] }] as never }
      } as Required<IllustryLocalAsset['charts'][number]>
    ]);
    expect(componentHtml).toContain('<illustry-dashboard>');
    expect(componentHtml).toContain('\\u0026');
    expect(componentHtml).toContain('wordcloud');

    const bundle = await createLocalExportBundle({
      asset: dashboard,
      formats: ['json', 'svg', 'web-component']
    });
    expect(bundle.bundled).toBe(true);
    const zip = await JSZip.loadAsync(bundle.buffer);
    expect(zip.file('Executive-&-Dashboard.svg')).toBeTruthy();
    expect(zip.file('Executive-&-Dashboard.webcomponent.html')).toBeTruthy();

    const largerDashboardSvg = renderSvg(makeAsset({ name: 'Four Up' }), [
      { ...makeAsset().charts[0], title: 'One', width: 240, height: 180 },
      { ...makeAsset().charts[0], title: 'Two', width: 240, height: 180 },
      { ...makeAsset().charts[0], title: 'Three', width: 240, height: 180 },
      { ...makeAsset().charts[0], title: 'Four', width: 240, height: 180 }
    ]);
    expect(largerDashboardSvg).toContain('Four Up');
  }, 30000);

  it('validates local export selections and missing chart data', async () => {
    expect(isIllustryExportFormat('svg')).toBe(true);
    expect(isIllustryExportFormat('exe')).toBe(false);
    expect(normalizeFormats(['svg', 'svg', 'bad'])).toEqual(['svg']);
    expect(() => normalizeFormats(['bad'])).toThrow('Select at least one export option.');
    await expect(createLocalExportBundle({
      asset: makeAsset({ charts: [] }),
      formats: ['json']
    })).rejects.toMatchObject({
      code: 'ILLUSTRY_EXPORT_NO_CHARTS',
      status: 400
    });
    await expect(createLocalExportBundle({
      asset: makeAsset({ charts: null as unknown as IllustryLocalAsset['charts'] }),
      formats: ['json']
    })).rejects.toMatchObject({
      code: 'ILLUSTRY_EXPORT_NO_CHARTS'
    });
  });

  it('covers upload validation and shared error helpers', () => {
    expect(formatUploadBytes(1024)).toBe('1024 bytes');
    expect(formatUploadBytes(2 * 1024 * 1024)).toBe('2 MB');
    expect(sanitizeFilename(' /%:*|"<>  ')).toBe('illustry');
    expect(validateUploadedFileMetadata({
      originalname: 'template.pdf',
      mimetype: 'application/pdf',
      size: 100
    }, 'export-template')).toEqual({ valid: true });
    expect(validateUploadedFileMetadata({
      name: 'template.docx',
      size: 100
    }, 'export-template')).toEqual({ valid: true });
    expect(validateUploadedFileMetadata({
      size: 100
    }, 'export-template')).toEqual({
      valid: false,
      message: 'Unsupported file type. Accepted files: .xlsx, .pdf, .docx, .pptx.'
    });
    expect(validateUploadedFileMetadata({
      originalname: 'template.pdf',
      mimetype: 'text/plain',
      size: 100
    }, 'export-template')).toEqual({
      valid: false,
      message: 'Unsupported file content type. Accepted files: .xlsx, .pdf, .docx, .pptx.'
    });
    expect(validateUploadedFileMetadata({
      name: 'template.exe',
      type: 'application/octet-stream',
      size: 100
    }, 'export-template')).toEqual({
      valid: false,
      message: 'Unsupported file type. Accepted files: .xlsx, .pdf, .docx, .pptx.'
    });

    const existing = new IllustryError('Already Illustry', { code: 'KNOWN' });
    expect(toIllustryError(existing)).toBe(existing);
    expect(toIllustryError(new Error('native failed'))).toMatchObject({
      message: 'native failed',
      code: 'ILLUSTRY_OPERATION_FAILED'
    });
    expect(toIllustryError(new Error(''), 'empty fallback')).toMatchObject({
      message: 'empty fallback',
      code: 'ILLUSTRY_OPERATION_FAILED'
    });
    expect(toIllustryError('nope', 'fallback')).toMatchObject({
      message: 'fallback',
      details: { value: 'nope' }
    });
    const caused = new IllustryError('with cause', { cause: new Error('cause') });
    expect((caused as Error & { cause?: unknown }).cause).toBeInstanceOf(Error);
    expect(new IllustryError('default')).toMatchObject({
      code: 'ILLUSTRY_ERROR',
      status: undefined,
      details: undefined
    });
  });

  it('persists API session cookies and calls auth/account flows with real routes', async () => {
    const calls: Array<{ url: string; init?: Parameters<NonNullable<IllustryApiClientOptions['fetchImpl']>>[1] }> = [];
    const user = makeUser();
    const fetchImpl: NonNullable<IllustryApiClientOptions['fetchImpl']> = async (input, init) => {
      const url = input.toString();
      const pathname = new URL(url).pathname;
      calls.push({ url, init });
      if (pathname === '/health') {
        return new Response('down', { status: 503 });
      }
      if (pathname === '/') {
        return new Response('ok');
      }
      if (pathname === '/api/auth/login') {
        return new Response(JSON.stringify({ user }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'illustry_session=session-one; Path=/; HttpOnly, illustry_csrf=csrf%20one; Path=/'
          }
        });
      }
      if (pathname === '/api/auth/register') {
        expect(init?.body).toBeInstanceOf(FormData);
        return new Response(JSON.stringify({ user: { ...user, id: 'user_2' } }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (pathname === '/api/auth/csrf') {
        return new Response(JSON.stringify({ csrfToken: 'rotated-token' }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (pathname === '/api/auth/me') {
        return new Response(JSON.stringify(user), {
          headers: { 'content-type': 'application/json' }
        });
      }
      if (pathname === '/api/auth/logout') {
        return new Response(JSON.stringify({ ok: true }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'illustry_session=; Max-Age=0; Path=/, illustry_csrf=; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        });
      }
      return new Response(JSON.stringify({ ok: true, route: pathname }), {
        headers: { 'content-type': 'application/json' }
      });
    };
    const client = new IllustryApiClient({
      baseUrl: 'http://illustry.local////',
      token: 'token',
      locale: 'ro',
      fetchImpl
    });

    expect(client.baseUrl).toBe('http://illustry.local');
    await expect(client.health()).resolves.toBe('ok');
    await expect(client.login({ email: 'ada@example.com', password: 'secret' }))
      .resolves.toEqual({ user });
    expect(client.getSessionSnapshot()).toMatchObject({
      baseUrl: 'http://illustry.local',
      cookie: 'illustry_session=session-one; illustry_csrf=csrf%20one',
      csrfToken: 'csrf one',
      user
    });
    await expect(client.signup({ email: 'new@example.com', password: 'secret', name: 'New User' }))
      .resolves.toMatchObject({ user: { id: 'user_2' } });
    await expect(client.me()).resolves.toEqual(user);
    await expect(client.refresh()).resolves.toMatchObject({ route: '/api/auth/refresh' });
    await expect(client.rotateCsrf()).resolves.toEqual({ csrfToken: 'rotated-token' });
    expect(client.getSessionSnapshot().csrfToken).toBe('rotated-token');
    await expect(client.verifyEmail('token')).resolves.toMatchObject({ route: '/api/auth/verify-email' });
    await expect(client.verifyEmailCode('ada@example.com', '123456')).resolves.toMatchObject({ route: '/api/auth/verify-email-code' });
    await expect(client.resendVerification()).resolves.toMatchObject({ route: '/api/auth/resend-verification' });
    await expect(client.resendVerification('ada@example.com')).resolves.toMatchObject({ route: '/api/auth/resend-verification' });
    await expect(client.requestPasswordReset('ada@example.com')).resolves.toMatchObject({ route: '/api/auth/forgot-password' });
    await expect(client.resetPassword('reset-token', 'next-password')).resolves.toMatchObject({ route: '/api/auth/reset-password' });
    await expect(client.logout()).resolves.toEqual({ ok: true });
    expect(client.getSessionSnapshot()).toMatchObject({
      cookie: undefined,
      csrfToken: undefined,
      user: null
    });

    const authenticatedCall = calls.find((call) => new URL(call.url).pathname === '/api/auth/me');
    const headers = new Headers(authenticatedCall?.init?.headers);
    expect(headers.get('authorization')).toBe('Bearer token');
    expect(headers.get('cookie')).toContain('illustry_session=session-one');
    expect(headers.get('x-csrf-token')).toBe('csrf one');
    expect(headers.get('x-illustry-locale')).toBe('ro');
    expect(headers.get('accept-language')).toBe('ro');
  });

  it('calls API resource management routes consistently', async () => {
    const calls: Array<{ url: string; init?: Parameters<NonNullable<IllustryApiClientOptions['fetchImpl']>>[1] }> = [];
    const fetchImpl: NonNullable<IllustryApiClientOptions['fetchImpl']> = async (input, init) => {
      calls.push({ url: input.toString(), init });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' }
      });
    };
    const client = new IllustryApiClient({ baseUrl: 'http://illustry.local', fetchImpl });

    await client.listProjects();
    await client.listVisualizations();
    await client.listDashboards();
    await client.createProject({ projectName: 'Project', projectDescription: 'About', isActive: true });
    await client.updateProject({ name: 'Project', description: 'Next', isActive: false });
    await client.deleteProject('Project');
    await client.findProject('Project/One');
    await client.findVisualization('Viz/One', 'bar-chart');
    await client.findDashboard('Dash/One', false);
    await client.findDashboard('Dash/Default');
    await client.createDashboard({ name: 'Dash', visualizations: [] });
    await client.updateDashboard({ name: 'Dash', layouts: {} });
    await client.deleteDashboard('Dash');
    await client.updateVisualization({ name: 'Viz', theme: {} });
    await client.deleteVisualization({ name: 'Viz', projectName: 'Project' });

    expect(calls.map((call) => `${call.init?.method || 'GET'} ${new URL(call.url).pathname}`)).toEqual([
      'POST /api/projects',
      'POST /api/visualizations',
      'POST /api/dashboards',
      'POST /api/project',
      'PUT /api/project',
      'DELETE /api/project',
      'POST /api/project/Project%2FOne',
      'POST /api/visualization/Viz%2FOne',
      'POST /api/dashboard/Dash%2FOne',
      'POST /api/dashboard/Dash%2FDefault',
      'POST /api/dashboard',
      'PUT /api/dashboard',
      'DELETE /api/dashboard',
      'PUT /api/visualization',
      'DELETE /api/visualization'
    ]);
    const findDashboardCall = calls.find((call) => new URL(call.url).pathname === '/api/dashboard/Dash%2FOne');
    expect(JSON.parse(findDashboardCall?.init?.body as string)).toEqual({ fullVisualizations: false });
    const defaultFindDashboardCall = calls.find((call) => new URL(call.url).pathname === '/api/dashboard/Dash%2FDefault');
    expect(JSON.parse(defaultFindDashboardCall?.init?.body as string)).toEqual({ fullVisualizations: true });
  });

  it('normalizes API cookies, errors, downloads, and upload details', async () => {
    const source = path.join(tempDir, 'payload.csv');
    await fs.writeFile(source, 'label,value\nA,1\n', 'utf8');

    const calls: Array<{ url: string; init?: Parameters<NonNullable<IllustryApiClientOptions['fetchImpl']>>[1] }> = [];
    const fetchImpl: NonNullable<IllustryApiClientOptions['fetchImpl']> = async (input, init) => {
      const url = input.toString();
      const parsed = new URL(url);
      calls.push({ url, init });
      if (parsed.pathname === '/api/projects') {
        expect(parsed.search).toBe('');
        return new Response(JSON.stringify({ items: [] }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'bad-cookie, theme=dark; Path=/, illustry_csrf=csrf-two; Path=/'
          }
        });
      }
      if (parsed.pathname === '/api/visualizations') {
        return new Response(JSON.stringify({ error: 'Please login' }), {
          status: 401,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (parsed.pathname === '/api/dashboards') {
        return new Response('Forbidden', { status: 403 });
      }
      if (parsed.pathname === '/api/project') {
        return new Response('', { status: 500 });
      }
      if (parsed.pathname === '/api/dashboard/export/bundle') {
        if (parsed.searchParams.get('empty') === 'true') {
          return new Response('');
        }
        if (parsed.searchParams.get('unauthorized') === 'true') {
          return new Response('', { status: 401 });
        }
        if (parsed.searchParams.get('broken') === 'true') {
          return new Response('', { status: 500 });
        }
        expect(parsed.searchParams.get('name')).toBe('Dash');
        expect(parsed.searchParams.get('full')).toBe('true');
        return new Response(Buffer.from('bundle'), {
          headers: { 'content-type': 'application/zip' }
        });
      }
      if (parsed.pathname === '/api/visualization/export/bundle') {
        return new Response('nope', { status: 500 });
      }
      if (parsed.pathname === '/api/visualization') {
        return new Response(JSON.stringify({ uploaded: true }), {
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' }
      });
    };
    const client = new IllustryApiClient({
      baseUrl: 'http://illustry.local',
      cookie: 'illustry_session=session; stale=value',
      csrfToken: 'csrf-one',
      fetchImpl
    });

    await expect(client.listProjects()).resolves.toEqual({ items: [] });
    expect(client.getSessionSnapshot()).toMatchObject({
      cookie: 'illustry_session=session; stale=value; theme=dark; illustry_csrf=csrf-two',
      csrfToken: 'csrf-two'
    });
    await expect(client.listVisualizations()).rejects.toMatchObject({
      code: 'ILLUSTRY_SESSION_EXPIRED',
      status: 401,
      message: 'Please login'
    });
    await expect(client.listDashboards()).rejects.toMatchObject({
      code: 'ILLUSTRY_PERMISSION_DENIED',
      status: 403,
      message: 'Forbidden'
    });
    await expect(client.createProject({ projectName: 'Broken' })).rejects.toMatchObject({
      code: 'ILLUSTRY_API_REQUEST_FAILED',
      status: 500,
      message: 'Illustry API request failed with 500.'
    });
    await expect(client.downloadExport({
      resource: 'dashboard',
      name: 'Dash',
      query: { full: true, skip: undefined },
      body: { formats: ['zip'] }
    })).resolves.toMatchObject({
      filename: 'Dash.bin',
      mimeType: 'application/zip',
      buffer: Buffer.from('bundle')
    });
    await expect(client.downloadExport({
      resource: 'dashboard',
      name: 'Dash',
      query: { empty: true },
      body: {}
    })).resolves.toMatchObject({
      filename: 'Dash.bin',
      mimeType: 'text/plain;charset=UTF-8',
      buffer: Buffer.alloc(0)
    });
    await expect(client.downloadExport({
      resource: 'dashboard',
      name: 'Dash',
      query: { unauthorized: true },
      body: {}
    })).rejects.toMatchObject({
      code: 'ILLUSTRY_SESSION_EXPIRED',
      status: 401,
      message: 'Illustry export failed with 401.'
    });
    await expect(client.downloadExport({
      resource: 'dashboard',
      name: 'Dash',
      query: { broken: true },
      body: {}
    })).rejects.toMatchObject({
      code: 'ILLUSTRY_EXPORT_REQUEST_FAILED',
      status: 500,
      message: 'Illustry export failed with 500.'
    });
    await expect(client.downloadExport({
      resource: 'visualization',
      name: 'Viz',
      body: {}
    })).rejects.toMatchObject({
      code: 'ILLUSTRY_EXPORT_REQUEST_FAILED',
      status: 500,
      message: 'nope'
    });
    await expect(client.uploadVisualizationSource({
      filePath: source,
      fileDetails: { source: 'cli' },
      fullDetails: true
    })).resolves.toEqual({ uploaded: true });
    await expect(client.uploadRawFile('/api/visualization', source))
      .resolves.toEqual({ uploaded: true });

    const uploadCall = calls.find((call) => call.init?.body instanceof FormData);
    expect(uploadCall?.init?.body).toBeInstanceOf(FormData);
  });

  it('handles API response parsing fallbacks and node set-cookie helpers', async () => {
    const calls: string[] = [];
    const fetchImpl: NonNullable<IllustryApiClientOptions['fetchImpl']> = async (input) => {
      const pathname = new URL(input.toString()).pathname;
      calls.push(pathname);
      if (pathname === '/api/projects') {
        const response = new Response('not json', {
          headers: { 'content-type': 'application/json' }
        });
        Object.defineProperty(response.headers, 'getSetCookie', {
          value: () => [
            'illustry_session=node-session; Path=/, theme=light; Path=/',
            'illustry_csrf=node-csrf; Path=/'
          ]
        });
        return response;
      }
      if (pathname === '/api/visualizations') {
        return new Response('not json', {
          status: 500,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (pathname === '/api/dashboards') {
        return new Response('ok');
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' }
      });
    };
    const client = new IllustryApiClient({ baseUrl: 'http://illustry.local', fetchImpl });

    await expect(client.listProjects()).resolves.toBeUndefined();
    expect(client.getSessionSnapshot()).toMatchObject({
      cookie: 'illustry_session=node-session; theme=light; illustry_csrf=node-csrf',
      csrfToken: 'node-csrf'
    });
    await expect(client.listVisualizations()).rejects.toMatchObject({
      message: 'Illustry API request failed with 500.',
      code: 'ILLUSTRY_API_REQUEST_FAILED'
    });
    await expect(client.listDashboards()).resolves.toBe('ok');
    expect(calls).toEqual(['/api/projects', '/api/visualizations', '/api/dashboards']);
  });

  it('handles browser-style missing and clearing set-cookie headers', async () => {
    const fetchImpl: NonNullable<IllustryApiClientOptions['fetchImpl']> = async (input) => {
      const pathname = new URL(input.toString()).pathname;
      if (pathname === '/api/projects') {
        const response = new Response(JSON.stringify({ items: [] }), {
          headers: { 'content-type': 'application/json' }
        });
        Object.defineProperty(response.headers, 'getSetCookie', { value: undefined });
        return response;
      }
      if (pathname === '/api/visualizations') {
        const response = new Response(JSON.stringify({ items: [] }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'illustry_session=; Max-Age=0; Path=/, illustry_csrf=; Max-Age=0; Path=/'
          }
        });
        Object.defineProperty(response.headers, 'getSetCookie', { value: undefined });
        return response;
      }
      const response = new Response('ok', { headers: {} });
      Object.defineProperty(response.headers, 'getSetCookie', { value: undefined });
      return response;
    };
    const client = new IllustryApiClient({
      baseUrl: 'http://illustry.local',
      cookie: 'illustry_session=session',
      fetchImpl
    });

    await expect(client.listProjects()).resolves.toEqual({ items: [] });
    expect(client.getSessionSnapshot().cookie).toBe('illustry_session=session');
    await expect(client.listVisualizations()).resolves.toEqual({ items: [] });
    expect(client.getSessionSnapshot()).toMatchObject({
      cookie: undefined
    });
    await expect(client.listDashboards()).resolves.toBe('ok');

    const csrfClearClient = new IllustryApiClient({
      baseUrl: 'http://illustry.local',
      cookie: 'illustry_csrf=csrf',
      csrfToken: 'csrf',
      fetchImpl: async () => {
        const response = new Response(JSON.stringify({ items: [] }), {
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'illustry_csrf=; Max-Age=0; Path=/'
          }
        });
        Object.defineProperty(response.headers, 'getSetCookie', { value: undefined });
        return response;
      }
    });
    await expect(csrfClearClient.listProjects()).resolves.toEqual({ items: [] });
    expect(csrfClearClient.getSessionSnapshot()).toMatchObject({
      cookie: undefined,
      csrfToken: undefined
    });
  });

  it('requires API runtime configuration and can use global fetch', async () => {
    expect(() => new IllustryApiClient({
      baseUrl: '',
      fetchImpl: async () => new Response()
    })).toThrow('A base URL is required');

    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    })) as unknown as typeof fetch;
    const client = new IllustryApiClient({ baseUrl: 'http://illustry.local' });
    await expect(client.listProjects()).resolves.toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalled();

    Reflect.deleteProperty(globalThis, 'fetch');
    expect(() => new IllustryApiClient({ baseUrl: 'http://illustry.local' }))
      .toThrow('Fetch is not available in this runtime.');
    global.fetch = originalFetch;
  });
});
