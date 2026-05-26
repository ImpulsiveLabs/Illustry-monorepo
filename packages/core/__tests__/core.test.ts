import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import JSZip from 'jszip';
import {
  IllustryApiClient,
  type IllustryApiClientOptions,
  LocalIllustryStore,
  UPLOAD_CONSTRAINTS,
  createLocalExportBundle,
  importVisualizationSource,
  parseExportFormats,
  validateUploadedFileMetadata
} from '../src';

const makeTempDir = () => fs.mkdtemp(path.join(os.tmpdir(), 'illustry-core-'));

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
});
