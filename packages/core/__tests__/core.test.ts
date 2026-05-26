import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import JSZip from 'jszip';
import {
  LocalIllustryStore,
  UPLOAD_CONSTRAINTS,
  createLocalExportBundle,
  importVisualizationSource,
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

  it('rejects huge files from metadata before processing content', () => {
    const result = validateUploadedFileMetadata({
      originalname: 'too-large.csv',
      size: UPLOAD_CONSTRAINTS['visualization-source'].maxBytes + 1
    }, 'visualization-source');
    expect(result.valid).toBe(false);
  });
});
