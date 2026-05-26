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

  it('rejects huge files from metadata before processing content', () => {
    const result = validateUploadedFileMetadata({
      originalname: 'too-large.csv',
      size: UPLOAD_CONSTRAINTS['visualization-source'].maxBytes + 1
    }, 'visualization-source');
    expect(result.valid).toBe(false);
  });
});
